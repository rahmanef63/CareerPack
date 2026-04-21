# Notifikasi

## Tujuan

Inbox notifikasi in-app — deadline dokumen, reminder interview, update lamaran, tips AI. Filter tabs + grouped by date + swipe-to-dismiss.

## Route & Entry

- URL: `/dashboard/notifications`
- Slice: `frontend/src/slices/notifications/`
- Komponen utama: `NotificationsView.tsx`

## Struktur Slice

```
notifications/
├─ index.ts
├─ components/NotificationsView.tsx  Page — header + filter tabs + date-grouped rows
├─ hooks/useNotifications.ts
└─ types/index.ts                    NotificationDoc, NotificationFilter, NotificationType, IMPORTANT_TYPES, NotificationGroup
```

## Data Flow

| Operation | Convex fn | Purpose |
|---|---|---|
| List | `api.notifications.getUserNotifications` | Last 50, desc by createdAt |
| Create | `api.notifications.createNotification` | Dipakai backend / slice lain untuk push notif |
| Mark 1 | `api.notifications.markNotificationAsRead` | Patch `read: true` |
| Mark all | `api.notifications.markAllNotificationsAsRead` | Bulk patch semua unread |
| Delete 1 | `api.notifications.deleteNotification` | Hard delete owned doc |
| Delete all | `api.notifications.deleteAllNotifications` | Bulk clear inbox |

## Schema (sudah eksisting)

Tabel `notifications`:

```ts
{
  userId, type: string, title, message, read: boolean,
  actionUrl?, scheduledFor?
}
```

Indexes: `by_user`, `by_user_read`.

Types in use: `deadline`, `interview`, `application`, `system`, `tip`. `IMPORTANT_TYPES = ["deadline", "interview"]`.

## UI

1. **ResponsivePageHeader** — title + "N belum dibaca" description + "Tandai semua dibaca" + "Bersihkan" actions (desktop icon-only, mobile hide label).
2. **Filter tabs (`variant="pills"`)** — Semua / Belum dibaca / Penting dengan count badges. Penting = items dengan type di `IMPORTANT_TYPES`.
3. **Date groups** — Hari ini / Kemarin / Minggu ini / Lebih lama. Empty groups skipped.
4. **Rows** — icon tinted per-type + title + message + relative time + unread dot. Row clickable:
   - Jika `actionUrl` → `<Link href={actionUrl}>` auto-mark-read
   - Jika tidak → `<button>` plain yang mark-read

Dismiss (✕) button hover-reveal di desktop, selalu visible di mobile (future — sekarang opacity-0 → opacity-100 on group-hover).

Bersihkan confirmation pakai **ResponsiveAlertDialog** — mobile jadi Drawer.

## Dependensi

- `@/shared/components/ui/responsive-page-header`
- `@/shared/components/ui/responsive-alert-dialog`
- `@/shared/components/ui/tabs` (pills variant)
- shadcn: `button`, `badge`
- `next/link` untuk action navigation
- `sonner` toast on action

## Catatan Desain

- Hard delete on dismiss (no archive / trash). Kalau user perlu recovery, tambah `archivedAt` field + "Recently deleted" view.
- Relative time format: `<1m = "Baru saja"`, `<60m = Xm`, `<24h = Xj`, `<7d = Xh`, sisanya format tanggal singkat.
- `actionUrl` boleh full URL atau pathname Next.js — dipakai via `<Link>` yang handle keduanya.
- Seed default notifications untuk user baru → future work (seed di `seedForCurrentUser`).

## Extending

- Push notification (PWA / Web Push API) — sudah siap via service worker
- Scheduled notifications (`scheduledFor` field exists, belum dipakai)
- Group by type instead of date (filter sub-toggle)
- Toast integration — panggil `createNotification` dari slice lain + auto pop toast di UI
- Slack/Email digest settings di user preferences
