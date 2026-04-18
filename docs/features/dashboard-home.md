# Dashboard Home

## Tujuan

Landing setelah login. Rangkum metrics utama (lamaran aktif, CV terbaru, interview stats) + agenda mendatang + quick action ke feature lain.

## Route & Entry

- URL: `/dashboard`
- Resolved dari catch-all (slug `""` di `dashboardRoutes.tsx`)
- Slice: `frontend/src/slices/dashboard-home/`
- Komponen utama: `DashboardHome.tsx`

## Struktur Slice

```
dashboard-home/
├─ index.ts
└─ components/DashboardHome.tsx
```

## Data Flow

Read-only aggregator — tidak punya mutation sendiri. Subscribes ke:

| Hook | Sumber |
|---|---|
| `useApplications()` | `@/shared/hooks` → `api.applications.getUserApplications` |
| `useAgenda()` | `@/shared/hooks` → `api.calendar.listEvents` |
| `useAuth()` | user profile + session |

Data yang di-compute client-side (via `useMemo`):
- Distribusi status lamaran (applied / screening / interview / offer / rejected)
- Area chart lamaran per minggu (pakai Recharts)
- 3 agenda terdekat (sort `date`, slice 3)

## State Lokal

Minim — hanya memo derivation. Tidak ada form input.

## Dependensi

- Cross-slice hooks: `useApplications`, `useAgenda`, `useAuth`
- UI: shadcn `card`, `button`, `badge`, `separator`, `chart`
- Recharts: `Area`, `AreaChart`, `CartesianGrid`, `XAxis`
- `@/shared/components/ErrorBoundary` per-section

## Catatan Desain

- Chart config pakai CSS custom property `var(--chart-sky)` dari `shared/styles/index.css` supaya ikut tema dark/light.
- Quick action card pakai `Link` ke `/dashboard/<slug>` — jangan hardcode fallback tanpa prefix `/dashboard` (regresi yang sudah di-fix sebelumnya).

## Extending

- Tambah widget "skill progress" → subscribe ke `api.roadmaps.getUserRoadmap`, hitung persentase.
- Personalisasi layout drag-and-drop → simpan order di `userProfiles` (butuh schema migration).
