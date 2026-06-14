import { defineTable } from "convex/server";
import { v } from "convex/values";

// Shape of a top-N ranking ({ value, count }) used across the super-admin
// profile aggregates stored on the `adminStats` singleton.
const topCountArray = v.array(
  v.object({ value: v.string(), count: v.number() }),
);

export const observabilityTables = {
  errorLogs: defineTable({
    userId: v.optional(v.id("users")),
    source: v.string(),
    message: v.string(),
    stack: v.optional(v.string()),
    route: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_time", ["timestamp"]),

  // Email delivery events from the Resend webhook. One row per event.
  // Unsigned / failed-signature events are rejected (401) and NOT persisted
  // by default; `verified` is therefore normally true. A row with
  // `verified: false` only appears during a rollout grace period
  // (RESEND_WEBHOOK_ACCEPT_UNVERIFIED opt-in) and is advisory.
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

  // Denormalized counters for admin dashboard (DashboardPanel + ChartsPanel
  // + super-admin analytics: overview / profile aggregates / feature adoption
  // / signup trend). Recomputed hourly by
  // `internal.admin.aggregator.recomputeAdminStats`. Singleton row keyed by
  // `"global"`. Reading the doc is O(1) so the reactive dashboard queries
  // never table-scan `users`, `userProfiles`, `files`, `cvs`,
  // `jobApplications`, `chatConversations` (incl. its heavy `messages[]`),
  // `rateLimitEvents`, or `errorLogs` again on every write tick.
  adminStats: defineTable({
    key: v.literal("global"),
    computedAt: v.number(),
    totalUsers: v.number(),
    activeUsers30d: v.number(),
    totalCVs: v.number(),
    totalApplications: v.number(),
    aiTotalRequests: v.number(),
    aiLastMonth: v.number(),
    aiDaily30d: v.array(
      v.object({
        date: v.string(),
        requests: v.number(),
        errors: v.number(),
      }),
    ),
    topAIUsers: v.array(
      v.object({
        userId: v.id("users"),
        email: v.union(v.string(), v.null()),
        name: v.union(v.string(), v.null()),
        count: v.number(),
      }),
    ),
    topErrorSources: v.array(
      v.object({
        value: v.string(),
        count: v.number(),
      }),
    ),
    aiTotalRequests30d: v.number(),
    totalErrors30d: v.number(),
    aiLast60s: v.number(),
    aiLast24h: v.number(),

    // ---- super-admin analytics rollups (added 2026-06-15) ----
    // All optional so the pre-existing singleton row (written before these
    // fields existed) still validates on read; the reactive queries fall
    // back to zero-shape until the next hourly cron backfills them.
    signedUp7: v.optional(v.number()),
    signedUp30: v.optional(v.number()),
    profilesCount: v.optional(v.number()),
    profileCompleteCount: v.optional(v.number()),
    publicEnabledCount: v.optional(v.number()),
    storageFiles: v.optional(v.number()),
    storageBytes: v.optional(v.number()),
    storageImageCount: v.optional(v.number()),
    storagePdfCount: v.optional(v.number()),
    topTargetRoles: v.optional(topCountArray),
    topLocations: v.optional(topCountArray),
    topExperience: v.optional(topCountArray),
    topSkills: v.optional(topCountArray),
    topInterests: v.optional(topCountArray),
    featureAdoption: v.optional(
      v.array(
        v.object({
          slice: v.string(),
          users: v.number(),
          pct: v.number(),
          rows: v.number(),
        }),
      ),
    ),
    signupTrend30d: v.optional(
      v.array(v.object({ date: v.string(), count: v.number() })),
    ),
  }).index("by_key", ["key"]),

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
