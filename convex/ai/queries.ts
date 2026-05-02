import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { optionalUser, requireAdmin } from "../_shared/auth";
import { listProvidersPublic } from "../_shared/aiProviders";

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "•".repeat(key.length);
  return `${key.slice(0, 4)}${"•".repeat(Math.max(4, key.length - 8))}${key.slice(-4)}`;
}

// ----- AI Settings -----

export const listAIProviders = query({
  args: {},
  handler: async () => listProvidersPublic(),
});

export const getMyAISettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const row = await ctx.db
      .query("aiSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!row) return null;
    return {
      provider: row.provider,
      model: row.model,
      baseUrl: row.baseUrl ?? null,
      enabled: row.enabled,
      hasKey: row.apiKey.length > 0,
      keyPreview: maskKey(row.apiKey),
      updatedAt: row.updatedAt,
    };
  },
});

export const _getAISettingsForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const row = await ctx.db
      .query("aiSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!row || !row.enabled || !row.apiKey) return null;
    return {
      provider: row.provider,
      model: row.model,
      apiKey: row.apiKey,
      baseUrl: row.baseUrl ?? null,
    };
  },
});

// ----- Global (admin-managed) AI settings -----

export const _getGlobalAISettings = internalQuery({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query("globalAISettings").first();
    if (!row || !row.enabled || !row.apiKey) return null;
    return {
      provider: row.provider,
      model: row.model,
      apiKey: row.apiKey,
      baseUrl: row.baseUrl ?? null,
    };
  },
});

export const getGlobalAISettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const row = await ctx.db.query("globalAISettings").first();
    if (!row) return null;
    return {
      provider: row.provider,
      model: row.model,
      baseUrl: row.baseUrl ?? null,
      enabled: row.enabled,
      hasKey: row.apiKey.length > 0,
      keyPreview: maskKey(row.apiKey),
      updatedAt: row.updatedAt,
    };
  },
});

// ----- Per-user model override (admin) -----

export const _getUserModelOverride = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const row = await ctx.db
      .query("aiUserModelOverrides")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return row?.model ?? null;
  },
});

export const listAIOverrides = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("aiUserModelOverrides").collect();
    const enriched = await Promise.all(
      rows.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        return {
          userId: r.userId,
          email: user?.email ?? null,
          name: user?.name ?? null,
          model: r.model,
          updatedAt: r.updatedAt,
        };
      }),
    );
    return enriched.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

// ----- AI Skills (admin-curated prompt templates) -----

export const listAISkills = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("aiSkills").collect();
    return rows.sort((a, b) => a.label.localeCompare(b.label, "id"));
  },
});

export const _getEnabledSkillBySlash = internalQuery({
  args: { slashCommand: v.string() },
  handler: async (ctx, { slashCommand }) => {
    const row = await ctx.db
      .query("aiSkills")
      .withIndex("by_slash", (q) => q.eq("slashCommand", slashCommand))
      .first();
    if (!row || !row.enabled) return null;
    return { systemPrompt: row.systemPrompt, label: row.label };
  },
});

// ----- AI Tools (admin-curated action catalog) -----

export const listAITools = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("aiTools").collect();
    return rows.sort((a, b) => a.type.localeCompare(b.type));
  },
});

export const _getEnabledTools = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("aiTools").collect();
    return rows
      .filter((r) => r.enabled)
      .map((r) => ({ type: r.type, description: r.description }));
  },
});

// ----- Chat sessions -----

export const listChatSessions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    const sessions = await ctx.db
      .query("chatConversations")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return sessions.map((s) => ({
      _id: s._id,
      sessionId: s.sessionId,
      title: s.title,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messageCount: s.messages.length,
      preview: s.messages[s.messages.length - 1]?.content.slice(0, 160) ?? "",
    }));
  },
});

export const getChatSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const userId = await optionalUser(ctx);
    if (!userId) return null;
    const session = await ctx.db
      .query("chatConversations")
      .withIndex("by_user_session", (q) =>
        q.eq("userId", userId).eq("sessionId", args.sessionId),
      )
      .first();
    return session;
  },
});

/**
 * Internal companion to `getChatSession` — used by the chat action so
 * it can read authoritative session history server-side. Without
 * this, the action depended entirely on `args.messages` from the
 * client; if the local React state hadn't hydrated from server (race
 * on first render), the AI would see only the new turn and "forget"
 * prior context. Auth-scoped: returns null if the session isn't
 * owned by the caller.
 */
export const _getChatHistoryForUser = internalQuery({
  args: { userId: v.id("users"), sessionId: v.string() },
  handler: async (ctx, { userId, sessionId }) => {
    const session = await ctx.db
      .query("chatConversations")
      .withIndex("by_user_session", (q) =>
        q.eq("userId", userId).eq("sessionId", sessionId),
      )
      .first();
    if (!session) return null;
    return session.messages.map((m) => ({ role: m.role, content: m.content }));
  },
});
