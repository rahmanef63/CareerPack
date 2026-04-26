import { defineTable } from "convex/server";
import { v } from "convex/values";

export const observabilityTables = {
  errorLogs: defineTable({
    userId: v.optional(v.id("users")),
    source: v.string(),
    message: v.string(),
    stack: v.optional(v.string()),
    route: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_time", ["timestamp"]),

  roleAuditLogs: defineTable({
    actorUserId: v.id("users"),
    targetUserId: v.id("users"),
    previousRole: v.union(
      v.literal("admin"),
      v.literal("moderator"),
      v.literal("user"),
    ),
    newRole: v.union(
      v.literal("admin"),
      v.literal("moderator"),
      v.literal("user"),
    ),
    timestamp: v.number(),
  })
    .index("by_time", ["timestamp"])
    .index("by_target", ["targetUserId", "timestamp"]),
};
