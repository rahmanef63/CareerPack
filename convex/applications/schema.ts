import { defineTable } from "convex/server";
import { v } from "convex/values";

export const applicationsTables = {
  jobApplications: defineTable({
    userId: v.id("users"),
    /**
     * Optional FK to the CV used for this application. Lets the UI
     * answer "show me every application that used this CV" via the
     * `by_user_cv` index, and lets ATS-score history surface inline
     * on a CV detail view.
     */
    cvId: v.optional(v.id("cvs")),
    company: v.string(),
    position: v.string(),
    location: v.string(),
    salary: v.optional(v.string()),
    status: v.string(),
    appliedDate: v.number(),
    source: v.string(),
    notes: v.optional(v.string()),
    interviewDates: v.array(v.object({
      type: v.string(),
      date: v.number(),
      notes: v.optional(v.string()),
    })),
    documents: v.array(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_applied", ["userId", "appliedDate"])
    .index("by_user_cv", ["userId", "cvId"]),
};
