import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireAdmin } from "../_shared/auth";
import { AI_PROVIDERS } from "../_shared/aiProviders";
import { enforceRateLimit, AI_RATE_LIMITS } from "../_shared/rateLimit";
import { DEFAULT_AI_SKILLS, DEFAULT_AI_TOOLS } from "../_seeds/aiDefaults";

/**
 * SSRF guard for a user-supplied custom AI provider Base URL. `callAI` fetches
 * `${baseUrl}/chat/completions` server-side from the Convex backend on the VPS,
 * so an unvalidated URL lets any authed user (incl. anonymous demo) probe the
 * VPS's own network / cloud metadata endpoint. Require https and reject
 * loopback / link-local / private / internal hosts.
 *
 * ponytail: hostname/IP-literal deny-list only — it will NOT stop DNS
 * rebinding (a public name resolving to a private IP). Upgrade to resolve-then-
 * check-IP if custom providers ever become a real attack surface.
 */
function assertSafeBaseUrl(raw: string): void {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Base URL tidak valid");
  }
  if (url.protocol !== "https:") {
    throw new Error("Base URL harus memakai https");
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const blocked =
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.startsWith("fd") ||
    host.startsWith("fc") ||
    host.startsWith("fe80") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (blocked) {
    throw new Error("Base URL menuju host internal tidak diizinkan");
  }
}

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
    const userId = await requireUser(ctx);

    const spec = AI_PROVIDERS[args.provider];
    if (!spec) throw new Error(`Provider tidak dikenal: ${args.provider}`);

    const model = args.model.trim();
    if (!model) throw new Error("Model wajib diisi");

    const rawKey = args.apiKey.trim();
    const baseUrl = args.baseUrl?.trim() || undefined;
    if (args.provider === "custom" && !baseUrl) {
      throw new Error("Provider kustom butuh Base URL");
    }
    if (baseUrl) assertSafeBaseUrl(baseUrl);

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
    const userId = await requireUser(ctx);
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
    const userId = await requireUser(ctx);
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
    if (baseUrl) assertSafeBaseUrl(baseUrl);

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

    // Exact-match via the authTables `email` index (O(log N)) instead of a
    // full-table .filter() scan — same lookup path as passwordReset.ts.
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
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

// ----- AI Skills (admin) -----

export const seedAISkills = mutation({
  args: {},
  handler: async (ctx) => {
    const adminId = await requireAdmin(ctx);
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const now = Date.now();
    for (const seed of DEFAULT_AI_SKILLS) {
      const existing = await ctx.db
        .query("aiSkills")
        .withIndex("by_key", (q) => q.eq("key", seed.key))
        .first();
      if (existing) {
        // Refresh outdated default rows; never clobber admin edits.
        if (!existing.isSeed) {
          skipped++;
          continue;
        }
        await ctx.db.patch(existing._id, {
          label: seed.label,
          slashCommand: seed.slashCommand,
          description: seed.description,
          systemPrompt: seed.systemPrompt,
          updatedBy: adminId,
          updatedAt: now,
        });
        updated++;
        continue;
      }
      await ctx.db.insert("aiSkills", {
        key: seed.key,
        label: seed.label,
        slashCommand: seed.slashCommand,
        description: seed.description,
        systemPrompt: seed.systemPrompt,
        enabled: true,
        isSeed: true,
        updatedBy: adminId,
        updatedAt: now,
      });
      inserted++;
    }
    return { inserted, updated, skipped, total: DEFAULT_AI_SKILLS.length };
  },
});

export const upsertAISkill = mutation({
  args: {
    id: v.optional(v.id("aiSkills")),
    key: v.string(),
    label: v.string(),
    slashCommand: v.optional(v.string()),
    description: v.string(),
    systemPrompt: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx);
    const key = args.key.trim();
    const label = args.label.trim();
    const slashCommand = args.slashCommand?.trim() || undefined;
    const description = args.description.trim();
    const systemPrompt = args.systemPrompt.trim();

    if (!key) throw new Error("Key wajib");
    if (!label) throw new Error("Label wajib");
    if (!systemPrompt) throw new Error("System prompt wajib");
    if (slashCommand && !slashCommand.startsWith("/")) {
      throw new Error("Slash command harus diawali /");
    }

    const patch = {
      key,
      label,
      slashCommand,
      description,
      systemPrompt,
      enabled: args.enabled,
      updatedBy: adminId,
      updatedAt: Date.now(),
    };

    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing) throw new Error("Skill tidak ditemukan");
      await ctx.db.patch(args.id, patch);
      return args.id;
    }

    const dup = await ctx.db
      .query("aiSkills")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (dup) throw new Error(`Key "${key}" sudah dipakai`);

    return await ctx.db.insert("aiSkills", { ...patch, isSeed: false });
  },
});

export const toggleAISkill = mutation({
  args: { id: v.id("aiSkills"), enabled: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { enabled: args.enabled, updatedAt: Date.now() });
  },
});

export const deleteAISkill = mutation({
  args: { id: v.id("aiSkills") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const row = await ctx.db.get(args.id);
    if (!row) return;
    if (row.isSeed) {
      throw new Error("Skill default tidak bisa dihapus — nonaktifkan saja.");
    }
    await ctx.db.delete(args.id);
  },
});

