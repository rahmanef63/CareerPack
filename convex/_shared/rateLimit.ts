import { ConvexError } from "convex/values";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export interface RateLimitRule {
  key: string;
  windowMs: number;
  max: number;
}

export const AI_RATE_LIMITS: Record<string, RateLimitRule> = {
  "ai:minute": { key: "ai:minute", windowMs: 60 * 1000, max: 10 },
  "ai:day": { key: "ai:day", windowMs: 24 * 60 * 60 * 1000, max: 100 },
};

// NOTE: login throttling is enforced per-IP at the HTTP edge
// (convex/authCheckEmail.ts loginCheckIpEvents), not via this bucket —
// the @convex-dev/auth signIn password path runs over WebSocket and can't
// hook this helper. A user-scoped LOGIN_RATE_LIMIT constant used to live
// here but was never wired, so it was removed to avoid implying coverage
// that didn't exist.

export async function enforceRateLimit(
  ctx: MutationCtx,
  userId: Id<"users">,
  rule: RateLimitRule,
): Promise<void> {
  const now = Date.now();
  const windowStart = now - rule.windowMs;

  const recent = await ctx.db
    .query("rateLimitEvents")
    .withIndex("by_user_key_time", (q) =>
      q.eq("userId", userId).eq("key", rule.key).gte("timestamp", windowStart),
    )
    .collect();

  if (recent.length >= rule.max) {
    const retrySec = Math.ceil(
      (recent[0].timestamp + rule.windowMs - now) / 1000,
    );
    // ConvexError (not plain Error): prod Convex redacts an uncaught Error to
    // a generic "Server Error", which would drop this Indonesian quota copy
    // before the client (humanMessage in notify.ts) can read it. The
    // structured `data.message` payload survives the RPC boundary intact.
    throw new ConvexError({
      message: `Rate limit tercapai (${rule.max}/${Math.round(rule.windowMs / 60000)}m). Coba lagi dalam ${retrySec}s.`,
    });
  }

  await ctx.db.insert("rateLimitEvents", {
    userId,
    key: rule.key,
    timestamp: now,
  });
}
