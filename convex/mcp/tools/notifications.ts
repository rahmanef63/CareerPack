import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { ToolDef } from "../types";

/**
 * MCP tools for the `notifications` domain — the user's in-app inbox.
 *
 * Read the contract in convex/mcp/tools/index.ts first. The short version:
 * `userId` arrives from the access token, never from `args`, and every
 * `internal.mcp.data.notifications.*` function re-checks it against the row.
 *
 * No create tool: notifications are produced server-side (crons, reminders)
 * and `createNotification` is internal-only precisely so a client cannot mint
 * a message that looks like it came from CareerPack. And no delete-all: the
 * badge is cleared by marking read, so a bulk wipe driven by a token would be
 * all downside — the app has the button if the user really means it.
 */

function requireArg(args: Record<string, unknown>, key: string): string {
  const raw = args[key];
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error(`Parameter ${key} wajib diisi.`);
  }
  return raw;
}

function optionalNumber(
  args: Record<string, unknown>,
  key: string,
): number | undefined {
  const raw = args[key];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
}

export const notificationsTools: ToolDef[] = [
  {
    name: "notifications_list",
    description:
      "List the user's notifications, newest first: type, title, message, whether it has been read, and when it arrived. Use it for 'what did I miss' or 'anything new', and to get the notification_id the other notifications_* tools need. Set unread_only to answer 'what have I not seen yet' — that filter is applied in the index, so it really does return the newest UNREAD ones rather than the unread few among the newest.",
    inputSchema: {
      type: "object",
      properties: {
        unread_only: {
          type: "boolean",
          description: "true returns only unread notifications. Default false.",
        },
        limit: {
          type: "number",
          description: "How many to return. Default 20, max 50.",
        },
      },
      additionalProperties: false,
    },
    annotations: {
      title: "List notifications",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runQuery(internal.mcp.data.notifications.listNotifications, {
        userId,
        unreadOnly: args.unread_only === true,
        limit: optionalNumber(args, "limit"),
      }),
  },

  {
    name: "notifications_mark_read",
    description:
      "Mark one notification as read. notification_id comes from notifications_list. Use it after telling the user what a specific notification said, so the app's badge matches what they actually know about. Marking read only changes the badge — the notification stays in the inbox and can still be listed.",
    inputSchema: {
      type: "object",
      properties: {
        notification_id: {
          type: "string",
          description: "Id from notifications_list.",
        },
      },
      required: ["notification_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Mark notification read",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.mcp.data.notifications.markRead, {
        userId,
        notificationId: requireArg(args, "notification_id") as Id<"notifications">,
      }),
  },

  {
    name: "notifications_mark_all_read",
    description:
      "Mark every unread notification as read and return how many were changed. This is the tool for 'clear the badge' / 'tandai semua sudah dibaca'. Nothing is deleted. Read them out with notifications_list before calling if the user has not seen them yet, or they lose track of what was there.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: {
      title: "Mark all notifications read",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId) =>
      await ctx.runMutation(internal.mcp.data.notifications.markAllRead, {
        userId,
      }),
  },

  {
    name: "notifications_delete",
    description:
      "Permanently delete one notification. There is no undo. To clear the unread badge use notifications_mark_read instead — that keeps the message where the user can find it again.",
    inputSchema: {
      type: "object",
      properties: {
        notification_id: {
          type: "string",
          description: "Id from notifications_list.",
        },
      },
      required: ["notification_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Delete notification",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.mcp.data.notifications.deleteNotification, {
        userId,
        notificationId: requireArg(args, "notification_id") as Id<"notifications">,
      }),
  },
];
