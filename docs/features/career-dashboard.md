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

Convex: tabel `jobApplications` via `convex/applications/`.

| Hook | Convex op |
|---|---|
| `applications` | `api.applications.queries.getUserApplications` |
| `create` | `api.applications.mutations.createApplication` |
| `updateStatus` | `api.applications.mutations.updateApplicationStatus` |
| `remove` | `api.applications.mutations.deleteApplication` |
| (belum di-hook) | `api.applications.mutations.addInterviewDate` |

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

---

## Portabilitas

**Tier:** M — slice + `useApplications` hook + Convex module + schema table.

**Files:**

```
frontend/src/slices/career-dashboard/
frontend/src/shared/hooks/useApplications.ts
convex/applications/
```

**cp:**

```bash
SRC=~/projects/CareerPack DST=~/projects/<target>
cp -r "$SRC/frontend/src/slices/career-dashboard"          "$DST/frontend/src/slices/"
cp "$SRC/frontend/src/shared/hooks/useApplications.ts"     "$DST/frontend/src/shared/hooks/"
cp "$SRC/convex/applications/"                           "$DST/convex/"
```

**Schema:** add `jobApplications` table with `by_user`, `by_user_status`, `by_user_applied` indexes.

**Convex api.d.ts:** add `applications: typeof applications`.

**npm deps:** `recharts` (if charts used — check slice).

**Nav:** `applications` slug in MORE_APPS.

**i18n:** status labels ("Dilamar", "Screening", "Wawancara", "Tawaran", "Ditolak") + all UI copy in Indonesian.

See `_porting-guide.md`.
