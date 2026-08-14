import { internalQuery, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireUser } from "../_shared/auth";
import {
  randomToken,
  verifyPkce,
  VERIFIER_MAX,
  VERIFIER_MIN,
} from "../_shared/pkce";
import { MCP_SCOPES } from "./types";

/**
 * OAuth 2.1 + PKCE for the MCP server.
 *
 * `createAuthCode` runs in the browser, where the user IS signed in, so it
 * uses the normal `requireUser` guard. `exchangeCode` is called by the MCP
 * client's backend with no session at all — it is unauthenticated by design
 * and protected by the code being single-use, short-lived, bound to the
 * client id and redirect uri, and provable only with the PKCE verifier.
 */

const CODE_TTL_MS = 5 * 60 * 1000;
const TOKEN_TTL_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Hosts allowed to receive an authorization code.
 *
 * Without this list, `/oauth/authorize?redirect_uri=https://evil.example`
 * is an open redirect that hands a working code to whoever sent the link —
 * the user only has to be signed in and click Izinkan on a page that looks
 * exactly like the real consent screen.
 */
const REDIRECT_HOSTS = [
  "chatgpt.com",
  "chat.openai.com",
  "platform.openai.com",
  "claude.ai",
  "claude.com",
  "cursor.com",
];

export function assertAllowedRedirect(uri: string): void {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    throw new Error("redirect_uri tidak valid");
  }
  const host = url.hostname.toLowerCase();
  // Loopback is how the stdio bridges (mcp-remote, Claude Desktop, Cursor)
  // catch the redirect; they run an ephemeral http server on a random port,
  // so http and any port has to pass — but only on the loopback interface.
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") {
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("redirect_uri tidak valid");
    }
    return;
  }
  if (url.protocol !== "https:") throw new Error("redirect_uri harus HTTPS");
  const allowed = REDIRECT_HOSTS.some(
    (d) => host === d || host.endsWith(`.${d}`),
  );
  if (!allowed) throw new Error("redirect_uri tidak diizinkan");
}

// A SHA-256 challenge is 43 base64url characters. Accepting up to
// VERIFIER_MAX keeps the bound loose enough for a client that pads, while
// still refusing a megabyte of junk on an authenticated endpoint.
const B64URL = /^[A-Za-z0-9\-._~]+$/;

/**
 * Consent step. The user is signed in and looking at
 * frontend/app/oauth/authorize; this mints the code that gets handed back
 * to the MCP client over the redirect.
 */
