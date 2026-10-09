import { describe, it, expect, afterEach, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api, internal } from "./_generated/api";
import { assertTrustedAIBaseUrl } from "./_shared/aiProviders";
import { checkUrl, imagePolicy } from "./mcp/_vendor/mcpFiles";
import { safeTemplateColor } from "./roadmap/templates";
import { mintFileToken } from "./_shared/signedFileUrl";
import { signUnsubscribeToken } from "./_shared/email";

const modules = Object.fromEntries(Object.entries(import.meta.glob("./**/*.{ts,js}")).filter(([p]) => !p.endsWith(".d.ts") && !/\.(test|config)\./.test(p)));
const setup = () => convexTest(schema, modules);
type Tester = ReturnType<typeof setup>;
const pdf = new Blob(["%PDF-1.7\nverified bytes"], { type: "application/pdf" });
const user = (t: Tester) => t.run(ctx => ctx.db.insert("users", { email: "owner@example.test" }));
const identity = (id: string) => ({ subject: `${id}|session` });
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

async function upload(t: Tester, owner: string) {
  vi.stubEnv("CONVEX_SITE_URL", "https://site.example.test");
  const url = await t.withIdentity(identity(owner)).mutation(api.files.mutations.generateUploadUrl, {});
  const path = new URL(url).pathname + new URL(url).search;
  const response = await t.fetch(path, { method: "POST", body: pdf, headers: { "Content-Type": pdf.type } });
  expect(response.status).toBe(200);
  const { storageId } = await response.json();
  return { path, storageId: storageId as string };
}

