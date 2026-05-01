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

  // Email delivery events from the Resend webhook. One row per event;
  // `verified` flags whether the Svix signature checked out (false =
  // RESEND_WEBHOOK_SECRET unset or signature mismatch — treat as advisory).
  emailEvents: defineTable({
    eventId: v.string(),
    type: v.string(),
    to: v.string(),
    emailId: v.optional(v.string()),
    subject: v.optional(v.string()),
    reason: v.optional(v.string()),
    verified: v.boolean(),
    raw: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_time", ["createdAt"])
    .index("by_to_time", ["to", "createdAt"])
    .index("by_event", ["eventId"]),

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
