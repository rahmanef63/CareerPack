import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Plan Compiler — Phase 3 substrate.
 *
 * Each Career Quest represents a user-stated intent ("I want to be a
 * Senior Data Engineer in 18 months") compiled into a concrete,
 * ordered checklist of cross-slice actions: roadmap nodes to seed,
 * calendar blocks to set, CV tailoring to run, listings to follow,
 * skills to study. The LLM call that compiles the plan is bound to
 * a controlled action vocabulary so it cannot emit arbitrary side
 * effects.
 */
export const planTables = {
  careerQuests: defineTable({
    userId: v.id("users"),
    /** Display title. LLM-generated, ~6-10 words. */
    title: v.string(),
    /** Original Indonesian/English intent statement. */
    intent: v.string(),
    /** LLM-estimated time-to-goal in months. */
    etaMonths: v.number(),
    /** Optional target career node slug — for cohort link-up. */
    targetNodeSlug: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("abandoned"),
    ),
    actions: v.array(
      v.object({
        id: v.string(),
        /**
         * Action kind (controlled vocab — validator at compile time
         * drops anything outside this enum):
         *   - study_skill
         *   - add_roadmap_node
         *   - tailor_cv
         *   - subscribe_listings
         *   - set_calendar_block
         *   - report_outcome
         *   - prepare_documents
         *   - generic
         */
        type: v.string(),
        label: v.string(),
        /** Free-form structured payload — type-specific. */
        payload: v.optional(v.any()),
        completed: v.boolean(),
        completedAt: v.optional(v.number()),
      }),
    ),
    createdAt: v.number(),
  })
    .index("by_user_status", ["userId", "status"])
    .index("by_user_time", ["userId", "createdAt"]),
};
