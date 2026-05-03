# Career Dashboard (Applications)

> **Portability tier:** L — slice + shared `useApplications` hook +
> shared DataTable + Convex module + schema table + manifest/binder
> wiring

## Tujuan

Tracker lamaran kerja (table + Kanban + stats). Status pipeline
`applied → screening → interview → offer/rejected/accepted`. Filter
per status, search, notes, interview dates. CRUD lewat UI atau via
AI agent (skill `applications.create`, `applications.update-status`,
dll).

## Route & Entry

- URL: `/dashboard/applications`
- Slice: `frontend/src/slices/career-dashboard/`
- Komponen utama: `CareerDashboard.tsx`
- Lazy-loaded via `manifest.route.component`.

## Struktur Slice

```
career-dashboard/
├─ index.ts                                    barrel: CareerDashboard, CareerDashboardCapabilities, manifest, types
├─ manifest.ts                                 SliceManifest + skills (list/create/update-status/delete)
├─ components/
│  ├─ CareerDashboard.tsx                      page shell — tabs (Tabel/Kanban/Stats), filters, modals
│  ├─ ApplicationKanban.tsx                    Kanban board view per status column
│  ├─ CareerDashboardCapabilities.tsx          binder: subscribe aiActionBus → run mutations
│  └─ career-dashboard/
│     ├─ AddApplicationDialog.tsx              create/edit form
│     ├─ StatCard.tsx                          stats tile
│     └─ columns.tsx                           DataTable column defs
├─ constants/
│  └─ status.ts                                APPLICATION_STATUSES + label/color mapping
├─ hooks/
│  └─ useApplications.ts                       re-export shared hook (kompat impor lokal)
└─ types/
   └─ index.ts                                 Application, ApplicationStatus, DashboardStats
```

## Data Flow

Backend: tabel `jobApplications` di `convex/applications/`.

| Hook / call | Convex op | Purpose |
|---|---|---|
| `useApplications().applications` | `api.applications.queries.getUserApplications` | List user's applications |
| `useApplications().create` | `api.applications.mutations.createApplication` | Insert lamaran baru |
| `useApplications().updateStatus` | `api.applications.mutations.updateApplicationStatus` | Patch status |
| `useApplications().update` | `api.applications.mutations.updateApplication` | Patch any field |
| `useApplications().remove` | `api.applications.mutations.deleteApplication` | Hapus lamaran |
| (belum di-hook) | `api.applications.mutations.addInterviewDate` | Append interview slot |

Skill server-side `applications.list` di
`convex/ai/skillHandlers.ts` (top 50, trim noise). Skill mutation/
compose dieksekusi oleh `CareerDashboardCapabilities` setelah user
approve.

Schema highlights:
- `cvId?: Id<"cvs">` — optional FK; index `by_user_cv` untuk "lamaran
  yang pakai CV X"
- `status: string` — frontend validate ke union `ApplicationStatus`
- `appliedDate: number` (epoch ms)
- `interviewDates: Array<{ type, date, notes? }>`
- `documents: string[]` — tag mana checklist item ready
- Indexes: `by_user`, `by_user_status`, `by_user_applied`, `by_user_cv`

## State Lokal

- Filter: status, source, search, date range
- Modal state: create/edit application
- View mode: table vs Kanban
- Sort mode (date asc/desc, company alpha)

## Dependensi

- `@/shared/hooks/useApplications` — single source CRUD hook
- `@/shared/components/data-table` — generic `DataTable` + `ColumnDef` + `FilterDef`
- `@/shared/components/layout/PageContainer`
- `@/shared/components/onboarding` — `QuickFillButton`
- `@/shared/components/ui/responsive-page-header`
- `@/shared/components/ui/responsive-dialog`
- `@/shared/components/ui/responsive-alert-dialog`
- `@/shared/components/ui/responsive-dropdown-menu`
- `@/shared/components/ui/responsive-select`
- `@/shared/lib/formatDate` — date formatting (locale `id-ID`)
- `@/shared/lib/notify` — toast wrapper
- `@/shared/lib/utils` — `cn`
- `@/shared/lib/aiActionBus` — `subscribe` (binder)
- `@/shared/types/sliceManifest`
- shadcn primitives: `card`, `tabs`, `badge`, `button`, `input`,
  `label`, `textarea`, `skeleton`
