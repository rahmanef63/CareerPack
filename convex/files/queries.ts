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

/**
 * Library listing — every file the user has uploaded plus a usage
 * map (which portfolio items reference each storageId). Powers the
 * Content Library page so the user can see what's reusable and
 * decide what's safe to delete.
 */
export const listMyFiles = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("files")
      .withIndex("by_tenant", (q) => q.eq("tenantId", userId.toString()))
      .collect();

    // Usage map: storageId → portfolio titles that reference it.
    // Cross-feature usage (CV/branding) lives off-storage in JSON
    // blobs; flagged at the slice level if needed later.
    const portfolio = await ctx.db
      .query("portfolioItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const usageBySid = new Map<string, string[]>();
    for (const item of portfolio) {
      const sids = new Set<string>();
      if (item.coverStorageId) sids.add(item.coverStorageId);
      for (const m of item.media ?? []) sids.add(m.storageId);
      for (const sid of sids) {
        const list = usageBySid.get(sid) ?? [];
        list.push(item.title);
        usageBySid.set(sid, list);
      }
    }

    const enriched = await Promise.all(
      rows.map(async (r) => ({
        ...r,
        url: await ctx.storage.getUrl(r.storageId),
        usedIn: usageBySid.get(r.storageId) ?? [],
      })),
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});
