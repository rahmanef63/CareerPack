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
  // Recipients that opted out of non-transactional mail (welcome,
  // digests, marketing). Password reset + security alerts ignore this
  // list (sent with `alwaysSend: true`).
  emailUnsubscribes: defineTable({
    email: v.string(),
    reason: v.optional(v.string()),
    source: v.string(),
    unsubscribedAt: v.number(),
  }).index("by_email", ["email"]),

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
