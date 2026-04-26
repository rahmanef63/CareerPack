import { defineTable } from "convex/server";
import { v } from "convex/values";

export const mockInterviewTables = {
  mockInterviews: defineTable({
    userId: v.id("users"),
    type: v.string(),
    role: v.string(),
    difficulty: v.string(),
    questions: v.array(v.object({
      id: v.string(),
      question: v.string(),
      category: v.string(),
      userAnswer: v.optional(v.string()),
      feedback: v.optional(v.string()),
      score: v.optional(v.number()),
      answeredAt: v.optional(v.number()),
    })),
    overallScore: v.optional(v.number()),
    feedback: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    startedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_started", ["userId", "startedAt"]),
};
