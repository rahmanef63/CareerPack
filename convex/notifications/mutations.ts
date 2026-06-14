import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "../_shared/auth";
import { sanitizeActionUrl } from "../_shared/url";

// INTERNAL ONLY. Notifications are produced server-side (crons, actions, other
// mutations) — never by the client. Exposing this publicly let any
// authenticated user self-insert rows with an attacker-chosen type/title/
// message (spoofing/abuse). Producers call it via
// `ctx.runMutation(internal.notifications.mutations.createNotification, { userId, … })`.
// `userId` is now an explicit arg because internal callers have no auth
// session to derive it from (mirrors the direct insert in
// `calendar/reminders.ts`, which already used `ev.userId`).
export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    actionUrl: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // actionUrl is rendered verbatim as a Link href in NotificationsView, so
    // pass it through the URL allowlist (http(s)/relative/anchor only) before
    // storing. Anything else (javascript:/data:/file:/…) is dropped — not
    // stored — to close the open-redirect / javascript: href vector.
    const safeActionUrl = args.actionUrl
      ? sanitizeActionUrl(args.actionUrl) || undefined
      : undefined;
    return await ctx.db.insert("notifications", {
      userId: args.userId,
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
