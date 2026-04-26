import { defineTable } from "convex/server";
import { v } from "convex/values";

export const aiTables = {
  chatConversations: defineTable({
    userId: v.id("users"),
    sessionId: v.string(),
    title: v.string(),
    messages: v.array(v.object({
      id: v.string(),
      role: v.string(),
      content: v.string(),
      timestamp: v.number(),
      actions: v.optional(v.array(v.object({
        type: v.string(),
        payload: v.any(),
        status: v.optional(v.string()),
      }))),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_session", ["userId", "sessionId"])
    .index("by_user_updated", ["userId", "updatedAt"]),

  aiSettings: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    model: v.string(),
    apiKey: v.string(),
    baseUrl: v.optional(v.string()),
    enabled: v.boolean(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  rateLimitEvents: defineTable({
    userId: v.id("users"),
    key: v.string(),
    timestamp: v.number(),
  }).index("by_user_key_time", ["userId", "key", "timestamp"]),
};
