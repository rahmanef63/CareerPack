import { query } from "../_generated/server";
import { v } from "convex/values";
import { optionalUser } from "../_shared/auth";

export const getFileUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    const userId = await optionalUser(ctx);
    if (!userId) return null;

    const record = await ctx.db
      .query("files")
      .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
      .first();
    if (!record) return null;

    if (record.tenantId !== userId.toString()) return null;

    return await ctx.storage.getUrl(args.storageId);
  },
});

export const listMyFiles = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("files")
      .withIndex("by_tenant", (q) => q.eq("tenantId", userId.toString()))
      .collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});
