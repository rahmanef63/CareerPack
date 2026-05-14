import { v } from "convex/values";
import { query } from "../../_generated/server";
import { optionalUser } from "../../_shared/auth";
import { DEFAULT_EPSILON, MIN_COHORT_N, noiseCohort } from "./lib";

/**
 * DP-protected cohort statistics for a target career node.
 *
 * Versi privat-aman dari `engine.outcomes.queries.cohortStats`.
 * Setiap count diberi Laplace noise sebelum dirilis, dan cohort
 * dengan N < `MIN_COHORT_N` di-suppressed sepenuhnya (`released =
 * false`) untuk mencegah re-identifikasi kasus kecil.
 */
export const cohortStatsDP = query({
  args: {
    targetNodeSlug: v.string(),
    epsilon: v.optional(v.number()),
  },
  returns: v.object({
    released: v.boolean(),
    minN: v.number(),
    sampleBand: v.union(
      v.literal("none"),
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
    ),
    epsilonTotal: v.number(),
    counts: v.union(
      v.null(),
      v.object({
        apply: v.number(),
        callback: v.number(),
        interview: v.number(),
        offer: v.number(),
        accepted: v.number(),
        rejected: v.number(),
      }),
    ),
    callbackRate: v.union(v.null(), v.number()),
  }),
  handler: async (ctx, args) => {
    await optionalUser(ctx);

    const rows = await ctx.db
      .query("outcomeEvents")
      .withIndex("by_target_kind", (q) =>
        q.eq("targetNodeSlug", args.targetNodeSlug),
      )
      .take(5_000);

    const trueCounts = {
      apply: 0,
      callback: 0,
      interview: 0,
      offer: 0,
      accepted: 0,
      rejected: 0,
    };
    for (const r of rows) {
      trueCounts[r.kind] = (trueCounts[r.kind] ?? 0) + 1;
    }

    const trueApply = trueCounts.apply;
    if (trueApply < MIN_COHORT_N) {
      return {
        released: false,
        minN: MIN_COHORT_N,
        sampleBand:
          trueApply === 0
            ? ("none" as const)
            : ("low" as const),
        epsilonTotal: 0,
        counts: null,
        callbackRate: null,
      };
    }

    const eps = args.epsilon ?? DEFAULT_EPSILON;
    const noised = noiseCohort(trueCounts, eps);

    return {
      released: true,
      minN: MIN_COHORT_N,
      sampleBand: noised.band,
      epsilonTotal: noised.epsilonTotal,
      counts: {
        apply: noised.applyCount,
        callback: noised.callbackCount,
        interview: noised.interviewCount,
        offer: noised.offerCount,
        accepted: noised.acceptedCount,
        rejected: noised.rejectedCount,
      },
      callbackRate: noised.callbackRate,
    };
  },
});
