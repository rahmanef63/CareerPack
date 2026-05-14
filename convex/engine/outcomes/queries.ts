import { v } from "convex/values";
import { query } from "../../_generated/server";
import { optionalUser } from "../../_shared/auth";

/** Latest N outcome events for the calling user. */
export const myRecent = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.any()),
  handler: async (ctx, { limit }) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    const cap = Math.min(Math.max(limit ?? 50, 1), 200);
    const rows = await ctx.db
      .query("outcomeEvents")
      .withIndex("by_user_time", (q) => q.eq("userId", userId))
      .order("desc")
      .take(cap);
    return rows;
  },
});

/**
 * Cohort statistics for a target career node — counts per outcome
 * kind + the empirically-observed callback rate. With small N this
 * is a rough prior; the UI shows it with sample-size + a calibrated
 * "confidence" label so users don't read 1/2 (50%) as gospel.
 */
export const cohortStats = query({
  args: { targetNodeSlug: v.string() },
  returns: v.object({
    counts: v.object({
      apply: v.number(),
      callback: v.number(),
      interview: v.number(),
      offer: v.number(),
      accepted: v.number(),
      rejected: v.number(),
    }),
    sampleSize: v.number(),
    callbackRate: v.union(v.null(), v.number()),
    confidence: v.union(
      v.literal("none"),
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
    ),
  }),
  handler: async (ctx, { targetNodeSlug }) => {
    // Public — anonymous browsing OK. Each event carries `userId`
    // but the aggregate exposes counts only, no per-user info.
    await optionalUser(ctx);

    const rows = await ctx.db
      .query("outcomeEvents")
      .withIndex("by_target_kind", (q) =>
        q.eq("targetNodeSlug", targetNodeSlug),
      )
      .take(5_000);

    const counts = {
      apply: 0,
      callback: 0,
      interview: 0,
      offer: 0,
      accepted: 0,
      rejected: 0,
    };
    for (const r of rows) {
      counts[r.kind] = (counts[r.kind] ?? 0) + 1;
    }

    const sampleSize = counts.apply;
    const callbackRate = sampleSize > 0 ? counts.callback / sampleSize : null;
    const confidence: "none" | "low" | "medium" | "high" =
      sampleSize === 0
        ? "none"
        : sampleSize < 10
          ? "low"
          : sampleSize < 50
            ? "medium"
            : "high";

    return { counts, sampleSize, callbackRate, confidence };
  },
});
