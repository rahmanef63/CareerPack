import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

export type NotificationDoc = Doc<"notifications">;
export type NotificationId = Id<"notifications">;

export type NotificationFilter = "all" | "unread" | "important";

export type NotificationType =
  | "deadline"
  | "interview"
  | "application"
  | "system"
  | "tip";

export const IMPORTANT_TYPES: ReadonlyArray<NotificationType> = [
  "deadline",
  "interview",
];

export interface NotificationGroup {
  label: string;
  items: NotificationDoc[];
}
