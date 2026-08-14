import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { timingSafeEqual } from "../_shared/pkce";
import { parseScopes, type McpAuth } from "./types";

/**
 * Bearer resolution for the MCP endpoint. Called once per request from the
 * httpAction — every downstream query and mutation receives the resolved
 * `userId` as an explicit argument, because a Convex isolate has no
 * AsyncLocalStorage to carry it and no auth session to read it back from.
 */

export function extractBearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

/**
 * Precedence: the env escape hatch, then a live OAuth access token.
 * Returns null when the token is unknown, revoked or expired — the caller
 * answers 401 and must not distinguish between those cases.
 */
export async function resolveBearer(
  ctx: ActionCtx,
  token: string,
): Promise<McpAuth | null> {
  const envKey = process.env.MCP_API_KEY;
  // The >= 32 floor is a guard against the env var being set to something
  // short or placeholder-ish in a hurry: a 6-character MCP_API_KEY would be
  // a guessable skeleton key for the whole endpoint.
  if (envKey && envKey.length >= 32 && timingSafeEqual(token, envKey)) {
    // No user: this key proves someone has deploy access, not that they are
    // a particular account. tools/list works, tools/call refuses.
    return { userId: null, kind: "env", scopes: [] };
  }

  const row = await ctx.runQuery(internal.mcp.oauth.lookupAccessToken, {
    token,
  });
  // Scopes come from the token row, never from the request. A client asking
  // for more than it was granted at consent time gets what it was granted.
  return row
    ? { userId: row.userId, kind: "oauth", scopes: parseScopes(row.scope) }
    : null;
}
