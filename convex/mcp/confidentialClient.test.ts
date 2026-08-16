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

/* client_credentials — the headless grant.
 *
 * This one hands out a token with no human anywhere in the loop, so the checks
 * that matter are the ones that decide WHOSE data it opens and how long the
 * hole stays open after the user closes it.
 */
describe("clientCredentialsGrant", () => {
  it("trades a valid pair for a token scoped to the client's owner", async () => {
    const t = convexTest(schema, modules);
    const { clientId, clientSecret, userId } = await mintClient(t);

    const res = await t.mutation(api.mcp.oauth.clientCredentialsGrant, {
      clientId,
      clientSecret,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.scope).toBe("mcp.read mcp.write");

    const row = await t.run(async (ctx) =>
      ctx.db
        .query("oauthAccessTokens")
        .withIndex("by_token", (q) => q.eq("token", res.accessToken))
        .first(),
    );
    expect(row?.userId).toBe(userId);
  });

  it("refuses a wrong secret, a revoked client, and an unknown id alike", async () => {
    const t = convexTest(schema, modules);
    const { clientId, clientSecret, asUser } = await mintClient(t);

    const wrong = await t.mutation(api.mcp.oauth.clientCredentialsGrant, {
      clientId,
      clientSecret: `${clientSecret}x`,
    });
    expect(wrong.ok).toBe(false);

    const unknown = await t.mutation(api.mcp.oauth.clientCredentialsGrant, {
      clientId: "cp_nope",
      clientSecret,
    });
    expect(unknown.ok).toBe(false);

    // All three answer identically — a distinct message would tell a prober
    // which half of the pair they got right.
    if (!wrong.ok && !unknown.ok) {
      expect(wrong.errorDescription).toBe(unknown.errorDescription);
    }

    const listed = await asUser.query(api.mcp.oauth.listMyClients, {});
    await asUser.mutation(api.mcp.oauth.revokeMyClient, { clientRowId: listed[0]!.id });
    const revoked = await t.mutation(api.mcp.oauth.clientCredentialsGrant, {
      clientId,
      clientSecret,
    });
    expect(revoked.ok).toBe(false);
  });

  it("refuses a public DCR client, which has no owner to act as", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) =>
      ctx.db.insert("oauthClients", {
        clientId: "public-dcr-client",
        clientName: "ChatGPT",
        redirectUris: [REDIRECT],
        createdAt: Date.now(),
      }),
    );
    // The id of a public client travels in every authorize URL. If this
    // succeeded, reading one out of a browser history would be enough.
    const res = await t.mutation(api.mcp.oauth.clientCredentialsGrant, {
      clientId: "public-dcr-client",
      clientSecret: "anything",
    });
    expect(res.ok).toBe(false);
  });

  it("narrows the scope to what was asked for, and rejects nonsense", async () => {
    const t = convexTest(schema, modules);
    const { clientId, clientSecret } = await mintClient(t);

    const readOnly = await t.mutation(api.mcp.oauth.clientCredentialsGrant, {
      clientId,
      clientSecret,
      scope: "mcp.read",
    });
    expect(readOnly.ok && readOnly.scope).toBe("mcp.read");

    // Unknown scopes are dropped, not honoured — asking for admin does not
    // silently hand back both real ones.
    const junk = await t.mutation(api.mcp.oauth.clientCredentialsGrant, {
      clientId,
      clientSecret,
      scope: "admin",
    });
    expect(junk.ok).toBe(false);
  });

  it("reuses a live token instead of inserting a row per call", async () => {
    const t = convexTest(schema, modules);
    const { clientId, clientSecret } = await mintClient(t);

    const first = await t.mutation(api.mcp.oauth.clientCredentialsGrant, {
      clientId,
      clientSecret,
    });
    const second = await t.mutation(api.mcp.oauth.clientCredentialsGrant, {
      clientId,
      clientSecret,
    });
    expect(first.ok && second.ok && first.accessToken === second.accessToken).toBe(true);

    // A different scope is a different token, not a widened one.
    const readOnly = await t.mutation(api.mcp.oauth.clientCredentialsGrant, {
      clientId,
      clientSecret,
      scope: "mcp.read",
    });
    expect(first.ok && readOnly.ok && first.accessToken === readOnly.accessToken).toBe(false);

    const count = await t.run(async (ctx) =>
      (await ctx.db.query("oauthAccessTokens").collect()).length,
    );
    expect(count).toBe(2);
  });

  it("kills already-issued tokens when the client is revoked", async () => {
    const t = convexTest(schema, modules);
    const { clientId, clientSecret, asUser } = await mintClient(t);
    const granted = await t.mutation(api.mcp.oauth.clientCredentialsGrant, {
      clientId,
      clientSecret,
    });
    expect(granted.ok).toBe(true);
    if (!granted.ok) return;

    const listed = await asUser.query(api.mcp.oauth.listMyClients, {});
    await asUser.mutation(api.mcp.oauth.revokeMyClient, { clientRowId: listed[0]!.id });

    // Revoking the client used to leave its tokens alive — 30 days of access
    // after the user believed they had cut it off.
    const row = await t.run(async (ctx) =>
      ctx.db
        .query("oauthAccessTokens")
        .withIndex("by_token", (q) => q.eq("token", granted.accessToken))
        .first(),
    );
    expect(row?.revokedAt).toBeTypeOf("number");
  });
});