// ----- AI Tools (admin) -----

export const seedAITools = mutation({
  args: {},
  handler: async (ctx) => {
    const adminId = await requireAdmin(ctx);
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const now = Date.now();
    for (const seed of DEFAULT_AI_TOOLS) {
      const existing = await ctx.db
        .query("aiTools")
        .withIndex("by_type", (q) => q.eq("type", seed.type))
        .first();
      if (existing) {
        if (!existing.isSeed) {
          skipped++;
          continue;
        }
        await ctx.db.patch(existing._id, {
          label: seed.label,
          description: seed.description,
          payloadSchema: seed.payloadSchema,
          updatedBy: adminId,
          updatedAt: now,
        });
        updated++;
        continue;
      }
      await ctx.db.insert("aiTools", {
        type: seed.type,
        label: seed.label,
        description: seed.description,
        payloadSchema: seed.payloadSchema,
        enabled: true,
        isSeed: true,
        updatedBy: adminId,
        updatedAt: now,
      });
      inserted++;
    }
    return { inserted, updated, skipped, total: DEFAULT_AI_TOOLS.length };
  },
});

export const upsertAITool = mutation({
  args: {
    id: v.optional(v.id("aiTools")),
    type: v.string(),
    label: v.string(),
    description: v.string(),
    payloadSchema: v.optional(v.string()),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx);
    const type = args.type.trim();
    const label = args.label.trim();
    const description = args.description.trim();
    const payloadSchema = args.payloadSchema?.trim() || undefined;

    if (!type) throw new Error("Type wajib");
    if (!label) throw new Error("Label wajib");

    const patch = {
      type,
      label,
      description,
      payloadSchema,
      enabled: args.enabled,
      updatedBy: adminId,
      updatedAt: Date.now(),
    };

    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing) throw new Error("Tool tidak ditemukan");
      await ctx.db.patch(args.id, patch);
      return args.id;
    }

    const dup = await ctx.db
      .query("aiTools")
      .withIndex("by_type", (q) => q.eq("type", type))
      .first();
    if (dup) throw new Error(`Type "${type}" sudah dipakai`);

    return await ctx.db.insert("aiTools", { ...patch, isSeed: false });
  },
});

export const toggleAITool = mutation({
  args: { id: v.id("aiTools"), enabled: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { enabled: args.enabled, updatedAt: Date.now() });
  },
});

export const deleteAITool = mutation({
  args: { id: v.id("aiTools") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const row = await ctx.db.get(args.id);
    if (!row) return;
    if (row.isSeed) {
      throw new Error("Tool default tidak bisa dihapus — nonaktifkan saja.");
    }
    await ctx.db.delete(args.id);
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

/**
 * Refund the most-recent AI quota events for a user. Called when the
 * AI gateway returns a non-user error (provider 5xx, model deprecated,
 * key revoked) so the user isn't billed for a request that never landed.
 *
 * Refund window: 60s. Wider would risk deleting unrelated successful
 * events; tighter would miss long retry-then-fail flows.
 *
 * Only deletes the SINGLE most-recent event per bucket — that's the row
 * `enforceRateLimit` just inserted before the failed call.
 */
export const _refundAIQuota = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const now = Date.now();
    const refundWindow = 60 * 1000;
    for (const key of ["ai:minute", "ai:day"] as const) {
      const events = await ctx.db
        .query("rateLimitEvents")
        .withIndex("by_user_key_time", (q) =>
          q.eq("userId", userId).eq("key", key).gte("timestamp", now - refundWindow),
        )
        .collect();
      if (events.length === 0) continue;
      // Delete the latest only — earlier rows could be from prior calls
      // within the same window that succeeded.
      const latest = events.reduce((a, b) => (a.timestamp >= b.timestamp ? a : b));
      await ctx.db.delete(latest._id);
    }
  },
});

// ----- Chat sessions -----

const MAX_SESSION_ID_LEN = 100;
const MAX_TITLE_LEN = 200;
const MAX_MESSAGE_LEN = 4000;
const MAX_MESSAGES_PER_SESSION = 200;
const MAX_PREVIEW_LEN = 160;
const MAX_ACTIONS_PER_MSG = 10;
const MAX_ACTION_TYPE = 60;
const MAX_SESSIONS_PER_USER = 50;

const ROLE_WHITELIST = new Set(["user", "assistant", "system"]);
// Action types are slice-manifest skill IDs — too dynamic to whitelist
// here (backend can't import frontend manifests). Enforce a structural
// pattern instead: `<namespace>.<action>`, kebab/camel allowed.
const ACTION_TYPE_PATTERN = /^[a-z][a-z0-9]*(?:\.[a-zA-Z0-9-]+)+$/;
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
          if (!ACTION_TYPE_PATTERN.test(type)) {
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

    // Denormalize list-view metadata so `listChatSessions` never deserializes
    // the full `messages` array. `content` is already capped above; slice again
    // for the short preview.
    const messageCount = messages.length;
    const lastMessagePreview =
      messages[messages.length - 1]?.content.slice(0, MAX_PREVIEW_LEN) ?? "";

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
        messageCount,
        lastMessagePreview,
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
      messageCount,
      lastMessagePreview,
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
