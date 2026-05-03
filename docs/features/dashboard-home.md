# Dashboard Home

> **Portability tier:** M — slice + multiple shared hooks; reads from 4+ Convex domains.

## Tujuan

Landing setelah login. Rangkum metrics utama (lamaran aktif, profile
completeness, tren mingguan), upcoming agenda, onboarding wizard
untuk profil baru, dan quick-action ke fitur lain.

## Route & Entry

- URL: `/dashboard`
- Resolved via catch-all (slug `""` di `dashboardRoutes.tsx`)
- Slice: `frontend/src/slices/dashboard-home/`
- Komponen utama: `DashboardHome.tsx`

## Struktur Slice

```
dashboard-home/
├─ index.ts                         export { DashboardHome }
└─ components/
   ├─ DashboardHome.tsx             Aggregator + layout
   ├─ DashboardTrendChart.tsx       Recharts AreaChart (lamaran/minggu)
   ├─ OnboardingWizard.tsx          First-run profil wizard (gated by hasProfile)
   └─ ProfileCompletenessCard.tsx   Progress + jump-links to settings
```

## Data Flow

Read-only aggregator. Subscribes via shared hooks:

| Hook | Convex |
|---|---|
| `useApplications()` | `api.applications.queries.getUserApplications` |
| `useAgenda()` | `api.calendar.queries.listEvents` |
| `useAuth()` | session + `api.profile.queries.getCurrentUser` |
| `useQuery(api.profile.queries.getProfileCompleteness)` | Per-section completion percent |

Client-side derivations (memoized):
- Distribusi status lamaran (applied / screening / interview / offer / rejected).
- Area chart per minggu via `DashboardTrendChart` (lazy-imported).
- 3 agenda terdekat (sort `date`, slice 3).
- Profile completeness rings + jump CTA.

Onboarding wizard mounts when `getCurrentUser()` returns no `userProfile` — collects fullName, location, targetRole, experienceLevel, then calls `api.profile.mutations.createOrUpdateProfile`. Bypassable via "skip" → resumable from settings later.

## State Lokal

- `wizardOpen` — onboarding modal control.
- `chartRangeDays` (default 56) — for trend chart.
- Memoized derivations only; no form state outside wizard.

## Dependensi

- `@/shared/hooks/useApplications`, `useAgenda`, `useAuth`.
- `@/shared/components/error/ErrorBoundary` per-section.
- `@/shared/components/ui/responsive-tooltip`, `responsive-page-header`, `card`, `button`, `badge`, `separator`.
- `@/shared/components/onboarding/QuickFillButton`.
- `recharts` — `AreaChart`, `CartesianGrid`, `XAxis`.
- `lucide-react`.

## Catatan Desain

- **Recharts CSS tokens.** Chart colors come from `var(--chart-sky)` etc., declared in `shared/styles/index.css`, so dark/light theme switch is automatic.
- **Quick-action prefix.** All `<Link>` use full `/dashboard/<slug>` — historic regression lost the prefix and fell back to marketing route.
- **Wizard idempotent.** Re-opening the wizard from settings overwrites; no duplicate `userProfiles` rows possible (single-row constraint by `userId` index).
- **Lazy chart.** `DashboardTrendChart` imported via `next/dynamic` — keeps recharts out of the initial bundle for users who never scroll.

## Extending

- "Skill progress" widget — subscribe to `api.roadmap.queries.getUserRoadmap`, compute %.
- Drag-and-drop layout customization — persist order on `userProfiles` (schema migration).
- Stacked status histogram in trend chart.

---

## Portabilitas

**Tier:** M

**Files untuk dicopy:**

```
# Slice
frontend/src/slices/dashboard-home/

# Shared hooks (likely already present if those slices ported)
frontend/src/shared/hooks/useApplications.ts
frontend/src/shared/hooks/useAgenda.ts
frontend/src/shared/hooks/useAuth.tsx
frontend/src/shared/components/onboarding/                # QuickFillButton
```

**cp:**

```bash
SRC=~/projects/CareerPack DST=~/projects/<target>
cp -r "$SRC/frontend/src/slices/dashboard-home" "$DST/frontend/src/slices/"
cp "$SRC/frontend/src/shared/hooks/useApplications.ts" "$DST/frontend/src/shared/hooks/"
cp "$SRC/frontend/src/shared/hooks/useAgenda.ts"       "$DST/frontend/src/shared/hooks/"
cp -r "$SRC/frontend/src/shared/components/onboarding/." "$DST/frontend/src/shared/components/onboarding/"
```

**Backend deps:** `api.profile.queries.{getCurrentUser, getProfileCompleteness}`, `api.applications.queries.getUserApplications`, `api.calendar.queries.listEvents`. Stub these to empty arrays for greenfield targets without those slices yet.

**Schema additions:** none. Reads existing tables.

**Convex api.d.ts:** depends on `profile`, `applications`, `calendar` modules.

**npm deps:**

```bash
pnpm -F frontend add recharts
```

**Integration:** register as `""` (root) key in `dashboardRoutes.tsx`. Catch-all picks empty segment → DashboardHome.

**i18n:** Heavy Indonesian copy — greeting "Halo, {firstName}", KPI labels, "Langkah Selanjutnya". Bulk edit when transplanting.

**Common breakage:**

- Onboarding wizard fires on every reload → `getCurrentUser` is throwing instead of returning `null` — check `optionalUser` is used, not `requireUser`.
- Trend chart blank on first day → empty bucket array; verify `useApplications` returns empty array (not `undefined`) for empty state.

**Testing:** sign in fresh → wizard appears → skip → completeness card shows < 100% → fill missing fields from settings → percent updates live (Convex reactivity).

Run `_porting-guide.md` §9 checklist.
