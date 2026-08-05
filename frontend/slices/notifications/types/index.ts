import type { Doc, Id } from "../../../../convex/_generated/dataModel";

export type NotificationDoc = Doc<"notifications">;
export type NotificationId = Id<"notifications">;

export type NotificationFilter = "all" | "unread" | "important";

export type NotificationType =
  | "deadline"
  | "interview"
  | "application"
  | "system"
  | "tip"
  // Written by the calendar reminder cron — the only production producer of
  // an "important" notification. Missing here, it fell through to the default
  // icon and never matched the Penting filter, which stayed permanently empty.
  | "reminder";

export const IMPORTANT_TYPES: ReadonlyArray<NotificationType> = [
  "deadline",
  "interview",
  "reminder",
];

export interface NotificationGroup {
  label: string;
  items: NotificationDoc[];
}
