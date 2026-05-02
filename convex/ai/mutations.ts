import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireUser, requireAdmin } from "../_shared/auth";
import { AI_PROVIDERS } from "../_shared/aiProviders";
import { enforceRateLimit, AI_RATE_LIMITS } from "../_shared/rateLimit";

// ----- AI Settings -----

export const setMyAISettings = mutation({
  args: {
    provider: v.string(),
    model: v.string(),
    apiKey: v.string(),
    baseUrl: v.optional(v.string()),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Tidak terautentikasi");

    const spec = AI_PROVIDERS[args.provider];
    if (!spec) throw new Error(`Provider tidak dikenal: ${args.provider}`);

    const model = args.model.trim();
    if (!model) throw new Error("Model wajib diisi");

    const rawKey = args.apiKey.trim();
    const baseUrl = args.baseUrl?.trim() || undefined;
    if (args.provider === "custom" && !baseUrl) {
      throw new Error("Provider kustom butuh Base URL");
    }

    const existing = await ctx.db
      .query("aiSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const apiKey = rawKey || existing?.apiKey || "";
    if (args.enabled && !apiKey) throw new Error("API key wajib saat AI kustom diaktifkan");

    const patch = {
      userId,
      provider: args.provider,
      model,
      apiKey,
      baseUrl,
      enabled: args.enabled,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("aiSettings", patch);
  },
});

export const toggleAIEnabled = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, { enabled }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Tidak terautentikasi");
    const existing = await ctx.db
      .query("aiSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!existing) throw new Error("Belum ada konfigurasi AI");
    if (enabled && !existing.apiKey) throw new Error("API key belum diisi");
    await ctx.db.patch(existing._id, { enabled, updatedAt: Date.now() });
  },
});

export const clearMyAISettings = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Tidak terautentikasi");
    const existing = await ctx.db
      .query("aiSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

// ----- Global (admin-managed) AI settings -----

export const setGlobalAISettings = mutation({
  args: {
    provider: v.string(),
    model: v.string(),
    apiKey: v.string(),
    baseUrl: v.optional(v.string()),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx);

    const spec = AI_PROVIDERS[args.provider];
    if (!spec) throw new Error(`Provider tidak dikenal: ${args.provider}`);

    const model = args.model.trim();
    if (!model) throw new Error("Model wajib diisi");

    const rawKey = args.apiKey.trim();
    const baseUrl = args.baseUrl?.trim() || undefined;
    if (args.provider === "custom" && !baseUrl) {
      throw new Error("Provider kustom butuh Base URL");
    }

    const existing = await ctx.db.query("globalAISettings").first();
    const apiKey = rawKey || existing?.apiKey || "";
    if (args.enabled && !apiKey) throw new Error("API key wajib saat global AI diaktifkan");

    const patch = {
      provider: args.provider,
      model,
      apiKey,
      baseUrl,
      enabled: args.enabled,
      updatedBy: adminId,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("globalAISettings", patch);
  },
});

export const clearGlobalAISettings = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.query("globalAISettings").first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

// ----- Per-user model override (admin) -----

export const setUserAIModelOverride = mutation({
  args: { email: v.string(), model: v.string() },
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx);

    const email = args.email.trim().toLowerCase();
    if (!email) throw new Error("Email wajib");
    const model = args.model.trim();
    if (!model) throw new Error("Model wajib");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first();
    if (!user) throw new Error(`User dengan email ${email} tidak ditemukan`);

    const existing = await ctx.db
      .query("aiUserModelOverrides")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const patch = {
      userId: user._id,
      model,
      setBy: adminId,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("aiUserModelOverrides", patch);
    }
    return { userId: user._id, email };
  },
});

export const clearUserAIModelOverride = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("aiUserModelOverrides")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

// ----- AI quota internal helper -----

export const _checkAIQuota = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await enforceRateLimit(ctx, userId, AI_RATE_LIMITS["ai:minute"]);
    await enforceRateLimit(ctx, userId, AI_RATE_LIMITS["ai:day"]);
  },
});

