"use client";

import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { withMutationToast } from "@/shared/lib/notify";
import { useAuth } from "@/shared/hooks/useAuth";
import { useDemoNotificationsOverlay } from "@/shared/hooks/useDemoOverlay";
import type { NotificationId } from "../types";

export function useNotifications() {
  const { state } = useAuth();
  const isAuthenticated = state.isAuthenticated;
  const isDemo = state.isDemo;

  const raw = useQuery(
    api.notifications.queries.getUserNotifications,
    isAuthenticated && !isDemo ? {} : "skip",
  );
  const markRead = useMutation(api.notifications.mutations.markNotificationAsRead);
  const markAllRead = useMutation(api.notifications.mutations.markAllNotificationsAsRead);
  const dismiss = useMutation(api.notifications.mutations.deleteNotification);
  const dismissAll = useMutation(api.notifications.mutations.deleteAllNotifications);

  const demo = useDemoNotificationsOverlay();

  // All four are fire-and-forget from rows / header buttons — toast on
  // failure and swallow so a rejected mutation (offline, or the doc
  // deleted in another reactive tab) can't surface a false success toast
  // or an unhandled rejection.
  const markReadFn = useCallback(
    (id: NotificationId) =>
      withMutationToast(() => markRead({ notificationId: id }), {
        error: "Gagal menandai notifikasi",
      }).catch(() => {}),
    [markRead],
  );

  const markAllReadFn = useCallback(
    () =>
      withMutationToast(() => markAllRead(), {
        success: "Semua notifikasi ditandai sudah dibaca",
        error: "Gagal menandai notifikasi",
      }).catch(() => {}),
    [markAllRead],
  );

  const dismissFn = useCallback(
    (id: NotificationId) =>
      withMutationToast(() => dismiss({ notificationId: id }), {
        error: "Gagal menghapus notifikasi",
      }).catch(() => {}),
    [dismiss],
  );

  const dismissAllFn = useCallback(
    () =>
      withMutationToast(() => dismissAll(), {
        success: "Semua notifikasi dibersihkan",
        error: "Gagal menghapus notifikasi",
      }).catch(() => {}),
    [dismissAll],
  );

  if (isDemo) return demo;

  const notifications = raw ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading: isAuthenticated && raw === undefined,
    markRead: markReadFn,
    markAllRead: markAllReadFn,
    dismiss: dismissFn,
    dismissAll: dismissAllFn,
  };
}
