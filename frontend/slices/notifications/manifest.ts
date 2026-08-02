import { Bell } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Notifications slice manifest — lightweight read + bulk ops surface
 * for the AI agent. The agent can summarise unread notifications,
 * mark them all read, or wipe the inbox. Per-row delete stays in
 * the slice UI to keep agent payload size minimal.
 */
export const notificationsManifest: SliceManifest = {
  id: "notifications",
  label: "Notifikasi",
  description: "Inbox notifikasi reminder + sistem",
  icon: Bell,

  skills: [
    {
      id: "notifications.list",
      label: "Lihat notifikasi",
      description:
        "Ambil 50 notifikasi terakhir user (notificationId, type, title, message, read, scheduledFor). Pakai untuk 'apa notifikasi saya', sebelum mark/delete butuh notificationId.",
      kind: "query",
    },
    {
      id: "notifications.mark-all-read",
      label: "Tandai semua dibaca",
      description:
        "Set read=true pada semua notifikasi user. Pakai untuk 'tandai semua sudah dibaca', 'kosongkan badge'.",
      kind: "mutation",
      cta: "Tandai dibaca",
    },
    {
      id: "notifications.delete-all",
      label: "Hapus semua notifikasi",
      description:
        "Hapus semua notifikasi user. Aksi destructive — perlu approval. Pakai HANYA bila user eksplisit minta 'hapus semua notifikasi', 'kosongkan inbox'.",
      kind: "mutation",
      cta: "Hapus semua",
    },
  ],
};
