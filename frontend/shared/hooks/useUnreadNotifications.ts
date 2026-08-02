"use client";

import { useNotifications } from "@/slices/notifications/hooks/useNotifications";

/**
 * Live unread-notification count for the app shell (header bell + nav
 * badges). Thin re-use of the notifications slice hook so the shell
 * shares its single Convex subscription — Convex dedupes identical
 * `getUserNotifications` queries, so this adds no new provider and no
 * extra network subscription. Returns 0 for unauthenticated / loading /
 * demo, so it is safe to render anywhere in the shell.
 */
export function useUnreadNotifications(): number {
  return useNotifications().unreadCount;
}

/**
 * Formats an unread count for a compact nav badge: `undefined` when the
 * count is 0 (caller hides the badge), the number as-is up to 9, then
 * `"9+"`.
 */
export function formatUnreadBadge(count: number): string | undefined {
  if (count <= 0) return undefined;
  return count > 9 ? "9+" : String(count);
}
