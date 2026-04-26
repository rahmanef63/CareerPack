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

export const LOGIN_RATE_LIMIT: RateLimitRule = {
  key: "login",
  windowMs: 15 * 60 * 1000,
  max: 5,
};

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
    throw new Error(
      `Rate limit tercapai (${rule.max}/${Math.round(rule.windowMs / 60000)}m). Coba lagi dalam ${retrySec}s.`,
    );
  }

  await ctx.db.insert("rateLimitEvents", {
    userId,
    key: rule.key,
    timestamp: now,
  });
}
