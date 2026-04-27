import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Quick-fill batch log — every successful import records the section
 * scope, timestamps, and the document IDs that were inserted, so the
 * user can roll back a single bad import without nuking everything.
 *
 * `profileSnapshot` keeps the full pre-patch profile doc when the
 * import touched it, so undo can restore the previous state. If
 * profile didn't exist before the batch, this is null and undo just
 * deletes the row.
 */
export const onboardingTables = {
  quickFillBatches: defineTable({
    userId: v.id("users"),
    scope: v.string(),
    createdAt: v.number(),

    // Profile change tracking — patch is destructive, so store enough
    // context to revert.
    profileTouched: v.boolean(),
    profileWasInsert: v.optional(v.boolean()),
    profileSnapshot: v.optional(v.any()),

    // Inserted IDs per section. Plain string union of table-row IDs;
    // typed as v.any() for cross-table flexibility.
    cvIds: v.array(v.id("cvs")),
    portfolioIds: v.array(v.id("portfolioItems")),
    goalIds: v.array(v.id("careerGoals")),
    applicationIds: v.array(v.id("jobApplications")),
    contactIds: v.array(v.id("contacts")),

    warnings: v.array(v.string()),
    undone: v.boolean(),
    undoneAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"]),
};
