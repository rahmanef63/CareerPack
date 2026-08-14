import { httpAction, internalMutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { extractClientIp, sha256Hex } from "../_shared/clientIp";
import { randomToken } from "../_shared/pkce";
import { requireUser } from "../_shared/auth";
import { assertAllowedRedirect } from "./oauth";
import { MCP_SCOPES } from "./types";

/**
 * `POST /oauth/register` — RFC 7591 dynamic client registration.
 *
 * This exists because of one asymmetry between MCP hosts. Claude Code, Cursor
 * and mcp-remote let a user paste an arbitrary header or client id into a
 * config file. ChatGPT's connection modal and claude.ai's connector form do
 * not: OpenAI's own documentation says ChatGPT "cannot present custom API
 * keys", and neither form has a field for a client id a human typed. Those
 * hosts connect by registering themselves, or they do not connect.
 *
 * Unauthenticated by design — RFC 7591 §1.2 open registration. What bounds it:
 *
 *   - every `redirect_uri` must pass the same host allowlist the consent step
 *     enforces, so registration cannot mint a client that points anywhere new;
 *   - a per-IP hourly cap, because this endpoint writes a row;
 *   - no client secret is ever issued. These are public clients and PKCE is
 *     what proves the exchange, so there is no credential here to leak.
 *
 * Registration grants nothing on its own. A registered client still has to
 * send a human to the consent screen and still gets a token scoped to that
 * one person.
 */

const REGISTER_RATE_WINDOW_MS = 60 * 60 * 1000;
const REGISTER_RATE_MAX = 20;

/** Generous enough for a host that lists a callback per environment, small
 *  enough that the row cannot become a storage vector. */
const MAX_REDIRECT_URIS = 10;
const MAX_NAME_LEN = 120;

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const JSON_HEADERS = {
  "Content-Type": "application/json",
  // RFC 7591 §3.2.1 — registration responses carry credentials-shaped data
  // and must never sit in a shared cache.
  "Cache-Control": "no-store",
  Pragma: "no-cache",
  ...CORS,
};

function oauthError(error: string, description: string, status = 400): Response {
  return new Response(
    JSON.stringify({ error, error_description: description }),
    { status, headers: JSON_HEADERS },
  );
}

/**
 * Rate-limit, validate, insert. A mutation rather than logic in the action
 * because the per-IP count and the insert have to be one transaction — two
 * registrations racing through a read-then-write in an action would both see
 * the same count and both pass.
 */
export const _registerClient = internalMutation({
  args: {
    ipHash: v.string(),
    clientName: v.string(),
    redirectUris: v.array(v.string()),
  },
  returns: v.union(
    v.object({ ok: v.literal(true), clientId: v.string(), createdAt: v.number() }),
    v.object({ ok: v.literal(false), error: v.string(), description: v.string() }),
  ),
  handler: async (ctx, { ipHash, clientName, redirectUris }) => {
    const now = Date.now();
    const events = await ctx.db
      .query("oauthRegisterIpEvents")
      .withIndex("by_ipHash_time", (q) =>
        q.eq("ipHash", ipHash).gte("timestamp", now - REGISTER_RATE_WINDOW_MS),
      )
      .collect();
    if (events.length >= REGISTER_RATE_MAX) {
      console.warn(
        `[oauth/register] per-IP rate-limited ipHash=${ipHash.slice(0, 8)}… (${events.length}/${REGISTER_RATE_MAX} in last hour)`,
      );
      return {
        ok: false as const,
        error: "temporarily_unavailable",
        description: "Terlalu banyak pendaftaran dari alamat ini. Coba lagi nanti.",
      };
    }

    // The same allowlist the consent step applies. Refusing here turns a
    // misconfigured client into a readable error at registration instead of a
    // silent failure minutes later at the redirect.
    for (const uri of redirectUris) {
      try {
        assertAllowedRedirect(uri);
      } catch (err) {
        return {
          ok: false as const,
          error: "invalid_redirect_uri",
          description: err instanceof Error ? err.message : "redirect_uri tidak valid",
        };
      }
    }

    await ctx.db.insert("oauthRegisterIpEvents", { ipHash, timestamp: now });

    const clientId = `cp_${randomToken(16)}`;
    await ctx.db.insert("oauthClients", {
      clientId,
      clientName,
      redirectUris,
      createdAt: now,
    });
    return { ok: true as const, clientId, createdAt: now };
  },
});

export const handleRegister = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...JSON_HEADERS, Allow: "POST, OPTIONS" },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return oauthError("invalid_client_metadata", "Body bukan JSON yang valid.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return oauthError("invalid_client_metadata", "Body harus objek JSON.");
  }

  const meta = body as Record<string, unknown>;
  const rawUris = meta.redirect_uris;
  if (!Array.isArray(rawUris) || rawUris.length === 0) {
    return oauthError("invalid_redirect_uri", "redirect_uris wajib diisi.");
  }
  if (rawUris.length > MAX_REDIRECT_URIS) {
    return oauthError(
      "invalid_redirect_uri",
      `Maksimal ${MAX_REDIRECT_URIS} redirect_uris.`,
    );
  }
  if (!rawUris.every((u): u is string => typeof u === "string" && u.length <= 500)) {
    return oauthError("invalid_redirect_uri", "redirect_uris harus berisi URL.");
  }

  // Only `none` is honest here: there is no secret to authenticate with, and
  // a client told "yes, client_secret_post" would send one we never check.
  const authMethod = meta.token_endpoint_auth_method;
  if (authMethod !== undefined && authMethod !== "none") {
    return oauthError(
      "invalid_client_metadata",
      "Hanya token_endpoint_auth_method 'none' yang didukung (public client + PKCE).",
    );
  }

  const grants = meta.grant_types;
  if (Array.isArray(grants) && !grants.every((g) => g === "authorization_code")) {
    return oauthError(
      "invalid_client_metadata",
      "Hanya grant_type 'authorization_code' yang didukung.",
    );
  }

  const name =
    typeof meta.client_name === "string" && meta.client_name.trim().length > 0
      ? meta.client_name.trim().slice(0, MAX_NAME_LEN)
      : "Aplikasi tanpa nama";

  const ipHash = await sha256Hex(extractClientIp(request.headers));
  const result = await ctx.runMutation(internal.mcp.register._registerClient, {
    ipHash,
    clientName: name,
    redirectUris: rawUris,
  });
  if (!result.ok) {
    return oauthError(
      result.error,
      result.description,
      result.error === "temporarily_unavailable" ? 429 : 400,
    );
  }

  // RFC 7591 §3.2.1: 201 with the registered metadata echoed back. No
  // `client_secret` and no `registration_access_token` — this server has no
  // configuration endpoint, so handing out a management credential would only
  // be a credential nobody can use.
  return new Response(
    JSON.stringify({
      client_id: result.clientId,
      client_id_issued_at: Math.floor(result.createdAt / 1000),
      client_name: name,
      redirect_uris: rawUris,
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: MCP_SCOPES,
    }),
    { status: 201, headers: JSON_HEADERS },
  );
});

/**
 * What the consent screen shows instead of a random `cp_…` string.
 *
 * Returns null for an unregistered client id, which is not an error: the
 * static ids that predate this endpoint still work, and the consent screen
 * falls back to rendering the id itself.
 *
 * Behind `requireUser` because the consent screen always has a signed-in user
 * by the time it asks, and an open lookup would let anyone walk the table.
 */
export const getClientInfo = query({
  args: { clientId: v.string() },
  returns: v.union(
    v.object({ clientName: v.string(), redirectUris: v.array(v.string()) }),
    v.null(),
  ),
  handler: async (ctx, { clientId }) => {
    await requireUser(ctx);
    const row = await ctx.db
      .query("oauthClients")
      .withIndex("by_clientId", (q) => q.eq("clientId", clientId))
      .first();
    return row
      ? { clientName: row.clientName, redirectUris: row.redirectUris }
      : null;
  },
});
