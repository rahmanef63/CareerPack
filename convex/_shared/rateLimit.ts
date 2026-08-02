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

/**
 * Ceiling across ALL users, on top of the per-user buckets above.
 *
 * Why this exists when a hard credit limit on the OpenRouter key would also
 * cap spend: the credit limit is the financial backstop and must stay set,
 * but it can only fail closed and total — the moment it trips every AI
 * feature 402s for everyone (`aiUnavailableError`) and recovery needs a human
 * with a card. This ceiling trips *before* the money is gone, sheds anonymous
 * demo sessions first, and heals by itself an hour later. It matters because
 * anonymous sign-in is open: "a user" is free to mint, so without a global
 * bound the real cap is 100/day × however many accounts a script cares to
 * create, all drawn against one funded key.
 *
 * Numbers: docs/product-hunt-launch.md plans for "a few hundred curious
 * visitors" and docs/launch-runbook.md treats >100 daily users as the point
 * where this stops being a small site — so ~150 AI calls in the peak hour is
 * the busiest thing this repo actually expects. 300/h is ~2× that, and is
 * also three whole users' daily allowance (100) inside one hour, i.e. not
 * reachable by anyone browsing normally.
 *
 * The window is an hour, not a day, so the count stays a ≤300-row `take` on
 * every AI call — a 24h window would scan thousands of rows per call for the
 * same answer. Counted against the `ai:minute` rows because every quota'd AI
 * call inserts exactly one of those (and `_refundAIQuota` deletes it again
 * when the gateway fails, so refunds decrement this too).
 */
export const AI_GLOBAL_CEILING = {
  key: "ai:minute",
  windowMs: 60 * 60 * 1000,
  max: 300,
  anonMax: 150,
} as const;

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

  // Hung off the ai:minute rule so it runs exactly once per AI call: all
  // three quota entry points (ai.mutations._checkAIQuota,
  // cv.mutations._checkTranslateQuota, matcher.actions._checkATSQuota) run
  // minute-then-day, so this covers them all without a second round trip and
  // without the day rule re-answering the same question.
  if (rule.key === AI_GLOBAL_CEILING.key) {
    await enforceGlobalCeiling(ctx, userId, now);
  }

  await ctx.db.insert("rateLimitEvents", {
    userId,
    key: rule.key,
    timestamp: now,
  });
}

async function enforceGlobalCeiling(
  ctx: MutationCtx,
  userId: Id<"users">,
  now: number,
): Promise<void> {
  const used = await ctx.db
    .query("rateLimitEvents")
    .withIndex("by_key_time", (q) =>
      q
        .eq("key", AI_GLOBAL_CEILING.key)
        .gte("timestamp", now - AI_GLOBAL_CEILING.windowMs),
    )
    .take(AI_GLOBAL_CEILING.max);

  if (used.length < AI_GLOBAL_CEILING.anonMax) return;

  // Only worth a user lookup once the demo cap is in play. Anonymous sessions
  // are the ones with no email — same test admin/cleanup.ts prunes on.
  const isAnon = !(await ctx.db.get(userId))?.email;
  const limit = isAnon ? AI_GLOBAL_CEILING.anonMax : AI_GLOBAL_CEILING.max;
  if (used.length < limit) return;

  // The row that has to age out before this caller is let back in is the
  // (used.length - limit)-th oldest, not used[0]: an anon session shed at 150
  // while the hour holds 300 needs 151 rows gone, and quoting the oldest row
  // would promise "1 menit" for a wait of nearly the whole window.
  const retryMin = Math.max(
    1,
    Math.ceil(
      (used[used.length - limit].timestamp + AI_GLOBAL_CEILING.windowMs - now) /
        60000,
    ),
  );
  // Must not read as either "your own quota is exhausted" (notify.ts rewrites
  // anything matching /rate limit|quota|terlalu banyak/ into that copy) or as
  // the gateway-down message in aiProviders.ts — this is the one case where
  // the service is healthy, the user did nothing wrong, and waiting works.
  throw new ConvexError({
    message: isAnon
      ? `Pemakaian AI bersama sedang mencapai batas untuk jam ini. Sesi demo dibatasi lebih dulu agar akun terdaftar tetap terlayani. Coba lagi sekitar ${retryMin} menit lagi.`
      : `Pemakaian AI bersama sedang mencapai batas untuk jam ini — bukan batas pribadi Anda. Coba lagi sekitar ${retryMin} menit lagi.`,
  });
}
