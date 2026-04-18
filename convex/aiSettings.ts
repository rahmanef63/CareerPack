import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { AI_PROVIDERS, listProvidersPublic } from "./_lib/aiProviders";

function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "•".repeat(key.length);
  return `${key.slice(0, 4)}${"•".repeat(Math.max(4, key.length - 8))}${key.slice(-4)}`;
}

export const listProviders = query({
  args: {},
  handler: async () => listProvidersPublic(),
});

export const getMine = query({
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

export const setMine = mutation({
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

    // Empty = keep existing key (untuk edit tanpa ketik ulang key).
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

export const toggle = mutation({
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

export const clearMine = mutation({
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

export const _getForUser = internalQuery({
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
