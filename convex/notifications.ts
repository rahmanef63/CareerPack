import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { optionalUser, requireUser, requireOwnedDoc } from "./_lib/auth";

export const getUserNotifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

export const createNotification = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    message: v.string(),
    actionUrl: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await ctx.db.insert("notifications", {
      userId,
      type: args.type,
      title: args.title,
      message: args.message,
      read: false,
      actionUrl: args.actionUrl,
      scheduledFor: args.scheduledFor,
    });
  },
});

export const markNotificationAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.notificationId, "Notifikasi");
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

export const markAllNotificationsAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    await Promise.all(
      notifications.map((n) => ctx.db.patch(n._id, { read: true })),
    );
  },
});

export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.notificationId, "Notifikasi");
    await ctx.db.delete(args.notificationId);
  },
});

export const deleteAllNotifications = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    await Promise.all(notifications.map((n) => ctx.db.delete(n._id)));
  },
});
