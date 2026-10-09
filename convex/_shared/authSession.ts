import { getAuthUserId, getAuthSessionId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";
import type { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export const AUTH_JWT_DURATION_MS = 3_600_000;

/** Reset tombstones reject still-valid JWTs before they can read or write. */
export async function activeUserId(ctx: QueryCtx | MutationCtx | ActionCtx): Promise<Id<"users"> | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const sessionId = await getAuthSessionId(ctx);
  if (!sessionId) return null;
  const revoked = "db" in ctx
    ? ((await ctx.db.query("authRevocations").withIndex("by_session", q => q.eq("sessionId", sessionId)).first())?.expiresAt ?? 0) > Date.now()
    : await ctx.runQuery(internal.authSessions.isRevoked, { sessionId });
  return revoked ? null : userId;
}