- npm: none (Kanban uses native HTML5 DnD, no `@dnd-kit`)

## Catatan Desain

- Status token CSS (`--status-<status>-bg/-fg`) di
  `shared/styles/index.css` — konsisten antar feature (dashboard-home
  juga pakai).
- `useApplications` di `@/shared/hooks` supaya dashboard-home bisa
  pakai tanpa cross-slice import.
- AI skill `applications.update-status` selalu butuh `applicationId`;
  agent diarahkan panggil `applications.list` dulu — pattern "list →
  pick id → mutate".

## Extending

- Bulk status update (multi-select).
- Import CSV lamaran lama.
- Funnel analitik per `source` (LinkedIn/JobStreet/referral).
- Linkage view: drill dari CV ke semua lamaran yang pakai `cvId` itu.

---

## Portabilitas

**Tier:** L

**Files untuk dicopy:**

```
# Slice itself
frontend/src/slices/career-dashboard/

# Shared deps
frontend/src/shared/hooks/useApplications.ts
frontend/src/shared/components/data-table/             # generic DataTable
frontend/src/shared/components/layout/PageContainer.tsx
frontend/src/shared/components/onboarding/             # QuickFillButton (if used)
frontend/src/shared/components/ui/responsive-page-header.tsx
frontend/src/shared/components/ui/responsive-dialog.tsx
frontend/src/shared/components/ui/responsive-alert-dialog.tsx
frontend/src/shared/components/ui/responsive-dropdown-menu.tsx
frontend/src/shared/components/ui/responsive-select.tsx
frontend/src/shared/lib/formatDate.ts
frontend/src/shared/lib/notify.ts
frontend/src/shared/lib/aiActionBus.ts                 # if not yet present
frontend/src/shared/types/sliceManifest.ts             # if not yet present

# Backend
convex/applications/                                   # queries.ts, mutations.ts, schema.ts
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

# Slice
mkdir -p "$DST/frontend/src/slices"
cp -r "$SRC/frontend/src/slices/career-dashboard" "$DST/frontend/src/slices/"

# Shared helpers
mkdir -p "$DST/frontend/src/shared/hooks"
mkdir -p "$DST/frontend/src/shared/lib"
mkdir -p "$DST/frontend/src/shared/types"
mkdir -p "$DST/frontend/src/shared/components/data-table"
mkdir -p "$DST/frontend/src/shared/components/layout"
mkdir -p "$DST/frontend/src/shared/components/onboarding"
mkdir -p "$DST/frontend/src/shared/components/ui"

cp "$SRC/frontend/src/shared/hooks/useApplications.ts"        "$DST/frontend/src/shared/hooks/"
cp -r "$SRC/frontend/src/shared/components/data-table/"       "$DST/frontend/src/shared/components/"
cp "$SRC/frontend/src/shared/components/layout/PageContainer.tsx" "$DST/frontend/src/shared/components/layout/"
cp -r "$SRC/frontend/src/shared/components/onboarding/"       "$DST/frontend/src/shared/components/"
cp "$SRC/frontend/src/shared/components/ui/responsive-page-header.tsx"     "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-dialog.tsx"          "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-alert-dialog.tsx"    "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-dropdown-menu.tsx"   "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-select.tsx"          "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/lib/formatDate.ts"               "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/lib/notify.ts"                   "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/lib/aiActionBus.ts"              "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/types/sliceManifest.ts"          "$DST/frontend/src/shared/types/"

# Backend
cp -r "$SRC/convex/applications" "$DST/convex/"
```

