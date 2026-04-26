import { defineTable } from "convex/server";
import { v } from "convex/values";

export const feedbackTables = {
  feedback: defineTable({
    userId: v.optional(v.id("users")),
    subject: v.string(),
    message: v.string(),
    timestamp: v.number(),
  })
    .index("by_time", ["timestamp"])
    .index("by_user_time", ["userId", "timestamp"]),
};
