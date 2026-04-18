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

Convex: tabel `calendarEvents` via `convex/calendar.ts`.

| Hook | Convex op |
|---|---|
| `useAgenda().items` | `api.calendar.listEvents` |
| `useAgenda().create` | `api.calendar.createEvent` |
| `useAgenda().update` | `api.calendar.updateEvent` |
| `useAgenda().remove` | `api.calendar.deleteEvent` |

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