**Schema additions** — append to target's `convex/schema.ts`:

```ts
jobApplications: defineTable({
  userId: v.id("users"),
  cvId: v.optional(v.id("cvs")),         // FK; omit if cv-generator not ported
  company: v.string(),
  position: v.string(),
  location: v.string(),
  salary: v.optional(v.string()),
  status: v.string(),                    // applied|screening|interview|offer|rejected|accepted
  appliedDate: v.number(),               // epoch ms
  source: v.string(),
  notes: v.optional(v.string()),
  interviewDates: v.array(v.object({
    type: v.string(),
    date: v.number(),
    notes: v.optional(v.string()),
  })),
  documents: v.array(v.string()),
})
  .index("by_user", ["userId"])
  .index("by_user_status", ["userId", "status"])
  .index("by_user_applied", ["userId", "appliedDate"])
  .index("by_user_cv", ["userId", "cvId"]),
```

**Convex `api.d.ts`** — add `applications: typeof applications`.

**npm deps** — none.

**Manifest + binder wiring:**

1. `sliceRegistry.ts`:
   ```ts
   import { careerDashboardManifest } from "@/slices/career-dashboard";
   export const SLICE_REGISTRY = [/* …, */ careerDashboardManifest];
   ```
2. `Providers.tsx`:
   ```ts
   import { CareerDashboardCapabilities } from "@/slices/career-dashboard";
   <CareerDashboardCapabilities />
   ```
3. `convex/_seeds/aiDefaults.ts` `DEFAULT_AI_TOOLS` — append:
   `applications.list`, `applications.create`,
   `applications.update-status`, `applications.delete`
   (copy block from CareerPack as-is).
4. `convex/ai/skillHandlers.ts`:
   ```ts
   "applications.list": async (ctx) => {
     const apps = await ctx.runQuery(api.applications.queries.getUserApplications, {});
     return apps.slice(0, 50).map((a) => ({ /* trim */ }));
   },
   ```

**Nav registration** — manifest-driven (slug `applications`, placement
`more`, hue `from-violet-400 to-violet-600`). Legacy fallback: edit
`navConfig.ts` + `dashboardRoutes.tsx` if target has not adopted the
manifest registry.

**Env vars** — none beyond Convex baseline.

**i18n** — Indonesian copy: status labels ("Dilamar", "Screening",
"Wawancara", "Tawaran", "Ditolak", "Diterima") in `constants/status.ts`,
button text, dialog labels in `AddApplicationDialog.tsx`, column
headers in `columns.tsx`.

**Common breakage after port:**

- **`cvId` schema mismatch** — if `cv-generator` not ported, drop the
  `cvId` field + `by_user_cv` index, and remove the references in
  `applications/queries.ts` / `mutations.ts`.
- **`DataTable` import broken** — `@/shared/components/data-table` is
  a folder export; copy the entire folder, not just the index.
- **`QuickFillButton` missing** — only used if onboarding flow ported.
  Either copy `shared/components/onboarding/` or stub the button.
- **AI skill silent** — re-seed `DEFAULT_AI_TOOLS` after editing
  `aiDefaults.ts` (admin "Seed default" button).
- **Status colors not matching** — port `--status-*` CSS tokens from
  `frontend/src/shared/styles/index.css` if target's theme is custom.

**Testing the port:**

1. Navigate `/dashboard/applications` → table renders empty state
2. Click "Tambah Lamaran" → dialog opens, save → row appears
3. Change status via dropdown → updates immediately (reactive)
4. Open AI agent, type "tambah lamaran ke Tokopedia sebagai Frontend
   Engineer di Jakarta dari LinkedIn" → ApproveActionCard for
   `applications.create`
5. Approve → row appears, toast fires
6. Type "berapa lamaran saya" → agent calls `applications.list`
   handler and answers from result

Run `_porting-guide.md` §9 checklist.
