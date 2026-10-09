import { v, type Infer } from "convex/values";
import { query } from "../../_generated/server";
import { MIN_COHORT_N } from "./lib";

/** Public cohort releases are paused until contribution bounds and composition accounting exist. */
const cohortResult = v.object({
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
  });

export const cohortStatsDP = query({
  // `epsilon` is deliberately NOT an argument: the privacy budget is a
  // server policy, and a caller passing epsilon=1e9 got a Laplace scale
  // of ~0 back, i.e. the exact untouched counts.
  args: {
    targetNodeSlug: v.string(),
  },
  returns: cohortResult,
  // shortcut: public cohort release paused, resume only with contribution bounds and a privacy ledger.
  handler: async (): Promise<Infer<typeof cohortResult>> => ({
    released: false, minN: MIN_COHORT_N, sampleBand: "none" as const,
    epsilonTotal: 0, counts: null, callbackRate: null,
  }),
});
