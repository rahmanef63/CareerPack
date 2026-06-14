import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "../_shared/auth";
import { sanitizeActionUrl } from "../_shared/url";

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
    // actionUrl is rendered verbatim as a Link href in NotificationsView, so
    // pass it through the URL allowlist (http(s)/relative/anchor only) before
    // storing. Anything else (javascript:/data:/file:/…) is dropped — not
    // stored — to close the open-redirect / javascript: href vector.
    const safeActionUrl = args.actionUrl
      ? sanitizeActionUrl(args.actionUrl) || undefined
      : undefined;
    return await ctx.db.insert("notifications", {
      userId,
      type: args.type,
      title: args.title,
      message: args.message,
      read: false,
      actionUrl: safeActionUrl,
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
