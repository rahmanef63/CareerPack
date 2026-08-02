import { internalQuery, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { enforceRateLimit } from "../../_shared/rateLimit";
import { MCP_WRITE_LIMIT, MCP_WRITE_DAILY_LIMIT } from "./limits";

/**
 * Data layer for convex/mcp/tools/notifications.ts. Internal only, `userId`
 * is an argument and is re-checked against every document — see
 * convex/mcp/data/cv.ts.
 *
 * There is no create: `notifications.mutations.createNotification` is
 * internal-only on purpose (a client that can mint its own notifications can
 * forge one that looks like it came from CareerPack), and an MCP token is
 * further from the user than the browser is.
 */

export const listNotifications = internalQuery({
  args: {
    userId: v.id("users"),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 20, 1), 50);
    // by_user_read, not a `.filter()` on by_user: filter is a post-read
    // predicate in Convex, so "20 unread" would silently mean "the unread
    // ones among the 20 newest" once the inbox has 20 read rows on top.
    const rows = args.unreadOnly
      ? await ctx.db
          .query("notifications")
          .withIndex("by_user_read", (q) =>
            q.eq("userId", args.userId).eq("read", false),
          )
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("notifications")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .order("desc")
          .take(limit);

    return {
      items: rows.map((n) => ({
        notification_id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        created_at: new Date(n._creationTime).toISOString(),
      })),
      total: rows.length,
    };
  },
});

export const markRead = internalMutation({
  args: { userId: v.id("users"), notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);

    const n = await ctx.db.get(args.notificationId);
    if (!n || n.userId !== args.userId) {
      throw new Error("Notifikasi tidak ditemukan");
    }
    await ctx.db.patch(args.notificationId, { read: true });
    return { notification_id: args.notificationId, read: true };
  },
});

export const markAllRead = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);

    let marked = 0;
    for (;;) {
      const batch = await ctx.db
        .query("notifications")
        .withIndex("by_user_read", (q) =>
          q.eq("userId", args.userId).eq("read", false),
        )
        .take(500);
      await Promise.all(batch.map((n) => ctx.db.patch(n._id, { read: true })));
      marked += batch.length;
      if (batch.length < 500) break;
    }
    return { marked };
  },
});

export const deleteNotification = internalMutation({
  args: { userId: v.id("users"), notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);

    const n = await ctx.db.get(args.notificationId);
    if (!n || n.userId !== args.userId) {
      throw new Error("Notifikasi tidak ditemukan");
    }
    await ctx.db.delete(args.notificationId);
    return { deleted: true };
  },
});
