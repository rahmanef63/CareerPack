# Calendar

> **Portability tier:** M — slice + shared agenda hook + Convex module + schema table + manifest/binder wiring

## Tujuan

Kalender agenda karir: interview, deadline aplikasi, study reminder,
dan `other`. View bulanan + list per-hari. CRUD event lewat UI atau
lewat AI agent (skill `calendar.create-event`, dll). Reminder cron
push notification N menit sebelum jadwal.

## Route & Entry

- URL: `/dashboard/calendar`
- Slice: `frontend/src/slices/calendar/`
- Komponen utama: `CalendarView.tsx`
- Lazy-loaded via `manifest.route.component` — tidak perlu manual
  register ke `dashboardRoutes.tsx` lagi.

## Struktur Slice

```
calendar/
├─ index.ts                              barrel: CalendarView, CalendarCapabilities, calendarManifest
├─ manifest.ts                           SliceManifest + skills (list/create/update/delete event)
├─ components/
│  ├─ CalendarView.tsx                   month grid + day list + create/edit dialog
│  └─ CalendarCapabilities.tsx           binder: subscribe aiActionBus → run mutations
└─ lib/
   └─ ics.ts                             .ics export serializer (iCalendar)
```

## Data Flow

Backend: tabel `calendarEvents` di `convex/calendar/`.

| Hook / call | Convex op | Purpose |
|---|---|---|
| `useAgenda().items` | `api.calendar.queries.listEvents` | List event user (sorted by date+time) |
| `useAgenda().create` | `api.calendar.mutations.createEvent` | Insert event baru |
| `useAgenda().update` | `api.calendar.mutations.updateEvent` | Patch field event |
| `useAgenda().remove` | `api.calendar.mutations.deleteEvent` | Hapus event |
| Reminder cron | `convex/calendar/reminders.ts` | Scan upcoming events → insert notification, set `reminderSentAt` |

Hook `useAgenda` live di `@/shared/hooks/useAgenda` — dashboard-home
juga subscribe; slice tidak re-export lokal.

Skill server-side `calendar.list-events` di-handle di
`convex/ai/skillHandlers.ts` (trim ke 50 event terbaru, drop noise
fields). Skill mutation/compose (`create/update/delete`) tidak punya
handler server-side — capability binder yang eksekusi setelah user
approve di ApproveActionCard.

Schema:
- `date: string` — `YYYY-MM-DD` (string, bukan epoch — query per
  hari murah, no timezone pitfall)
- `time: string` — `HH:mm` 24-jam
- `type: string` — convention: `"reminder" | "interview" | "deadline" | "other"`
- `applicationId?: Id<"jobApplications">` — link opsional ke lamaran
- `reminderMinutes?: number` — lead time, undefined = no reminder
- `reminderSentAt?: number` — idempotency key, cleared on reschedule

Indexes: `by_user`, `by_user_date`, `by_user_application`, `by_date`.

## State Lokal

- `selectedDate` — cursor bulanan
- `dialogOpen`, `formState` — dialog create/edit
- Filter type (`reminder` / `interview` / `deadline` / `other`)

## Dependensi

- `@/shared/hooks/useAgenda` — single source agenda hook (CRUD + types)
- `@/shared/components/layout/PageContainer`
- `@/shared/components/ui/responsive-page-header`
- `@/shared/lib/formatDate` — `formatMonthShort`, `formatWeekdayLong` (locale `id-ID`)
- `@/shared/lib/agendaStyles` — `getAgendaStyle`, `AGENDA_TYPE_STYLES`
- `@/shared/lib/notify` — toast wrapper
- `@/shared/lib/utils` — `cn`
- `@/shared/lib/aiActionBus` — `subscribe` (for binder)
- `@/shared/types/sliceManifest` — manifest type
- shadcn primitives: `calendar`, `date-picker`, `responsive-dialog`,
  `responsive-select`, `card`, `button`, `input`, `label`, `textarea`,
  `badge`, `skeleton`
- npm: `react-day-picker`, `date-fns` (transitively via shadcn calendar)

## Catatan Desain

- String date format sengaja dipilih (bukan epoch `Date`) — query
  by-day cheap, index `by_user_date` work langsung.
- AI agent skill `calendar.create-event` injects today's date di
  system prompt supaya model bisa resolve "besok", "lusa", "Senin
  depan" → YYYY-MM-DD.
- Capability binder dispatch via `subscribe(<skillId>, …)` —
  removing this slice means deleting the import in `Providers.tsx`
  + `sliceRegistry.ts`; tidak ada hidden cross-slice coupling.

## Extending

- Recurring events → tambah field `rrule`, expand saat render.
- iCal `.ics` import (sudah ada export di `lib/ics.ts`).
- Web Push notification (sekarang in-app notification only).

---

## Portabilitas

**Tier:** M

**Files untuk dicopy:**

