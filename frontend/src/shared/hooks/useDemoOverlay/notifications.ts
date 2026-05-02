"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorageState } from "../useLocalStorageState";
import {
  DEMO_NOTIFICATIONS,
  type DemoNotificationSeed,
  type DemoNotificationType,
} from "@/shared/data/demoUser";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { HOUR } from "./_constants";

const NOTIFICATIONS_KEY = "careerpack:demo:notifications";

type NotificationDoc = Doc<"notifications">;

interface NotificationsHook {
  notifications: NotificationDoc[];
  unreadCount: number;
  isLoading: boolean;
  markRead: (id: Id<"notifications">) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismiss: (id: Id<"notifications">) => Promise<void>;
  dismissAll: () => Promise<void>;
}

function notificationFromSeed(s: DemoNotificationSeed, now: number): NotificationDoc {
  const ts = now - s.hoursAgo * HOUR;
  return {
    _id: s.id as unknown as Id<"notifications">,
    _creationTime: ts,
    userId: "demo" as unknown as Id<"users">,
    type: s.type as DemoNotificationType,
    title: s.title,
    message: s.message,
    read: s.read,
    actionUrl: s.actionUrl,
  };
}

export function useDemoNotificationsOverlay(): NotificationsHook {
  const [seeds, setSeeds] = useLocalStorageState<DemoNotificationSeed[]>(
    NOTIFICATIONS_KEY,
    [...DEMO_NOTIFICATIONS],
  );
  const now = Date.now();
  const notifications = useMemo(
    () => seeds.map((s) => notificationFromSeed(s, now)),
    [seeds, now],
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead: NotificationsHook["markRead"] = useCallback(
    async (id) => {
      setSeeds((prev) =>
        prev.map((s) => (s.id === id ? { ...s, read: true } : s)),
      );
    },
    [setSeeds],
  );

  const markAllRead: NotificationsHook["markAllRead"] = useCallback(
    async () => {
      setSeeds((prev) => prev.map((s) => ({ ...s, read: true })));
    },
    [setSeeds],
  );

  const dismiss: NotificationsHook["dismiss"] = useCallback(
    async (id) => {
      setSeeds((prev) => prev.filter((s) => s.id !== id));
    },
    [setSeeds],
  );

  const dismissAll: NotificationsHook["dismissAll"] = useCallback(
    async () => {
      setSeeds(() => []);
    },
    [setSeeds],
  );

  return {
    notifications, unreadCount, isLoading: false,
    markRead, markAllRead, dismiss, dismissAll,
  };
}
