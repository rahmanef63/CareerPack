import { defineTable } from "convex/server";
import { v } from "convex/values";

export const applicationsTables = {
  jobApplications: defineTable({
    userId: v.id("users"),
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
    .index("by_user_applied", ["userId", "appliedDate"]),
};