export const createAuthCode = mutation({
  args: {
    clientId: v.string(),
    redirectUri: v.string(),
    codeChallenge: v.string(),
    codeChallengeMethod: v.string(),
    scope: v.optional(v.string()),
    resource: v.optional(v.string()),
  },
  returns: v.object({ code: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    // S256 only. `plain` makes the challenge equal to the verifier, so
    // anyone who saw the authorize URL can finish the exchange — which is
    // the entire attack PKCE exists to stop.
    if (args.codeChallengeMethod !== "S256") {
      throw new Error("code_challenge_method harus S256");
    }
    if (
      args.codeChallenge.length < VERIFIER_MIN ||
      args.codeChallenge.length > VERIFIER_MAX ||
      !B64URL.test(args.codeChallenge)
    ) {
      throw new Error("code_challenge tidak valid");
    }
    if (args.clientId.length === 0 || args.clientId.length > 200) {
      throw new Error("client_id tidak valid");
    }
    assertAllowedRedirect(args.redirectUri);

    // A client that registered itself declared its redirect URIs up front, so
    // hold it to that list — the host allowlist above is a floor for clients
    // that never registered, not a ceiling for the ones that did. Without this
    // check, registering buys the client nothing and an attacker could reuse a
    // known client_id with any chatgpt.com callback.
    const registered = await ctx.db
      .query("oauthClients")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .first();
    if (registered && !registered.redirectUris.includes(args.redirectUri)) {
      throw new Error("redirect_uri tidak terdaftar untuk client ini");
    }

    const code = randomToken(32);
    const now = Date.now();
    await ctx.db.insert("oauthCodes", {
      code,
      codeChallenge: args.codeChallenge,
      codeChallengeMethod: args.codeChallengeMethod,
      redirectUri: args.redirectUri,
      clientId: args.clientId,
      scope: args.scope?.trim() || MCP_SCOPES,
      resource: args.resource,
      userId,
      expiresAt: now + CODE_TTL_MS,
      consumed: false,
      createdAt: now,
    });
    return { code };
  },
});

/**
 * Token endpoint body. Returns a result object instead of throwing so
 * frontend/app/api/oauth/token can answer with the RFC 6749 error codes a
 * client knows how to act on — a thrown Convex error would arrive as an
 * opaque 500 with a request id glued to the front.
 */
export const exchangeCode = mutation({
  args: {
    code: v.string(),
    codeVerifier: v.string(),
    redirectUri: v.string(),
    clientId: v.string(),
  },
  returns: v.union(
    v.object({
      ok: v.literal(true),
      accessToken: v.string(),
      expiresIn: v.number(),
      scope: v.string(),
    }),
    v.object({
      ok: v.literal(false),
      error: v.string(),
      errorDescription: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const invalid = (errorDescription: string) => ({
      ok: false as const,
      error: "invalid_grant",
      errorDescription,
    });

    const row = await ctx.db
      .query("oauthCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (!row) return invalid("Kode tidak dikenal");
    if (row.consumed) return invalid("Kode sudah dipakai");
    if (row.expiresAt < Date.now()) return invalid("Kode kedaluwarsa");
    // Binding the code to the client and the redirect means a code stolen
    // from one client's callback cannot be redeemed by another.
    if (row.clientId !== args.clientId) return invalid("client_id tidak cocok");
    if (row.redirectUri !== args.redirectUri) {
      return invalid("redirect_uri tidak cocok");
    }

    const pkceFailure = await verifyPkce({
      verifier: args.codeVerifier,
      challenge: row.codeChallenge,
      method: row.codeChallengeMethod,
    });
    if (pkceFailure) return invalid(`PKCE gagal: ${pkceFailure}`);

    // Consume BEFORE minting. The other order double-issues on any retry —
    // a client that times out and repeats the POST walks away with two live
    // tokens, only one of which the user can ever see or revoke.
    await ctx.db.patch(row._id, { consumed: true });

    const token = randomToken(32);
    const now = Date.now();
    await ctx.db.insert("oauthAccessTokens", {
      token,
      userId: row.userId,
      clientId: row.clientId,
      scope: row.scope,
      resource: row.resource,
      expiresAt: now + TOKEN_TTL_MS,
      createdAt: now,
      label: row.clientId,
    });

    return {
      ok: true as const,
      accessToken: token,
      expiresIn: Math.floor(TOKEN_TTL_MS / 1000),
      scope: row.scope,
    };
  },
});

/**
 * Bearer → user. Re-checks revocation and expiry on EVERY request, not just
 * at issue time, so revoking a token cuts access on the next call rather
 * than whenever some cache decides to expire.
 */
export const lookupAccessToken = internalQuery({
  args: { token: v.string() },
  // Returns the scope alongside the user: the row has always carried it, but
  // until 2026-08-14 the dispatcher never asked, so every token behaved as
  // though it held both scopes.
  returns: v.union(v.object({ userId: v.id("users"), scope: v.string() }), v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("oauthAccessTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!row) return null;
    if (row.revokedAt !== undefined) return null;
    if (row.expiresAt < Date.now()) return null;
    return { userId: row.userId, scope: row.scope };
  },
});

/**
 * The user's own MCP connections, token material stripped.
 *
 * Returns a preview, never the token: this feeds a settings table, and a
 * bearer that round-trips through a React tree is a bearer in a browser
 * extension's reach, a screenshot, and a support chat. The preview exists
 * only so someone with two connectors can tell which row is which.
 *
 * Revoked rows are returned, not filtered. `revokedAt` is deliberately a
 * tombstone rather than a delete (see the schema comment), and hiding the
 * tombstone would leave a user who has just revoked something staring at a
 * table that looks unchanged.
 */
export const listMyTokens = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.id("oauthAccessTokens"),
      preview: v.string(),
      clientId: v.string(),
      scope: v.string(),
      label: v.union(v.string(), v.null()),
      createdAt: v.number(),
      expiresAt: v.number(),
      revokedAt: v.union(v.number(), v.null()),
    }),
  ),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("oauthAccessTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((r) => ({
        id: r._id,
        // Enough to disambiguate two rows, far too little to authenticate.
        preview: `${r.token.slice(0, 6)}…${r.token.slice(-4)}`,
        clientId: r.clientId,
        scope: r.scope,
        label: r.label ?? null,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
        revokedAt: r.revokedAt ?? null,
      }));
  },
});

/**
 * Cut off one of the caller's own connections.
 *
 * Takes the row id and re-derives ownership from the session — the id alone
 * must never be authority, or anyone who saw one in a network tab could
 * revoke a stranger's connector. Mismatch reads "tidak ditemukan" rather
 * than "forbidden", so the id space cannot be probed.
 *
 * Idempotent: revoking an already-revoked row keeps the original timestamp,
 * because the honest answer to "when did access stop" is the first revoke,
 * not the last click.
 */
export const revokeMyToken = mutation({
  args: { tokenId: v.id("oauthAccessTokens") },
  returns: v.null(),
  handler: async (ctx, { tokenId }) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(tokenId);
    if (!row || row.userId !== userId) {
      throw new Error("Koneksi tidak ditemukan");
    }
    if (row.revokedAt === undefined) {
      await ctx.db.patch(tokenId, { revokedAt: Date.now() });
    }
    return null;
  },
});
