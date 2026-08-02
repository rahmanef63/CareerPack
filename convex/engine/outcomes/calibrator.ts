import { internalMutation, type MutationCtx } from "../../_generated/server";
import {
  bayesianPosterior,
  bucketSuccessRate,
  bucketTotal,
  CALIB_MAX_EVENTS,
  CALIB_WINDOW_MS,
  DEFAULT_PRIOR_N,
  DEFAULT_PRIOR_P,
  emptyBucket,
  MIN_COHORT_K,
  type EventCountBucket,
} from "./lib";

/**
 * Daily outcome calibrator — Phase 4.5.
 *
 * Scans outcomeEvents in the rolling 180-day window for events that
 * carry both `fromNodeSlug` + `targetNodeSlug`. Aggregates per edge,
 * applies a Bayesian posterior update against the curated
 * `careerEdges` prior, and upserts the result into `nodeOutcomeStats`.
 *
 * Idempotent: re-running on the same data overwrites the same row.
 * Gated by `MIN_COHORT_K` so we never publish a posterior for a
 * cohort small enough to risk re-identifying a single user.
 */
export const runCalibrator = internalMutation({
  args: {},
  returns: undefined,
  handler: async (ctx) => {
    const cutoff = Date.now() - CALIB_WINDOW_MS;

    // Deterministic recency: range-scan the global time index in DESC
    // order, bounded to the rolling window. This returns the most-recent
    // CALIB_MAX_EVENTS in-window events — never an arbitrary slice off a
    // non-time-ordered index. The `occurredAt >= cutoff` bound makes the
    // window a query predicate, so no stale rows enter the posterior.
    const events = await ctx.db
      .query("outcomeEvents")
      .withIndex("by_time", (q) => q.gte("occurredAt", cutoff))
      .order("desc")
      .take(CALIB_MAX_EVENTS);

    const buckets = new Map<string, EventCountBucket>();
    // "|" delimiter (never in kebab slugs) so the split below is exact.
    const key = (f: string, t: string) => `${f}|${t}`;
    for (const e of events) {
      if (!e.fromNodeSlug || !e.targetNodeSlug) continue;
      const k = key(e.fromNodeSlug, e.targetNodeSlug);
      const b = buckets.get(k) ?? emptyBucket();
      switch (e.kind) {
        case "apply":
          b.applies += 1;
          break;
        case "callback":
          b.callbacks += 1;
          break;
        case "interview":
          b.interviews += 1;
          break;
        case "offer":
          b.offers += 1;
          break;
        case "accepted":
          b.accepted += 1;
          break;
        case "rejected":
          b.rejected += 1;
          break;
      }
      buckets.set(k, b);
    }

    if (buckets.size === 0) return;

    const now = Date.now();
    for (const [k, b] of buckets) {
      if (bucketTotal(b) < MIN_COHORT_K) continue;
      const sep = k.indexOf("|");
      const fromSlug = k.slice(0, sep);
      const toSlug = k.slice(sep + 1);

      const { priorP, priorN } = await loadEdgePrior(ctx, fromSlug, toSlug);
      const { successes, total } = bucketSuccessRate(b);
      const { posteriorP, posteriorN } = bayesianPosterior(
        priorP,
        priorN,
        successes,
        total,
      );

      const existing = await ctx.db
        .query("nodeOutcomeStats")
        .withIndex("by_edge", (q) =>
          q.eq("fromNodeSlug", fromSlug).eq("toNodeSlug", toSlug),
        )
        .first();

      const row = {
        fromNodeSlug: fromSlug,
        toNodeSlug: toSlug,
        applies: b.applies,
        callbacks: b.callbacks,
        interviews: b.interviews,
        offers: b.offers,
        accepted: b.accepted,
        rejected: b.rejected,
        posteriorProb: posteriorP,
        posteriorN,
        updatedAt: now,
      };

      if (existing) {
        await ctx.db.patch(existing._id, row);
      } else {
        await ctx.db.insert("nodeOutcomeStats", row);
      }
    }
  },
});

async function loadEdgePrior(
  ctx: MutationCtx,
  fromSlug: string,
  toSlug: string,
): Promise<{ priorP: number; priorN: number }> {
  const fromNode = await ctx.db
    .query("careerNodes")
    .withIndex("by_slug", (q) => q.eq("slug", fromSlug))
    .first();
  const toNode = await ctx.db
    .query("careerNodes")
    .withIndex("by_slug", (q) => q.eq("slug", toSlug))
    .first();
  if (!fromNode || !toNode) {
    return { priorP: DEFAULT_PRIOR_P, priorN: DEFAULT_PRIOR_N };
  }
  // Match the direct (from → to) edge — picks the strongest-prior
  // candidate if multiple seed rows exist for the same pair.
  let best: { probability: number; sampleSize: number } | null = null;
  const candidates = await ctx.db
    .query("careerEdges")
    .withIndex("by_from", (q) => q.eq("fromNodeId", fromNode._id))
    .collect();
  for (const e of candidates) {
    if (e.toNodeId !== toNode._id) continue;
    if (!best || e.sampleSize > best.sampleSize) {
      best = { probability: e.probability, sampleSize: e.sampleSize };
    }
  }
  if (!best) return { priorP: DEFAULT_PRIOR_P, priorN: DEFAULT_PRIOR_N };
  return {
    priorP: best.probability,
    priorN: Math.max(best.sampleSize, 1),
  };
}
