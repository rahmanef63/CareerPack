# Career Dashboard (Applications)

## Tujuan

Tracker lamaran kerja ala Kanban — kartu per aplikasi dengan status pipeline (Applied → Screening → Interview → Offer/Rejected/Withdrawn). Filter, stats, notes, interview dates.

## Route & Entry

- URL: `/dashboard/applications`
- Slice: `frontend/src/slices/career-dashboard/`
- Komponen utama: `CareerDashboard.tsx`

## Struktur Slice

```
career-dashboard/
├─ index.ts
├─ components/CareerDashboard.tsx
├─ hooks/useApplications.ts       Re-export @/shared/hooks/useApplications
└─ types/index.ts                 Application, ApplicationStatus, DashboardStats
```

## Data Flow

Convex: tabel `jobApplications` via `convex/applications.ts`.

| Hook | Convex op |
|---|---|
| `applications` | `api.applications.getUserApplications` |
| `create` | `api.applications.createApplication` |
| `updateStatus` | `api.applications.updateApplicationStatus` |
| `remove` | `api.applications.deleteApplication` |
| (belum di-hook) | `api.applications.addInterviewDate` |

Schema highlight:
- `status: string` — validated frontend-side ke `ApplicationStatus` enum
- `appliedDate: number` (epoch ms)
- `interviewDates: Array<{ type, date, notes? }>`
- `documents: string[]` — tag mana doc checklist yang ready

Index `by_user_status` + `by_user_applied` → filter cepat.

## State Lokal

- Filter: status, source, date range
- Modal state: create/edit application
- Sort mode (date asc/desc, company alpha)

## Dependensi

- `@dnd-kit/*` — Kanban drag-drop antar status column
- shadcn: `card`, `badge`, `dialog`, `select`, `input`, `textarea`, `button`, `table`
- `@/shared/types` — `ApplicationStatus` cross-cutting

## Catatan Desain

- Status token CSS: `--status-<status>-bg` + `--status-<status>-fg` di `shared/styles/index.css` — konsisten antar feature (dashboard-home juga pakai).
- Hook di `@/shared/hooks` supaya dashboard-home bisa pakai tanpa cross-slice import.

## Extending

- Board view vs table view toggle.
- Bulk status update (multi-select).
- Import CSV lamaran lama.
- Analitik funnel per sumber (LinkedIn, JobStreet, referral) — schema sudah simpan `source`.
