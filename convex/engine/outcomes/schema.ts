import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Outcome Calibrator — Phase 4 substrate.
 *
 * Captures user-reported outcomes after every meaningful job-search
 * action (apply → callback → interview → offer → accept/reject).
 * Feeds back into the Career Graph's edge probabilities by cohort,
 * letting the engine refine its predictions from real user data
 * rather than relying solely on the curated seed priors.
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

    /** Optional free-form notes from the user. */
    notes: v.optional(v.string()),

    /** When the *real-world* outcome happened. May predate insert. */
    occurredAt: v.number(),
  })
    .index("by_user_time", ["userId", "occurredAt"])
    .index("by_user_kind", ["userId", "kind"])
    .index("by_target_kind", ["targetNodeSlug", "kind"]),
};
