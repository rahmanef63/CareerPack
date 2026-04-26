import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { optionalUser, requireUser } from "../_shared/auth";
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
