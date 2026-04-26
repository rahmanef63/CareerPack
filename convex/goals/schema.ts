import { defineTable } from "convex/server";
import { v } from "convex/values";

export const goalsTables = {
  careerGoals: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    targetDate: v.number(),
    status: v.string(),
    progress: v.number(),
    milestones: v.array(v.object({
      id: v.string(),
      title: v.string(),
      completed: v.boolean(),
      completedAt: v.optional(v.number()),
    })),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_target", ["userId", "targetDate"]),
};
