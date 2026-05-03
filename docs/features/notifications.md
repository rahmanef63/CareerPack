# Notifikasi

> **Portability tier:** M — slice + 1 Convex domain + cron digest action

## Tujuan

Inbox notifikasi in-app — deadline dokumen, reminder interview, update lamaran, tips AI, weekly job digest. Filter tabs + grouped by date + dismiss.

## Route & Entry

- URL: `/dashboard/notifications`
- Slice: `frontend/src/slices/notifications/`
- Komponen utama: `NotificationsView.tsx`

## Struktur Slice

```
notifications/
├─ index.ts
├─ components/NotificationsView.tsx  Page — header + filter tabs + date-grouped rows + clear-all alert
├─ hooks/useNotifications.ts         Convex CRUD wrappers + unread count helper
└─ types/index.ts                    NotificationDoc, NotificationFilter, NotificationType, NotificationGroup, IMPORTANT_TYPES
```

## Data Flow

Backend domain: `convex/notifications/`. Tabel: `notifications`. Cron: `convex/notifications/digest.ts` (mingguan, opt-in).

| Hook / method | Convex op | Purpose |
|---|---|---|
| `useNotifications.list` | `api.notifications.queries.getUserNotifications` | Last 50, desc by createdAt |
| `useNotifications.markRead` | `api.notifications.mutations.markNotificationAsRead` | Patch single `read: true` |
| `useNotifications.markAllRead` | `api.notifications.mutations.markAllNotificationsAsRead` | Bulk patch |
| `useNotifications.remove` | `api.notifications.mutations.deleteNotification` | Hard delete owned doc |
| `useNotifications.clearAll` | `api.notifications.mutations.deleteAllNotifications` | Bulk wipe inbox |
| (slice lain) | `api.notifications.mutations.createNotification` | Push notif (deadline / interview / system / tip) |
| (cron) | `api.notifications.digest.runWeeklyDigest` | Weekly job-match digest (opt-in via `userProfiles.digestEnabled`) |

Schema (`convex/notifications/schema.ts`):

```ts
notifications: defineTable({
  userId: v.id("users"),
  type: v.string(),                // "deadline" | "interview" | "application" | "system" | "tip"
  title: v.string(),
  message: v.string(),
  read: v.boolean(),
  actionUrl: v.optional(v.string()),
  scheduledFor: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_user_read", ["userId", "read"]),
```

`IMPORTANT_TYPES = ["deadline", "interview"]` (in slice `types/index.ts`) drives the "Penting" filter tab.

## State Lokal

- Filter tab (`NotificationFilter`: all / unread / important)
- Date grouping memo: Hari ini / Kemarin / Minggu ini / Lebih lama (skip empty groups)
- AlertDialog state untuk konfirmasi "Bersihkan"

## Dependensi

- `@/shared/components/ui/responsive-page-header`
- `@/shared/components/ui/responsive-alert-dialog`
- `@/shared/components/ui/tabs` (pills variant)
- `@/shared/hooks/useAuth`
- `@/shared/hooks/useDemoOverlay` — `useDemoNotificationsOverlay`
- `@/shared/lib/formatDate` — `formatDateShort`
- `@/shared/lib/notify`, `@/shared/lib/utils` (`cn`)
- shadcn: `badge`, `button`
- `next/link` — action navigation
- `sonner` — toast on action

## Catatan Desain

- **Hard delete on dismiss** — no archive / trash. User butuh recovery → tambah `archivedAt` field + "Recently deleted" view.
- **Relative time format**: `<1m = "Baru saja"`, `<60m = Xm`, `<24h = Xj`, `<7d = Xh`, sisanya format tanggal singkat (`formatDateShort`).
- **`actionUrl`** boleh full URL atau pathname Next.js — dipakai via `<Link>` yang handle keduanya. Klik row dengan `actionUrl` auto-mark-read sebelum navigate.
- **Weekly digest cron** — `digest.ts` jalan tiap Senin (registered di `convex/crons.ts`). Read user CV + matcher result → kirim email + insert notification. Opt-in via `userProfiles.digestEnabled`. `lastDigestSentAt` cegah double-send saat retry.
- **Scheduled notifications** — `scheduledFor` field ada di schema, belum dipakai (siap untuk reminder pre-deadline).
- Manifest belum ada — slice bukan AI bus subscriber.

## Extending

- Push notification (PWA / Web Push API) — service worker sudah siap.
- Group by type instead of date (filter sub-toggle).
- Toast integration — panggil `createNotification` dari slice lain + auto pop toast realtime.
- Slack / email digest preferences di Settings.
- Slice manifest: `notifications.list`, `notifications.markRead` skills.

---

## Portabilitas

**Tier:** M

**Files untuk dicopy:**

