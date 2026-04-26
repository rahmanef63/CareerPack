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
| `useApplications()` | `@/shared/hooks` → `api.applications.queries.getUserApplications` |
| `useAgenda()` | `@/shared/hooks` → `api.calendar.queries.listEvents` |
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

- Tambah widget "skill progress" → subscribe ke `api.roadmap.queries.getUserRoadmap`, hitung persentase.
- Personalisasi layout drag-and-drop → simpan order di `userProfiles` (butuh schema migration).

---

## Portabilitas

**Tier:** M — slice + reads multiple Convex tables for stats.

**Files (1):**

```
frontend/src/slices/dashboard-home/
```

**cp:**

```bash
cp -r ~/projects/CareerPack/frontend/src/slices/dashboard-home ~/projects/<target>/frontend/src/slices/
```

**Shared deps:** `useAuth`, shadcn Card/Badge/Progress, lucide-react icons.

**Backend deps:** `api.profile.queries.getUserStats`, `api.applications.queries.getUserApplications`, etc. — requires `users.ts`, `applications.ts` modules ported. For a clean-slate target with no data yet, stub these queries to return empty arrays.

**Schema / npm / env:** none specific.

**Integration:** register as `""` (root) key in `dashboardRoutes.tsx`.

**i18n:** heavy Indonesian copy — greeting "Halo, {firstName}", KPI labels, "Langkah Selanjutnya". Bulk edit.

See `_porting-guide.md`.
