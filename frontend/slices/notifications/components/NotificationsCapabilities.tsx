"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { subscribe } from "@/shared/lib/aiActionBus";
import { notify } from "@/shared/lib/notify";

/**
 * Notifications capability binder — wires bulk mutation skills.
 * The query skill (`notifications.list`) is handled server-side by
 * skillHandlers.
 */
export function NotificationsCapabilities() {
  const markAll = useMutation(api.notifications.mutations.markAllNotificationsAsRead);
  const deleteAll = useMutation(api.notifications.mutations.deleteAllNotifications);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribe<Record<string, never>>("notifications.mark-all-read", async () => {
        try {
          await markAll({});
          notify.success("Semua notifikasi ditandai dibaca");
        } catch (err) {
          notify.fromError(err, "Gagal tandai notifikasi");
        }
      }),
    );

    unsubs.push(
      subscribe<Record<string, never>>("notifications.delete-all", async () => {
        try {
          await deleteAll({});
          notify.success("Inbox dikosongkan");
        } catch (err) {
          notify.fromError(err, "Gagal hapus notifikasi");
        }
      }),
    );

    return () => {
      for (const u of unsubs) u();
    };
  }, [markAll, deleteAll]);

  return null;
}
