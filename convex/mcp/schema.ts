import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * OAuth 2.1 storage for the MCP server. Two short tables, both keyed by an
 * opaque random string, both scoped to a `users` row — an access token is
 * the ONLY thing that decides whose data an MCP request can touch, so the
 * `userId` here is the entire authorization model.
 */
export const mcpTables = {
  // Authorization codes. Single-use (`consumed`) and 5-minute TTL, so a
  // code captured from the redirect (browser history, referrer log, a
  // shoulder-surfed URL) is worthless without the PKCE verifier that only
  // the client that started the flow holds.
  oauthCodes: defineTable({
    code: v.string(),
    codeChallenge: v.string(),
    codeChallengeMethod: v.string(),
    // Both are re-checked at exchange: a code minted for ChatGPT cannot be
    // redeemed by a different client or bounced to a different redirect.
    redirectUri: v.string(),
    clientId: v.string(),
    scope: v.string(),
    // RFC 8707 audience — which MCP endpoint the token is for.
    resource: v.optional(v.string()),
    userId: v.id("users"),
    expiresAt: v.number(),
    consumed: v.boolean(),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  // RFC 7591 dynamically registered clients. ChatGPT's connection modal and
  // claude.ai's connector form expose no field for a client id, so a client
  // that cannot register itself cannot connect at all — this table is what
  // makes those two hosts work without anyone typing a credential.
  //
  // `clientName` is whatever the registering software claimed. It is shown on
  // the consent screen and labelled as self-reported there, because nothing
  // here verifies it.
  oauthClients: defineTable({
    clientId: v.string(),
    clientName: v.string(),
    // Registration narrows the redirect allowlist for this client; the
    // host-level allowlist still applies on top, so a registered client can
    // only ever be a subset of what an unregistered one could ask for.
    redirectUris: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_clientId", ["clientId"]),

  // Per-IP bucket for the registration endpoint, which is unauthenticated by
  // definition — anyone who can reach it can insert a row. Kept separate from
  // `loginCheckIpEvents` so registration spam cannot lock anyone out of
  // logging in. Pruned daily by `pruneAppendOnlyTables`.
  oauthRegisterIpEvents: defineTable({
    ipHash: v.string(),
    timestamp: v.number(),
  }).index("by_ipHash_time", ["ipHash", "timestamp"]),

  oauthAccessTokens: defineTable({
    token: v.string(),
    userId: v.id("users"),
    clientId: v.string(),
    scope: v.string(),
    resource: v.optional(v.string()),
    expiresAt: v.number(),
    createdAt: v.number(),
    // Set to revoke without deleting, so a revoked token stays auditable.
    // Checked on every single MCP request, not only at issue time.
    revokedAt: v.optional(v.number()),
    label: v.optional(v.string()),
  })
    .index("by_token", ["token"])
    // For "show / revoke my connections" — the only way a user can cut off
    // a token they no longer trust.
    .index("by_user", ["userId"]),
};
