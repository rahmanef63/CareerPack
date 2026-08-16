/* Confidential clients — the id + secret pair a user mints by hand.
 *
 * The whole point of a client secret is that presenting the id alone stops
 * being enough. Every test here exists because getting that backwards is easy
 * and silent: the exchange would keep succeeding, the connector would keep
 * working, and the secret would be decoration.
 */
import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<Record<string, unknown>>>;
  }
}

// Same two-glob dance as register.test.ts: from inside `convex/mcp/`, the
// parent glob misses this directory and convex-test roots paths at `../`.
const modules = Object.fromEntries(
  Object.entries({
    ...import.meta.glob("../**/*.{ts,js}"),
    ...Object.fromEntries(
      Object.entries(import.meta.glob("./**/*.{ts,js}")).map(([path, loader]) => [
        path.replace(/^\.\//, "../mcp/"),
        loader,
      ]),
    ),
  }).filter(
    ([path]) => !path.endsWith(".d.ts") && !/\.(test|spec|config)\./.test(path),
  ),
);

const REDIRECT = "https://chatgpt.com/connector_platform_oauth_redirect";
// A verifier/challenge pair is irrelevant to what these tests assert, so PKCE
// is satisfied with the one shape it always accepts: method S256 over a known
// verifier. Computed inline to keep the test independent of the helper.
const VERIFIER = "a".repeat(64);

async function s256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Signs a user in and mints a client, returning the once-only secret. */
async function mintClient(t: ReturnType<typeof convexTest>) {
  const userId = await t.run(async (ctx) => ctx.db.insert("users", {}));
  const asUser = t.withIdentity({ subject: userId });
  const created = await asUser.mutation(api.mcp.oauth.createMyClient, {
    label: "ChatGPT kantor",
  });
  return { userId: userId as Id<"users">, asUser, ...created };
}

/** Drives the consent step so there is a real code to redeem. */
async function authCode(
  asUser: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>,
  clientId: string,
) {
  const { code } = await asUser.mutation(api.mcp.oauth.createAuthCode, {
    clientId,
    redirectUri: REDIRECT,
    codeChallenge: await s256(VERIFIER),
    codeChallengeMethod: "S256",
  });
  return code;
}

describe("createMyClient", () => {
  it("returns the secret exactly once and never stores it in the clear", async () => {
    const t = convexTest(schema, modules);
    const { clientId, clientSecret, asUser } = await mintClient(t);
    expect(clientId).toMatch(/^cp_/);
    expect(clientSecret.length).toBeGreaterThan(20);

    // The row keeps a digest, not the value.
    const row = await t.run(async (ctx) =>
      ctx.db
        .query("oauthClients")
        .withIndex("by_clientId", (q) => q.eq("clientId", clientId))
        .first(),
    );
    expect(row?.clientSecretHash).toBeTruthy();
    expect(JSON.stringify(row)).not.toContain(clientSecret);

    // And no read path can reproduce it — not even for the owner.
    const listed = await asUser.query(api.mcp.oauth.listMyClients, {});
    expect(JSON.stringify(listed)).not.toContain(clientSecret);
  });

  it("refuses an anonymous caller", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.mcp.oauth.createMyClient, { label: "x" }),
    ).rejects.toThrow();
  });

  it("requires a label, so two rows are tellable apart", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => ctx.db.insert("users", {}));
    await expect(
      t.withIdentity({ subject: userId }).mutation(api.mcp.oauth.createMyClient, {
        label: "   ",
      }),
    ).rejects.toThrow(/Label/);
  });
});

describe("exchangeCode with a confidential client", () => {
  it("REFUSES the swap when the secret is missing — the id alone is not enough", async () => {
    // This is the test the whole feature rests on. A client id travels in the
    // authorize URL, so if the exchange accepted a bare id for a client that
    // has a secret, minting one would weaken the client rather than protect it.
    const t = convexTest(schema, modules);
    const { clientId, asUser } = await mintClient(t);
    const code = await authCode(asUser, clientId);

    const res = await t.mutation(api.mcp.oauth.exchangeCode, {
      code,
      codeVerifier: VERIFIER,
      redirectUri: REDIRECT,
      clientId,
    });
    expect(res.ok).toBe(false);
  });

  it("refuses a wrong secret", async () => {
    const t = convexTest(schema, modules);
    const { clientId, asUser } = await mintClient(t);
    const code = await authCode(asUser, clientId);

    const res = await t.mutation(api.mcp.oauth.exchangeCode, {
      code,
      codeVerifier: VERIFIER,
      redirectUri: REDIRECT,
      clientId,
      clientSecret: "not-the-secret",
    });
    expect(res.ok).toBe(false);
  });

  it("accepts the right secret", async () => {
    const t = convexTest(schema, modules);
    const { clientId, clientSecret, asUser } = await mintClient(t);
    const code = await authCode(asUser, clientId);

    const res = await t.mutation(api.mcp.oauth.exchangeCode, {
      code,
      codeVerifier: VERIFIER,
      redirectUri: REDIRECT,
      clientId,
      clientSecret,
    });
    expect(res.ok).toBe(true);
  });

  it("refuses a revoked client even with the correct secret", async () => {
    const t = convexTest(schema, modules);
    const { clientId, clientSecret, asUser } = await mintClient(t);
    const code = await authCode(asUser, clientId);

    const listed = await asUser.query(api.mcp.oauth.listMyClients, {});
    await asUser.mutation(api.mcp.oauth.revokeMyClient, { clientRowId: listed[0]!.id });

    const res = await t.mutation(api.mcp.oauth.exchangeCode, {
      code,
      codeVerifier: VERIFIER,
      redirectUri: REDIRECT,
      clientId,
      clientSecret,
    });
    expect(res.ok).toBe(false);
  });

  it("leaves PUBLIC clients working with no secret at all", async () => {
    // Everything RFC 7591 registration mints is public. Requiring a secret
    // from them would break every host that registers itself, which is the
    // path we actually want people on.
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => ctx.db.insert("users", {}));
    const asUser = t.withIdentity({ subject: userId });
    await t.run(async (ctx) =>
      ctx.db.insert("oauthClients", {
        clientId: "public-dcr-client",
        clientName: "DCR",
        redirectUris: [REDIRECT],
        createdAt: Date.now(),
      }),
    );
    const code = await authCode(asUser, "public-dcr-client");

    const res = await t.mutation(api.mcp.oauth.exchangeCode, {
      code,
      codeVerifier: VERIFIER,
      redirectUri: REDIRECT,
      clientId: "public-dcr-client",
    });
    expect(res.ok).toBe(true);
  });
});

describe("revokeMyClient", () => {
  it("will not let one user revoke another's client", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await mintClient(t);
    const listed = await asUser.query(api.mcp.oauth.listMyClients, {});

    const otherId = await t.run(async (ctx) => ctx.db.insert("users", {}));
    await expect(
      t
        .withIdentity({ subject: otherId })
        .mutation(api.mcp.oauth.revokeMyClient, { clientRowId: listed[0]!.id }),
    ).rejects.toThrow(/tidak ditemukan/);
  });

  it("shows only the caller's own clients", async () => {
    const t = convexTest(schema, modules);
    await mintClient(t);
    const otherId = await t.run(async (ctx) => ctx.db.insert("users", {}));
    const theirs = await t
      .withIdentity({ subject: otherId })
      .query(api.mcp.oauth.listMyClients, {});
    expect(theirs).toEqual([]);
  });
});
