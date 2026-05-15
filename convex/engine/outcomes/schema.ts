import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Outcome Calibrator — Phase 4 + 4.5 substrate.
 *
 * Captures user-reported outcomes after every meaningful job-search
 * action (apply → callback → interview → offer → accept/reject).
 * Feeds back into the Career Graph's edge probabilities by cohort,
 * letting the engine refine its predictions from real user data
 * rather than relying solely on the curated seed priors.
 *
 * Phase 4.5 introduces `fromNodeSlug` on each event + a separate
 * aggregation table (`nodeOutcomeStats`) that the daily cron updates
 * with Bayesian posteriors. The curated `careerEdges` table stays
 * untouched — calibrator output is layered on top so we can A/B prior
 * vs posterior in queries without losing the seed.
 */
export const outcomesTables = {
  outcomeEvents: defineTable({
    userId: v.id("users"),
    kind: v.union(
      v.literal("apply"),
      v.literal("callback"),
      v.literal("interview"),
      v.literal("offer"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
    /** Optional cross-references — kept loose so events can be
     *  recorded even if the cv/job was later deleted. */
    cvId: v.optional(v.id("cvs")),
    jobListingId: v.optional(v.id("jobListings")),

    /**
     * Slug of the career node the user was targeting at this event.
     * Drives cohort segmentation: aggregate stats are computed per
     * (targetNodeSlug, kind) bucket so identical career trajectories
     * inform each other's predictions.
     */
    targetNodeSlug: v.optional(v.string()),

    /**
     * Slug of the user's *current* role at the time the outcome
     * occurred — completes the (from, to) edge attribution the
     * Bayesian calibrator needs. Phase 4.5: optional + nullable
     * because legacy rows lack it and standalone reports may
     * legitimately not know.
     */
    fromNodeSlug: v.optional(v.string()),

    /** Optional free-form notes from the user. */
    notes: v.optional(v.string()),

    /** When the *real-world* outcome happened. May predate insert. */
    occurredAt: v.number(),
  })
    .index("by_user_time", ["userId", "occurredAt"])
    .index("by_user_kind", ["userId", "kind"])
    .index("by_target_kind", ["targetNodeSlug", "kind"])
    .index("by_from_to", ["fromNodeSlug", "targetNodeSlug"]),

  /**
   * Calibrated posteriors per (from, to) career-graph edge. Daily cron
   * scans outcomeEvents in a rolling window, aggregates per edge,
   * applies Bayesian update against the curated seed prior, and
   * upserts here. The reachability engine can blend prior + posterior
   * at query time (e.g. weighted by posteriorN / (priorN + posteriorN)).
   */
  nodeOutcomeStats: defineTable({
    fromNodeSlug: v.string(),
    toNodeSlug: v.string(),
    /** Number of `apply` events observed in the calibration window. */
    applies: v.number(),
    callbacks: v.number(),
    interviews: v.number(),
    offers: v.number(),
    accepted: v.number(),
    rejected: v.number(),
    /** Bayesian posterior P(transition succeeds | this edge). */
    posteriorProb: v.number(),
    /** Pseudo-sample-size after Bayesian update — for blending. */
    posteriorN: v.number(),
    /** Last cron run timestamp. */
    updatedAt: v.number(),
  })
    .index("by_edge", ["fromNodeSlug", "toNodeSlug"])
    .index("by_to", ["toNodeSlug"]),
};
