import { internalQuery, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireUser } from "../_shared/auth";
import {
  randomToken,
  verifyPkce,
  VERIFIER_MAX,
  VERIFIER_MIN,
} from "../_shared/pkce";
import { sha256Hex } from "../_shared/clientIp";
import { MCP_SCOPES, SCOPE, parseScopes } from "./types";

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
  // Connectors Gateway — one gateway that fronts this MCP server for its own
  // users. Listed as the EXACT host, not `rahmanef.com`: the matcher below
  // also accepts any subdomain of an entry, and that domain carries a dozen
  // unrelated apps. One of them with an open redirect would be enough to walk
  // an authorization code out of here.
  "connectors.rahmanef.com",
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
    // An EMPTY list means "no extra narrowing", not "deny everything". A
    // user-minted client cannot know the host's callback URL when it is
    // created — you get that only once the host shows it to you — so it
    // registers with no list and leans on the host allowlist above. DCR
    // clients always declare theirs, so they are still held to it.
    if (
      registered &&
      registered.redirectUris.length > 0 &&
      !registered.redirectUris.includes(args.redirectUri)
    ) {
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
    // Present only for confidential clients (`client_secret_post`). Public
    // clients — everything RFC 7591 registration mints — omit it.
    clientSecret: v.optional(v.string()),
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

    // A confidential client must prove it is itself. Looked up by id rather
    // than trusting the request: whether a secret is REQUIRED is a property of
    // the registered client, never of what the caller chose to send. Skipping
    // this when `args.clientSecret` is absent would make the secret optional
    // in practice, and a client id is not a secret — it travels in the
    // authorize URL.
    const client = await ctx.db
      .query("oauthClients")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .first();
    if (client?.revokedAt !== undefined && client?.revokedAt !== null) {
      return invalid("Client sudah dicabut");
    }
    if (client?.clientSecretHash) {
      if (!args.clientSecret) return invalid("client_secret wajib untuk client ini");
      // Same opaque failure as every other branch — distinguishing "wrong
      // secret" from "unknown code" only helps someone probing.
      const presented = await sha256Hex(args.clientSecret);
      if (presented !== client.clientSecretHash) return invalid("client_secret salah");
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
 * `grant_type=client_credentials` — RFC 6749 §4.4.
 *
 * The authorization code flow assumes a human at a browser who clicks Izinkan.
 * Software the user wrote themselves has no such human: a cron job, a script,
 * another app of theirs that wants to read its own CareerPack data. Until this
 * existed, the only token they could get came out of a consent redirect and
 * was never shown to them again (`listMyTokens` returns a preview by design),
 * so there was no headless path at all.
 *
 * The token this mints acts AS THE OWNER of the client — same power as a
 * consent-granted one. That is why it is refused for anything RFC 7591
 * registration created: those rows have no `ownerUserId` and no secret, so
 * "whose data?" would have no answer, and a public client id (which travels in
 * plain sight, in authorize URLs) would be enough to mint access.
 *
 * A live token is REUSED rather than re-minted. Otherwise a client that asks
 * per request inserts a row per request, and the token table becomes a growth
 * vector with the owner's own credential as the trigger.
 *
 * LIFETIME IS THE CALLER'S CHOICE, and the default is forever. A fixed TTL
 * here was guesswork about someone else's deployment: a cron on a machine
 * nobody logs into needs a credential that does not quietly stop working at
 * 3am, while a token handed to a short-lived job should die with it. Neither
 * is more correct, so the request says which — `expiresIn` in seconds, omitted
 * or 0 for no expiry. Revocation, not expiry, is the control that always
 * works: it is in the settings screen and it takes effect on the next call.
 */
/** Floor: below a minute a token is expired before most callers can use it. */
const CC_TTL_MIN_S = 60;
/** Ceiling on a FINITE request. Anything longer is asking for forever, which
 *  is a different answer (omit the field) rather than a bigger number — a
 *  century-long "expiry" reads as a limit while behaving as none. */
const CC_TTL_MAX_S = 10 * 365 * 24 * 60 * 60;

export const clientCredentialsGrant = mutation({
  args: {
    clientId: v.string(),
    clientSecret: v.string(),
    /** Space-separated. Omitted = both scopes. Anything unknown is dropped. */
    scope: v.optional(v.string()),
    /** Seconds. Omitted or 0 = never expires. */
    expiresIn: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      ok: v.literal(true),
      accessToken: v.string(),
      // Absent = no expiry, matching RFC 6749 §5.1 where `expires_in` is
      // optional and its absence means the lifetime is not stated.
      expiresIn: v.optional(v.number()),
      scope: v.string(),
    }),
    v.object({
      ok: v.literal(false),
      error: v.string(),
      errorDescription: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    // One error for every failure mode. "Unknown client" vs "wrong secret"
    // vs "revoked" would each be a probe answered honestly.
    const deny = (errorDescription: string) => ({
      ok: false as const,
      error: "invalid_client",
      errorDescription,
    });

    const client = await ctx.db
      .query("oauthClients")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .first();
    const ownerUserId = client?.ownerUserId;
    if (!client || !client.clientSecretHash || !ownerUserId) {
      return deny("Client tidak dikenal atau tidak punya secret");
    }
    if (client.revokedAt !== undefined) {
      return deny("Client tidak dikenal atau tidak punya secret");
    }
    const presented = await sha256Hex(args.clientSecret);
    if (presented !== client.clientSecretHash) {
      return deny("Client tidak dikenal atau tidak punya secret");
    }

    // Narrowed, never widened: an unknown scope string is dropped instead of
    // failing, but asking for nothing recognisable is an error rather than a
    // silent grant of everything.
    const requested = parseScopes(args.scope ?? MCP_SCOPES);
    if (requested.length === 0) {
      return {
        ok: false as const,
        error: "invalid_scope",
        errorDescription: `Scope harus salah satu dari: ${MCP_SCOPES}`,
      };
    }
    // Fixed order so the reuse lookup below matches on a canonical string.
    const scope = [SCOPE.READ, SCOPE.WRITE]
      .filter((s) => requested.includes(s))
      .join(" ");

    // 0 and omitted both mean forever. A fractional or out-of-range number is
    // refused rather than rounded: silently turning `expires_in=30` (someone
    // meaning days) into 30 seconds is worse than saying no.
    const rawTtl = args.expiresIn ?? 0;
    if (!Number.isInteger(rawTtl) || rawTtl < 0) {
      return {
        ok: false as const,
        error: "invalid_request",
        errorDescription: "expires_in harus bilangan bulat detik, atau 0 untuk tanpa kedaluwarsa",
      };
    }
    if (rawTtl > 0 && (rawTtl < CC_TTL_MIN_S || rawTtl > CC_TTL_MAX_S)) {
      return {
        ok: false as const,
        error: "invalid_request",
        errorDescription: `expires_in harus antara ${CC_TTL_MIN_S} dan ${CC_TTL_MAX_S} detik, atau 0 untuk tanpa kedaluwarsa`,
      };
    }
    const ttlMs = rawTtl > 0 ? rawTtl * 1000 : null;

    const now = Date.now();
    const live = await ctx.db
      .query("oauthAccessTokens")
      .withIndex("by_user", (q) => q.eq("userId", ownerUserId))
      .collect();
    // Reuse only where the existing token answers the SAME question. A
    // never-expiring row cannot satisfy a request for a bounded one — that
    // would hand back more than was asked for — and a bounded row cannot
    // satisfy a request for forever. Within the bounded case, half the
    // requested lifetime remaining is the cutoff: `>= ttl` would never match
    // (the row is always a moment older than the request that made it) and a
    // fresh row per call is the growth vector reuse exists to prevent.
    const existing = live.find(
      (r) =>
        r.clientId === args.clientId &&
        r.scope === scope &&
        r.revokedAt === undefined &&
        (ttlMs === null
          ? r.expiresAt === undefined
          : r.expiresAt !== undefined && r.expiresAt - now >= ttlMs / 2),
    );
    // Revoking the token from the settings screen therefore hands out a fresh
    // one on the next call — cutting this client off for good means revoking
    // the CLIENT, which is the row that holds the secret.
    if (existing) {
      return {
        ok: true as const,
        accessToken: existing.token,
        ...(existing.expiresAt === undefined
          ? {}
          : { expiresIn: Math.floor((existing.expiresAt - now) / 1000) }),
        scope,
      };
    }

    const token = randomToken(32);
    await ctx.db.insert("oauthAccessTokens", {
      token,
      userId: ownerUserId,
      clientId: args.clientId,
      scope,
      // Absent = never expires, which is the default. Only revocation ends it.
      ...(ttlMs === null ? {} : { expiresAt: now + ttlMs }),
      createdAt: now,
      label: client.label ?? client.clientName,
    });

    return {
      ok: true as const,
      accessToken: token,
      ...(ttlMs === null ? {} : { expiresIn: Math.floor(ttlMs / 1000) }),
      scope,
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
    // Absent expiry = never expires. Written as an explicit undefined check
    // rather than a comparison: `undefined < Date.now()` is false, so the old
    // line would have happened to work and would have read as an oversight.
    if (row.expiresAt !== undefined && row.expiresAt < Date.now()) return null;
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
      /** null = never expires; only revocation ends it. */
      expiresAt: v.union(v.number(), v.null()),
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
        expiresAt: r.expiresAt ?? null,
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

/* ─────────────── confidential clients (user-minted API keys) ───────────────
 *
 * ChatGPT's connector form offers three registration methods, and two of them
 * ("Dynamic Client Registration", "Client Identifier Metadata Document") grey
 * out unless the server advertises them. The third — "User-Defined OAuth
 * Client" — wants a client id and a client secret, and until now this server
 * could produce neither: RFC 7591 registration mints PUBLIC clients, with no
 * secret to hand over.
 *
 * These three functions are that missing path. A user mints a client from the
 * settings screen, pastes the pair into whichever host insists on it, and
 * revokes it from the same place. DCR keeps working untouched and stays the
 * better route where a host supports it — nothing to copy, nothing to leak.
 */

/** Long enough that guessing is hopeless; the id is public, the secret is not. */
const CLIENT_ID_BYTES = 12;
const CLIENT_SECRET_BYTES = 32;
const CLIENT_LABEL_MAX = 60;

export const createMyClient = mutation({
  args: { label: v.string() },
  returns: v.object({
    clientId: v.string(),
    // Returned exactly once. Only the digest is stored, so this value cannot
    // be produced again — the UI has to show it now or lose it.
    clientSecret: v.string(),
    label: v.string(),
    createdAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const label = args.label.trim();
    if (!label) throw new Error("Label wajib diisi");
    if (label.length > CLIENT_LABEL_MAX) {
      throw new Error(`Label maksimal ${CLIENT_LABEL_MAX} karakter`);
    }

    const clientId = `cp_${randomToken(CLIENT_ID_BYTES)}`;
    const clientSecret = randomToken(CLIENT_SECRET_BYTES);
    const now = Date.now();

    await ctx.db.insert("oauthClients", {
      clientId,
      clientName: label,
      // Empty on purpose: the host's callback is unknown at mint time, so this
      // client is held to the host-level allowlist instead. See exchangeCode.
      redirectUris: [],
      createdAt: now,
      clientSecretHash: await sha256Hex(clientSecret),
      ownerUserId: userId,
      label,
    });

    return { clientId, clientSecret, label, createdAt: now };
  },
});

export const listMyClients = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.id("oauthClients"),
      clientId: v.string(),
      label: v.string(),
      createdAt: v.number(),
      revokedAt: v.union(v.number(), v.null()),
    }),
  ),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("oauthClients")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", userId))
      .collect();
    // No secret field of any kind here, not even a preview. The digest is all
    // the row holds, and a surface that could show the secret again is a
    // surface whose database is storing it in the clear.
    return rows
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((r) => ({
        id: r._id,
        clientId: r.clientId,
        label: r.label ?? r.clientName,
        createdAt: r.createdAt,
        revokedAt: r.revokedAt ?? null,
      }));
  },
});

export const revokeMyClient = mutation({
  args: { clientRowId: v.id("oauthClients") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(args.clientRowId);
    // Same "not found" for someone else's row as for a missing one — a
    // distinct "forbidden" would confirm the id exists.
    if (!row || row.ownerUserId !== userId) {
      throw new Error("Client tidak ditemukan");
    }
    const now = Date.now();
    if (row.revokedAt === undefined) {
      await ctx.db.patch(args.clientRowId, { revokedAt: now });
    }

    // And every token it ever produced. Revoking the client alone stopped it
    // minting NEW tokens while leaving the live ones working — with
    // client_credentials that gap is 30 days of access after the user believes
    // they cut it off, and with an interactive grant it was a year. Done here
    // rather than by checking the client on every MCP request: this runs once,
    // that would run on all of them.
    const tokens = await ctx.db
      .query("oauthAccessTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const t of tokens) {
      if (t.clientId === row.clientId && t.revokedAt === undefined) {
        await ctx.db.patch(t._id, { revokedAt: now });
      }
    }
    return null;
  },
});
