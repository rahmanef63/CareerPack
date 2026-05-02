"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
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

  if (isDemo) return demo;

  const notifications = raw ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading: isAuthenticated && raw === undefined,
    markRead: (id: NotificationId) => markRead({ notificationId: id }),
    markAllRead: () => markAllRead(),
    dismiss: (id: NotificationId) => dismiss({ notificationId: id }),
    dismissAll: () => dismissAll(),
  };
}
