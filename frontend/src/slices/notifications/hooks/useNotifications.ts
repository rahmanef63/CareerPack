"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { NotificationId } from "../types";

export function useNotifications() {
  const notifications = useQuery(api.notifications.getUserNotifications) ?? [];
  const markRead = useMutation(api.notifications.markNotificationAsRead);
  const markAllRead = useMutation(api.notifications.markAllNotificationsAsRead);
  const dismiss = useMutation(api.notifications.deleteNotification);
  const dismissAll = useMutation(api.notifications.deleteAllNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading: notifications === undefined,
    markRead: (id: NotificationId) => markRead({ notificationId: id }),
    markAllRead: () => markAllRead(),
    dismiss: (id: NotificationId) => dismiss({ notificationId: id }),
    dismissAll: () => dismissAll(),
  };
}