describe("upload ownership and lifecycle", () => {
  it("streams expiring MCP reads without revealing a storage bearer URL", async () => {
    vi.stubEnv("FILE_URL_SECRET", "test-only-signing-secret");
    const t = setup(); const owner = await user(t); const { storageId } = await upload(t, owner);
    const fileId = await t.withIdentity(identity(owner)).mutation(api.files.mutations.saveFile, { storageId, fileName: "proof.pdf", fileType: pdf.type, fileSize: pdf.size });
    const { token } = await mintFileToken({ fileId, userId: owner });
    const response = await t.fetch(`/files/read?t=${encodeURIComponent(token)}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.text()).toBe(await pdf.text());
    vi.useFakeTimers(); vi.setSystemTime(Date.now() + 3_601_000);
    expect((await t.fetch(`/files/read?t=${encodeURIComponent(token)}`)).status).toBe(404);
  });

  it("blocks ambiguous legacy blobs for every owner", async () => {
    const t = setup(); const alice = await user(t); const bob = await user(t);
    const storageId = await t.run(ctx => ctx.storage.store(pdf));
    const ids = await t.run(async ctx => Promise.all([alice, bob].map(uploadedBy => ctx.db.insert("files", { storageId, uploadedBy, tenantId: uploadedBy.toString(), fileName: "legacy.pdf", fileType: pdf.type, fileSize: pdf.size, createdAt: Date.now() }))));
    for (const owner of [alice, bob]) expect(await t.withIdentity(identity(owner)).query(api.files.queries.getFileUrl, { storageId })).toBeNull();
    await expect(t.withIdentity(identity(alice)).mutation(api.files.mutations.deleteFile, { fileId: ids[0] })).rejects.toThrow(/administrator/);
    await expect(t.mutation(internal.mcp.data.files.deleteFile, { userId: bob, fileId: ids[1] })).rejects.toThrow(/tidak ditemukan/);
    expect(await t.run(async ctx => (await ctx.storage.get(storageId)) !== null)).toBe(true);
  });
  it("binds bytes to the issuer, rejects replay and false metadata, and consumes registration", async () => {
    const t = setup(); const alice = await user(t); const bob = await user(t);
    const { path, storageId } = await upload(t, alice);
    const args = { storageId, fileName: "proof.pdf", fileType: pdf.type, fileSize: pdf.size };
    await expect(t.withIdentity(identity(bob)).mutation(api.files.mutations.saveFile, args)).rejects.toThrow(/tidak ditemukan/);
    await expect(t.withIdentity(identity(alice)).mutation(api.files.mutations.saveFile, { ...args, fileSize: 1 })).rejects.toThrow(/Metadata/);
    expect((await t.fetch(path, { method: "POST", body: pdf })).status).toBe(403);
    const fileId = await t.withIdentity(identity(alice)).mutation(api.files.mutations.saveFile, args);
    const file = await t.run(ctx => ctx.db.get(fileId));
    expect(file?.uploadedBy).toBe(alice);
    expect(await t.run(ctx => ctx.db.query("uploadIntents").collect())).toEqual([]);
    await expect(t.withIdentity(identity(bob)).mutation(api.files.mutations.saveFile, args)).rejects.toThrow(/tidak ditemukan/);
    await expect(t.mutation(internal.mcp.data.files.registerFile, { ...args, userId: bob })).rejects.toThrow(/tidak ditemukan/);
  });

  it("refuses unowned storage IDs even when the blob exists", async () => {
    const t = setup(); const owner = await user(t);
    const storageId = await t.run(ctx => ctx.storage.store(pdf));
    await expect(t.withIdentity(identity(owner)).mutation(api.files.mutations.saveFile, { storageId, fileName: "x.pdf", fileType: pdf.type, fileSize: pdf.size })).rejects.toThrow(/unggah ulang/);
  });

  it("removes abandoned blobs while leaving registered files intact", async () => {
    const t = setup(); const owner = await user(t); const { storageId } = await upload(t, owner);
    const pending = await t.run(ctx => ctx.db.query("uploadIntents").first());
    await t.mutation(internal.files.uploads.cleanup, { id: pending!._id });
    expect(await t.run(ctx => ctx.storage.get(storageId))).toBeNull();
    const second = await upload(t, owner);
    const pending2 = await t.run(ctx => ctx.db.query("uploadIntents").first());
    await t.withIdentity(identity(owner)).mutation(api.files.mutations.saveFile, { storageId: second.storageId, fileName: "x.pdf", fileType: pdf.type, fileSize: pdf.size });
    await t.mutation(internal.files.uploads.cleanup, { id: pending2!._id });
    expect(await t.run(async ctx => (await ctx.storage.get(second.storageId)) !== null)).toBe(true);
  });

  it("rejects forged MIME and oversized bodies before storing any blob", async () => {
    const t = setup(); const owner = await user(t);
    vi.stubEnv("CONVEX_SITE_URL", "https://site.example.test");
    const cases: Record<string, string>[] = [{ "Content-Type": "image/webp" }, { "Content-Type": pdf.type, "Content-Length": "999999999" }];
    for (const headers of cases) {
      const url = new URL(await t.withIdentity(identity(owner)).mutation(api.files.mutations.generateUploadUrl, {}));
      const response = await t.fetch(url.pathname + url.search, { method: "POST", body: pdf, headers });
      expect(response.status).toBe(400);
    }
    expect(await t.run(ctx => ctx.db.system.query("_storage").collect())).toEqual([]);
  });
});

describe("public abuse and privacy boundaries", () => {
  it("bounds anonymous feedback and repeated Quick Fill calls", async () => {
    const t = setup();
    const args = { subject: "Test", message: "Test feedback" };
    for (let i = 0; i < 100; i++) await t.mutation(api.feedback.mutations.submitFeedback, args);
    await expect(t.mutation(api.feedback.mutations.submitFeedback, args)).rejects.toThrow(/Terlalu banyak/);
    const owner = await user(t);
    for (let i = 0; i < 20; i++) await t.withIdentity(identity(owner)).mutation(api.onboarding.mutations.quickFill, { payload: {} });
    await expect(t.withIdentity(identity(owner)).mutation(api.onboarding.mutations.quickFill, { payload: {} })).rejects.toThrow(/Rate limit/);
  });

  it("keeps untrusted outcome aggregates out of shared career planning", async () => {
    const t = setup();
    await t.run(async ctx => {
      const from = await ctx.db.insert("careerNodes", { slug: "junior", label: "Junior", role: "Engineer", seniority: "junior", requiredSkills: [] });
      const to = await ctx.db.insert("careerNodes", { slug: "senior", label: "Senior", role: "Engineer", seniority: "senior", requiredSkills: [] });
      await ctx.db.insert("careerEdges", { fromNodeId: from, toNodeId: to, probability: 0.4, durationMonthsMedian: 6, acquiredSkills: [], sampleSize: 20 });
    });
    const args = { startSlug: "junior", endSlug: "senior", budgetMonths: 12 };
    const before = await t.query(api.engine.graph.queries.reach, args);
    expect(before.paths.length).toBeGreaterThan(0);
    await t.run(ctx => ctx.db.insert("nodeOutcomeStats", { fromNodeSlug: "junior", toNodeSlug: "senior", applies: 999, callbacks: 999, interviews: 999, offers: 999, accepted: 999, rejected: 0, posteriorProb: 0.99, posteriorN: 9999, updatedAt: Date.now() }));
    expect(await t.query(api.engine.graph.queries.reach, args)).toEqual(before);
  });

  it("revokes sessions and refresh tokens after a successful password reset", async () => {
    vi.stubEnv("PASSWORD_RESET_HMAC_SECRET", "test-reset-secret");
    const t = setup(); const owner = await user(t);
    const rawToken = "test-reset-token";
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("test-reset-secret"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawToken)));
    const tokenHash = "hmacv1_" + Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
    const sessionId = await t.run(async ctx => {
      await ctx.db.insert("authAccounts", { userId: owner, provider: "password", providerAccountId: "owner@example.test", secret: "old" });
      await ctx.db.insert("userProfiles", { userId: owner, fullName: "Owner", location: "", targetRole: "", experienceLevel: "", role: "admin" });
      const sessionId = await ctx.db.insert("authSessions", { userId: owner, expirationTime: Date.now() + 86_400_000 });
      await ctx.db.insert("authRefreshTokens", { sessionId, expirationTime: Date.now() + 86_400_000 });
      await ctx.db.insert("passwordResetTokens", { userId: owner, tokenHash, expiresAt: Date.now() + 60_000 });
      await ctx.db.insert("oauthAccessTokens", { token: "existing-grant", userId: owner, clientId: "test-client", scope: "mcp.write", createdAt: Date.now() });
      await ctx.db.insert("oauthCodes", { code: "pending-code", codeChallenge: "challenge", codeChallengeMethod: "S256", redirectUri: "https://chatgpt.com/callback", clientId: "test-client", scope: "mcp.write", userId: owner, expiresAt: Date.now() + 60_000, consumed: false, createdAt: Date.now() });
      await ctx.db.insert("oauthClients", { clientId: "test-client", clientName: "Test", redirectUris: [], createdAt: Date.now(), ownerUserId: owner, label: "Test", clientSecretHash: "secret-hash" });
      return sessionId;
    });
    const oldClient = t.withIdentity({ subject: `${owner}|${sessionId}` });
    expect(await oldClient.query(api.auth.loggedInUser, {})).not.toBeNull();
    expect(await oldClient.query(api.admin.queries.amIAdmin, {})).toBe(false);
    await t.mutation(api.passwordReset.resetPassword, { token: rawToken, newPassword: "New-password-123!" });
    expect(await t.run(ctx => ctx.db.query("authSessions").collect())).toEqual([]);
    expect(await t.run(ctx => ctx.db.query("authRefreshTokens").collect())).toEqual([]);
    expect((await t.run(ctx => ctx.db.get(owner)))?.emailVerificationTime).toBeDefined();
    expect(await oldClient.query(api.auth.loggedInUser, {})).toBeNull();
    expect(await oldClient.query(api.profile.queries.getCurrentUser, {})).toBeNull();
    expect(await oldClient.query(api.admin.queries.amIAdmin, {})).toBe(false);
    await expect(oldClient.mutation(api.files.mutations.generateUploadUrl, {})).rejects.toThrow(/Tidak terautentikasi/);
    expect(await t.query(internal.authSessions.isRevoked, { sessionId })).toBe(true);
    await t.run(ctx => ctx.db.insert("authRevocations", { sessionId: "expired-session", expiresAt: Date.now() - 1 }));
    expect(await t.query(internal.authSessions.isRevoked, { sessionId: "expired-session" })).toBe(false);
    await t.mutation(internal.authSessions.pruneRevocations, {});
    expect((await t.run(ctx => ctx.db.query("authRevocations").collect())).map(row => row.sessionId)).toEqual([sessionId]);
    expect((await t.run(ctx => ctx.db.query("oauthAccessTokens").first()))?.revokedAt).toBeDefined();
    expect((await t.run(ctx => ctx.db.query("oauthClients").first()))?.revokedAt).toBeDefined();
    expect(await t.run(ctx => ctx.db.query("oauthCodes").collect())).toEqual([]);
    const freshId = await t.run(ctx => ctx.db.insert("authSessions", { userId: owner, expirationTime: Date.now() + 86_400_000 }));
    expect(await t.withIdentity({ subject: `${owner}|${freshId}` }).query(api.admin.queries.amIAdmin, {})).toBe(true);
    await expect(t.mutation(api.passwordReset.resetPassword, { token: rawToken, newPassword: "Again-password-123!" })).rejects.toThrow(/Token tidak valid/);
  });
  it("bounds signup at the authoritative server entry point", async () => {
    const t = setup();
    for (let i = 0; i < 20; i++) await t.mutation(internal.authLimits.checkSignup, {});
    await expect(t.mutation(internal.authLimits.checkSignup, {})).rejects.toThrow(/Terlalu banyak/);
  });

  it("uses one pageview budget even when the caller changes ipHash", async () => {
    const t = setup();
    for (let i = 0; i < 242; i++) await t.mutation(api.pageviews.mutations.record, { path: "/", ipHash: `spoof${i}` });
    expect((await t.run(ctx => ctx.db.query("pageviews").collect())).length).toBe(240);
    expect((await t.run(ctx => ctx.db.query("pageviewRateLimits").collect())).length).toBe(1);
    await t.mutation(api.pageviews.mutations.record, { path: "/reset-password/secret" });
    expect((await t.run(ctx => ctx.db.query("pageviews").collect())).length).toBe(240);
  });

  it("does not reveal cohort presence or counts on repeated reads", async () => {
    const t = setup(); const owner = await user(t);
    const before = await t.query(api.engine.dp.queries.cohortStatsDP, { targetNodeSlug: "a" });
    await t.run(ctx => ctx.db.insert("outcomeEvents", { userId: owner, kind: "apply", targetNodeSlug: "a", occurredAt: Date.now() }));
    expect(await t.query(api.engine.dp.queries.cohortStatsDP, { targetNodeSlug: "a" })).toEqual(before);
    expect(before.counts).toBeNull();
  });

  it("does not bootstrap an administrator from an unverified email", async () => {
    vi.stubEnv("ADMIN_BOOTSTRAP_EMAILS", "owner@example.test");
    const t = setup(); const owner = await user(t);
    await t.withIdentity(identity(owner)).mutation(api.seed.seedForCurrentUser, {});
    const profile = await t.run(ctx => ctx.db.query("userProfiles").first());
    expect(profile?.role).not.toBe("admin");
  });
});

describe("server-selected destinations and presentation", () => {
  it("cannot mint unsubscribe tokens from an absent server secret", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await expect(signUnsubscribeToken("owner@example.test")).rejects.toThrow(/belum diset/);
  });
  it("rejects arbitrary DNS hosts and altered provider paths", () => {
    vi.stubEnv("AI_ALLOWED_BASE_URLS", "https://approved.example.test/v1");
    for (const url of ["https://attacker.example/v1", "https://api.openai.com/other", "https://approved.example.test.evil/v1", "https://api.openai.com/v1?target=internal"]) expect(() => assertTrustedAIBaseUrl(url)).toThrow();
    expect(() => assertTrustedAIBaseUrl("https://api.openai.com/v1")).not.toThrow();
    expect(() => assertTrustedAIBaseUrl("https://approved.example.test/v1")).not.toThrow();
  });
  it("permits only exact trusted file origins", () => {
    expect(checkUrl("https://files.oaiusercontent.com/file.webp?sig=x", imagePolicy).ok).toBe(true);
    for (const url of ["https://attacker.example/file.webp", "https://files.oaiusercontent.com.attacker.example/x", "https://127.0.0.1/x"]) expect(checkUrl(url, imagePolicy).ok).toBe(false);
  });
  it("never interprets community colors as arbitrary CSS classes", () => {
    expect(safeTemplateColor("fixed inset-0 z-50")).toBe("bg-brand");
    expect(safeTemplateColor("bg-blue-500")).toBe("bg-blue-500");
  });
});
