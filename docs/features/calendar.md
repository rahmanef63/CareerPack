# Calendar

## Tujuan

Kalender agenda karir: interview, deadline aplikasi, followup. View bulanan + list per-hari. CRUD event.

## Route & Entry

- URL: `/dashboard/calendar`
- Slice: `frontend/src/slices/calendar/`
- Komponen utama: `CalendarView.tsx`

## Struktur Slice

```
calendar/
├─ index.ts
├─ components/CalendarView.tsx
└─ hooks/useAgenda.ts          Re-export @/shared/hooks/useAgenda (kompat lokal)
```

## Data Flow

Convex: tabel `calendarEvents` via `convex/calendar/`.

| Hook | Convex op |
|---|---|
| `useAgenda().items` | `api.calendar.queries.listEvents` |
| `useAgenda().create` | `api.calendar.mutations.createEvent` |
| `useAgenda().update` | `api.calendar.mutations.updateEvent` |
| `useAgenda().remove` | `api.calendar.mutations.deleteEvent` |

Schema:
- `date: string` — `YYYY-MM-DD` (bukan timestamp — query per hari lebih gampang)
- `time: string` — `HH:mm`
- `type: "interview" | "deadline" | "followup"`
- `applicationId?: Id<"jobApplications">` — link opsional

Hook sebenarnya live di `@/shared/hooks/useAgenda` karena dashboard-home juga subscribe. Slice `calendar` re-export untuk kompat import path `../hooks/useAgenda`.

## State Lokal

- `selectedDate` — cursor bulanan
- `dialogOpen`, `formState` — edit/create dialog
- Filter type (interview / deadline / followup)

## Dependensi

- shadcn: `calendar` (pakai), `date-picker`, `dialog`, `button`, `select`, `card`
- `date-fns` untuk format lokalisasi (`id` locale)
- `react-day-picker` (via shadcn `calendar`)

## Catatan Desain

- String date format sengaja dipilih (bukan `Date`) supaya query by day tetap cheap tanpa timezone pitfall — Convex index `by_user_date` work langsung.
- Event cross-link ke application via `applicationId` (optional) — future UI bisa show "upcoming interview for Acme Corp".

## Extending

- iCal export — serialize `items` ke `.ics` (library `ics` di npm).
- Recurring events → tambah `rrule` field, expand saat render.
- Reminder notification → schedule `notifications` dengan `scheduledFor = date+time - leadTime`, poll via cron (butuh Convex scheduled function).

---

## Portabilitas

**Tier:** M — slice + shared hook + Convex module + schema table.

**Files:**

```
frontend/src/slices/calendar/
frontend/src/shared/hooks/useAgenda.ts                    # shared (multiple slices can consume)
frontend/src/shared/components/ui/date-picker.tsx         # shadcn
convex/calendar/
```

**cp:**

```bash
SRC=~/projects/CareerPack DST=~/projects/<target>
cp -r "$SRC/frontend/src/slices/calendar"             "$DST/frontend/src/slices/"
cp "$SRC/frontend/src/shared/hooks/useAgenda.ts"      "$DST/frontend/src/shared/hooks/"
cp "$SRC/convex/calendar/"                          "$DST/convex/"
```

**Schema:** add `calendarEvents` table (`userId`, `title`, `date` YYYY-MM-DD, `time` HH:mm, `location`, `type`, `notes?`, `applicationId?`) with `by_user` + `by_user_date` indexes.

**Convex api.d.ts:** add `calendar: typeof calendar`.

**npm deps:** `react-day-picker`, `date-fns`.

**Nav:** `calendar` slug. PRIMARY_NAV entry.

**i18n:** event types ("Wawancara", "Tenggat", "Follow-up"), date locale `id-ID`, `react-day-picker/locale` = `id`.

See `_porting-guide.md`.