// ----- Chat sessions -----

const MAX_SESSION_ID_LEN = 100;
const MAX_TITLE_LEN = 200;
const MAX_MESSAGE_LEN = 4000;
const MAX_MESSAGES_PER_SESSION = 200;
const MAX_ACTIONS_PER_MSG = 10;
const MAX_ACTION_TYPE = 60;
const MAX_SESSIONS_PER_USER = 50;

const ROLE_WHITELIST = new Set(["user", "assistant", "system"]);
const ACTION_TYPE_WHITELIST = new Set([
  "cv.fillExperience",
  "cv.improveSummary",
  "cv.addSkills",
  "cv.setFormat",
  "roadmap.generate",
  "interview.startSession",
  "match.recommend",
  "nav.go",
]);
const ACTION_STATUS_WHITELIST = new Set([
  "pending",
  "approved",
  "rejected",
  "executed",
  "failed",
]);

function trimLen(field: string, value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) {
    throw new Error(`${field} 1-${max} karakter`);
  }
  return trimmed;
}

export const upsertChatSession = mutation({
  args: {
    sessionId: v.string(),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
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
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const sessionId = trimLen("Session ID", args.sessionId, MAX_SESSION_ID_LEN);
    const title = trimLen("Judul", args.title, MAX_TITLE_LEN);

    if (!Number.isFinite(args.createdAt) || !Number.isFinite(args.updatedAt)) {
      throw new Error("Timestamp tidak valid");
    }

    const capped = args.messages.slice(-MAX_MESSAGES_PER_SESSION);
    const messages = capped.map((m) => {
      if (!ROLE_WHITELIST.has(m.role)) {
        throw new Error("Role tidak valid");
      }
      const msgId = trimLen("Message ID", m.id, 100);
      const content = m.content.slice(0, MAX_MESSAGE_LEN);
      if (!Number.isFinite(m.timestamp)) {
        throw new Error("Timestamp message tidak valid");
      }

      let actions: typeof m.actions = undefined;
      if (m.actions && m.actions.length > 0) {
        if (m.actions.length > MAX_ACTIONS_PER_MSG) {
          throw new Error(`Actions ≤${MAX_ACTIONS_PER_MSG} per message`);
        }
        actions = m.actions.map((a) => {
          const type = trimLen("Action type", a.type, MAX_ACTION_TYPE);
          if (!ACTION_TYPE_WHITELIST.has(type)) {
            throw new Error("Action type tidak valid");
          }
          const status = a.status;
          if (status !== undefined && !ACTION_STATUS_WHITELIST.has(status)) {
            throw new Error("Status action tidak valid");
          }
          return { type, payload: a.payload, status };
        });
      }

      return { id: msgId, role: m.role, content, timestamp: m.timestamp, actions };
    });

    const existing = await ctx.db
      .query("chatConversations")
      .withIndex("by_user_session", (q) =>
        q.eq("userId", userId).eq("sessionId", sessionId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title,
        messages,
        updatedAt: args.updatedAt,
      });
      return existing._id;
    }

    const all = await ctx.db
      .query("chatConversations")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    if (all.length >= MAX_SESSIONS_PER_USER) {
      const oldest = all[all.length - 1];
      await ctx.db.delete(oldest._id);
    }

    return await ctx.db.insert("chatConversations", {
      userId,
      sessionId,
      title,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
      messages,
    });
  },
});

export const deleteChatSession = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const sessionId = trimLen("Session ID", args.sessionId, MAX_SESSION_ID_LEN);
    const session = await ctx.db
      .query("chatConversations")
      .withIndex("by_user_session", (q) =>
        q.eq("userId", userId).eq("sessionId", sessionId),
      )
      .first();
    if (session) await ctx.db.delete(session._id);
  },
});

export const deleteAllChatSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const all = await ctx.db
      .query("chatConversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const s of all) {
      await ctx.db.delete(s._id);
    }
  },
});