```
# Slice itself
frontend/src/slices/calendar/

# Shared deps (hook + format + styles + agenda types)
frontend/src/shared/hooks/useAgenda.ts
frontend/src/shared/lib/formatDate.ts
frontend/src/shared/lib/agendaStyles.ts
frontend/src/shared/lib/notify.ts
frontend/src/shared/lib/aiActionBus.ts                 # if not yet present
frontend/src/shared/types/sliceManifest.ts             # if not yet present
frontend/src/shared/components/layout/PageContainer.tsx
frontend/src/shared/components/ui/date-picker.tsx
frontend/src/shared/components/ui/responsive-dialog.tsx
frontend/src/shared/components/ui/responsive-select.tsx
frontend/src/shared/components/ui/responsive-page-header.tsx
frontend/src/shared/components/ui/calendar.tsx          # shadcn

# Backend
convex/calendar/                                        # queries.ts, mutations.ts, reminders.ts, schema.ts
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

# Slice
mkdir -p "$DST/frontend/src/slices"
cp -r "$SRC/frontend/src/slices/calendar" "$DST/frontend/src/slices/"

# Shared helpers
mkdir -p "$DST/frontend/src/shared/hooks"
mkdir -p "$DST/frontend/src/shared/lib"
mkdir -p "$DST/frontend/src/shared/types"
mkdir -p "$DST/frontend/src/shared/components/layout"
mkdir -p "$DST/frontend/src/shared/components/ui"

cp "$SRC/frontend/src/shared/hooks/useAgenda.ts"                 "$DST/frontend/src/shared/hooks/"
cp "$SRC/frontend/src/shared/lib/formatDate.ts"                  "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/lib/agendaStyles.ts"                "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/lib/notify.ts"                      "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/lib/aiActionBus.ts"                 "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/types/sliceManifest.ts"             "$DST/frontend/src/shared/types/"
cp "$SRC/frontend/src/shared/components/layout/PageContainer.tsx" "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/components/ui/date-picker.tsx"      "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-dialog.tsx" "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-select.tsx" "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-page-header.tsx" "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/calendar.tsx"         "$DST/frontend/src/shared/components/ui/"

# Backend
cp -r "$SRC/convex/calendar" "$DST/convex/"
```

**Schema additions** (append to target's `convex/schema.ts`, then
spread `calendarTables` into `defineSchema`):

```ts
calendarEvents: defineTable({
  userId: v.id("users"),
  title: v.string(),
  date: v.string(),                     // YYYY-MM-DD
  time: v.string(),                     // HH:mm
  location: v.string(),
  type: v.string(),                     // reminder|interview|deadline|other
  notes: v.optional(v.string()),
  applicationId: v.optional(v.id("jobApplications")),
  reminderMinutes: v.optional(v.number()),
  reminderSentAt: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_user_date", ["userId", "date"])
  .index("by_user_application", ["userId", "applicationId"])
  .index("by_date", ["date"]),
```

**Convex `api.d.ts`** — add `calendar: typeof calendar` (see
`_porting-guide.md` §2). If running `pnpm backend:dev`, regenerated
automatically.

**npm deps:**

```bash
pnpm -F frontend add react-day-picker date-fns
```

**Manifest + binder wiring** (manifest-driven slice):

1. Add to `frontend/src/shared/lib/sliceRegistry.ts`:
   ```ts
   import { calendarManifest } from "@/slices/calendar";
   // …
   export const SLICE_REGISTRY = [/* …, */ calendarManifest];
   ```
2. Mount binder in `frontend/src/shared/providers/Providers.tsx`:
   ```ts
   import { CalendarCapabilities } from "@/slices/calendar";
   // … inside the providers tree:
   <CalendarCapabilities />
   ```
3. Append entries to `convex/_seeds/aiDefaults.ts` `DEFAULT_AI_TOOLS`
   (mirror the calendar block: `calendar.list-events`,
   `calendar.create-event`, `calendar.update-event`,
   `calendar.delete-event`).
4. Register the query handler in `convex/ai/skillHandlers.ts`:
   ```ts
   "calendar.list-events": async (ctx) => {
     const events = await ctx.runQuery(api.calendar.queries.listEvents, {});
     return events.slice(0, 50).map((e) => ({ /* trim noise */ }));
   },
   ```

**Nav registration:** if the target has not adopted the manifest
registry yet, fall back to legacy nav: add a `MORE_APPS`/`PRIMARY_NAV`
entry in `frontend/src/shared/components/layout/navConfig.ts` with
`href: "/dashboard/calendar"`, AND a lazy entry in
`frontend/src/shared/lib/dashboardRoutes.tsx`. With manifest registry
in place — no nav edits needed (derived from `manifest.nav`).

**Env vars** — none beyond Convex baseline. Reminder cron uses the
cron config in `convex/crons.ts` (port if not present).

**i18n** — Indonesian copy in `CalendarView.tsx`: "Tambah Agenda",
"Wawancara", "Tenggat", "Pengingat", "Lainnya", weekday labels via
`formatWeekdayLong` (locale `id-ID`).

**Common breakage after port:**

- **`useAgenda` not found** — hook moved to shared; ensure
  `useAgenda.ts` ported and imports `api.calendar.*`.
- **Reminder cron silent** — `convex/crons.ts` must list the
  `calendar/reminders.ts` job; otherwise no notifications fire.
- **AI skill not invokable** — verify (a) manifest entry in
  `sliceRegistry.ts`, (b) `CalendarCapabilities` mounted in
  `Providers.tsx`, (c) `DEFAULT_AI_TOOLS` updated, (d) re-seed via
  admin "Seed default" button.
- **Day cells off-by-one** — caused by mixing `Date` and string
  `YYYY-MM-DD`. Always normalize via `formatDate` helpers; never
  `new Date(dateStr)` without a TZ-stable parser.

**Testing the port:**

1. Navigate `/dashboard/calendar` → grid renders current month
2. Click a date → "Tambah Agenda" dialog opens
3. Save event → appears immediately (reactive query)
4. Open AI agent, type "ingatkan saya belajar besok jam 9" →
   ApproveActionCard for `calendar.create-event` appears
5. Approve → event created, toast fires
6. Type "agenda saya hari ini" → AI calls
   `calendar.list-events` (server handler) and returns the day's items

Run `_porting-guide.md` §9 checklist.
