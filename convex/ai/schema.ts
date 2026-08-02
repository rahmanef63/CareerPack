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
    // Denormalized list-view metadata so `listChatSessions` never has to
    // deserialize the (up to 200 × 4000-char) `messages` array just to show a
    // count + preview. Written by `upsertChatSession`. Optional so legacy rows
    // written before this field existed don't fail validation — the list query
    // falls back to 0 / "" for those until the next upsert backfills them.
    messageCount: v.optional(v.number()),
    lastMessagePreview: v.optional(v.string()),
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

  // Singleton (one row max). Admin-managed system-wide default. When
  // a user has no per-user `aiSettings`, the AI pipeline falls back
  // here before falling back to env defaults. Lets admin configure
  // OpenRouter once for everyone instead of per-user key paste.
  globalAISettings: defineTable({
    provider: v.string(),
    model: v.string(),
    apiKey: v.string(),
    baseUrl: v.optional(v.string()),
    enabled: v.boolean(),
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  }),

  // In-flight provider OAuth connect — the PKCE verifier, one row per
  // (user, provider). Deleted the instant the exchange succeeds and ignored
  // past FLOW_TTL_MS (ai/oauth.ts): a verifier that outlives its code is a
  // replay window for anyone who got hold of the code.
  aiOAuthFlows: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    verifier: v.string(),
    createdAt: v.number(),
  }).index("by_user_provider", ["userId", "provider"]),

  // Admin-set per-user MODEL override. Inherits provider + apiKey
  // from `globalAISettings` — useful when admin wants user X on a
  // premium model and user Y on a cheap one, but both routed through
  // the same OpenRouter key. Singleton-per-user (one row per userId).
  aiUserModelOverrides: defineTable({
    userId: v.id("users"),
    model: v.string(),
    setBy: v.id("users"),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // AI skill catalog. A "skill" is a named system-prompt template the
  // chat agent can apply, optionally bound to a slash command. Admin
  // edits the prompt; chat action looks it up by slash command.
  aiSkills: defineTable({
    key: v.string(),
    label: v.string(),
    slashCommand: v.optional(v.string()),
    description: v.string(),
    systemPrompt: v.string(),
    enabled: v.boolean(),
    isSeed: v.boolean(),
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_slash", ["slashCommand"]),

  // AI tool catalog. A "tool" is a structured action type the agent
  // can emit for the user to approve (cv.fillExperience etc.). Admin
  // curates which tools are advertised; client whitelist still gates
  // execution server-side.
  aiTools: defineTable({
    type: v.string(),
    label: v.string(),
    description: v.string(),
    payloadSchema: v.optional(v.string()),
    enabled: v.boolean(),
    isSeed: v.boolean(),
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  }).index("by_type", ["type"]),

  rateLimitEvents: defineTable({
    userId: v.id("users"),
    key: v.string(),
    timestamp: v.number(),
  })
    .index("by_user_key_time", ["userId", "key", "timestamp"])
    // Same rows, counted across all users: the global AI ceiling
    // (_shared/rateLimit.ts AI_GLOBAL_CEILING) needs a window count with no
    // userId to pin, which by_user_key_time cannot serve.
    .index("by_key_time", ["key", "timestamp"]),

  // Singleton (one row max). Model IDS pulled from models.dev by
  // `ai/catalog.ts`, so the admin picker stops being a list someone has to
  // remember to edit. Deliberately IDs only: models.dev publishes no baseUrls,
  // and the connection facts live in _shared/aiProviders.ts, which stays
  // authoritative. No index — a singleton is found with .first().
  modelCatalog: defineTable({
    providers: v.array(v.object({ id: v.string(), models: v.array(v.string()) })),
    fetchedAt: v.number(),
  }),
};