```
# Slice
frontend/src/slices/notifications/

# Shared deps
frontend/src/shared/components/ui/responsive-page-header.tsx
frontend/src/shared/components/ui/responsive-alert-dialog.tsx
frontend/src/shared/hooks/useAuth.tsx
frontend/src/shared/hooks/useDemoOverlay.ts
frontend/src/shared/lib/formatDate.ts
frontend/src/shared/lib/notify.ts
frontend/src/shared/lib/utils.ts

# Backend
convex/notifications/                                                   # schema + queries + mutations + digest
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

# Slice
mkdir -p "$DST/frontend/src/slices"
cp -r "$SRC/frontend/src/slices/notifications" "$DST/frontend/src/slices/"

# Shared deps
mkdir -p "$DST/frontend/src/shared/components/ui"
mkdir -p "$DST/frontend/src/shared/hooks"
mkdir -p "$DST/frontend/src/shared/lib"

cp "$SRC/frontend/src/shared/components/ui/responsive-page-header.tsx"     "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-alert-dialog.tsx"    "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/hooks/useAuth.tsx"                            "$DST/frontend/src/shared/hooks/"
cp "$SRC/frontend/src/shared/hooks/useDemoOverlay.ts"                      "$DST/frontend/src/shared/hooks/"
cp "$SRC/frontend/src/shared/lib/formatDate.ts"                            "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/lib/notify.ts"                                "$DST/frontend/src/shared/lib/"

# Backend
cp -r "$SRC/convex/notifications" "$DST/convex/"
```

**Schema additions** — copy `notifications` table from `convex/notifications/schema.ts`. Indexes: `by_user`, `by_user_read`.

If digest enabled: target `userProfiles` schema must have `digestEnabled?: v.boolean()` + `lastDigestSentAt?: v.number()` (lihat `settings.md` untuk full profile schema).

**Convex api.d.ts**:

```ts
import type * as notifications_digest    from "../notifications/digest.js";
import type * as notifications_mutations from "../notifications/mutations.js";
import type * as notifications_queries   from "../notifications/queries.js";

declare const fullApi: ApiFromModules<{
  // ...
  "notifications/digest":    typeof notifications_digest;
  "notifications/mutations": typeof notifications_mutations;
  "notifications/queries":   typeof notifications_queries;
}>;
```

**npm deps** — none specific.

**Env vars** — none specific. Digest action mungkin pakai email transport (SMTP / Resend) — config hidup di `_shared/email.ts` kalau slice email ported (di luar scope ini).

**Manifest + binder wiring** — N/A (slice tidak punya manifest).

**Nav registration** — `dashboardRoutes.tsx` + `navConfig.ts` (see `_porting-guide.md` §4). Slug `notifications` (label "Notifikasi", icon `Bell`, hue `from-yellow-400 to-yellow-600`, placement `MORE_APPS`).

**Cron registration** — kalau target pakai weekly digest, append entry di `convex/crons.ts`:

```ts
import { internal } from "./_generated/api";
crons.weekly("weekly-digest", { dayOfWeek: "monday", hourUTC: 1, minuteUTC: 0 },
  internal.notifications.digest.runWeeklyDigest);
```

**i18n** — Indonesian:
- Tab labels: "Semua" / "Belum dibaca" / "Penting"
- Date groups: "Hari ini" / "Kemarin" / "Minggu ini" / "Lebih lama"
- Relative time tokens: "Baru saja", "Xm", "Xj", "Xh"
- Actions: "Tandai semua dibaca", "Bersihkan"

**Integration points** — slice lain push notif via `createNotification`. Examples:
- Job application status change (`career-dashboard`)
- Interview reminder pre-deadline (`calendar` cron)
- Roadmap milestone unlocked (`skill-roadmap`)
- AI tip after CV scan (`matcher`)

**Common breakage after port:**

- **`actionUrl` external URL crash** — `<Link>` Next.js handle full URL OK tapi prefetch fail di server log. Kalau noisy, swap ke `<a href>` untuk URL absolut.
- **Date groups kosong padahal ada data** — `formatDateShort` butuh `id-ID` locale. Pastikan target Node ≥ 16 dengan ICU full.
- **Digest cron tidak jalan** — entry di `convex/crons.ts` lupa diappend.
- **Demo overlay konflik** — `useDemoNotificationsOverlay` injection palsu di state. Kalau target tidak pakai demo system, stub hook return `null`.
- **`IMPORTANT_TYPES` filter empty** — slice lain insert dengan `type` strings yang tidak match (`"important"` ≠ `"deadline"`). Konsisten pakai enum.

**Testing the port:**

1. Navigate `/dashboard/notifications` → empty state atau row list
2. Insert test notif via Convex dashboard → realtime muncul di UI
3. Klik row dengan `actionUrl` → navigate + auto-mark-read
4. Klik "Tandai semua dibaca" → unread count → 0
5. Klik "Bersihkan" → ResponsiveAlertDialog confirm → semua row gone
6. Reload → state persist

Run `_porting-guide.md` §9 checklist.
