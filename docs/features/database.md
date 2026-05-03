# Database (Hub Tabel User)

> **Portability tier:** M — slice + shared `data-table` infra; reads cross-domain Convex.

## Tujuan

Hub admin-style untuk semua data per-user di satu tempat. Search,
filter, sort, multi-select, bulk delete, ekspor JSON, dan import
JSON via Quick Fill — di-tab per resource (CV, Portfolio, Goals,
Lamaran, Kontak, Riwayat Impor). Fungsinya bukan admin-of-admins;
ini "Settings → Data" untuk power-user yang ingin lihat / kelola
masal isi mereka sendiri.

## Route & Entry

- URL: `/dashboard/database`
- Slice: `frontend/src/slices/database/`
- Komponen utama: `DatabaseView.tsx`

## Struktur Slice

```
database/
├─ index.ts                                     export { DatabaseView }
├─ components/
│  ├─ DatabaseView.tsx                          Tab orchestrator (6 tab)
│  ├─ ResourceTable.tsx                         Generic table pembungkus DataTable + bulk delete + import/export
│  ├─ RelatedRowsDrawer.tsx                     Drawer "rows yang merujuk ke entry ini"
│  └─ tabs/
│     ├─ CVTab.tsx                              CV (cv-generator domain)
│     ├─ PortfolioTab.tsx                       Portfolio item
│     ├─ GoalsTab.tsx                           Goals
│     ├─ ApplicationsTab.tsx                    Lamaran
│     ├─ ContactsTab.tsx                        Kontak
│     └─ BatchesTab.tsx                         Riwayat impor onboarding (undoable)
└─ lib/
   ├─ defineResource.tsx                        Factory: kolom + filter + import/export per resource
   └─ jsonIO.ts                                 Download / parse JSON helper
```

## Data Flow

Lintas domain Convex. Setiap tab declarative via `defineResource`.

| Tab | Query | Bulk delete | Quick fill | Related drawer |
|---|---|---|---|---|
| CV | `api.cv.queries.getUserCVs` | `api.cv.mutations.bulkDeleteCVs` | `api.onboarding.mutations.quickFill` | Lamaran (`api.cv.queries.getApplicationsByCV`), ATS scans (`api.cv.queries.getATSScansByCV`) |
| Portfolio | `api.portfolio.queries.listPortfolio` | `api.portfolio.mutations.bulkDeletePortfolioItems` | `api.onboarding.mutations.quickFill` | — |
| Goals | `api.goals.queries.getUserGoals` | `api.goals.mutations.bulkDeleteGoals` | `api.onboarding.mutations.quickFill` | — |
| Lamaran | `api.applications.queries.getUserApplications` | `api.applications.mutations.bulkDeleteApplications` | `api.onboarding.mutations.quickFill` | Calendar events (`api.applications.queries.getCalendarEventsByApplication`) |
| Kontak | `api.contacts.queries.listContacts` | `api.contacts.mutations.bulkDeleteContacts` | `api.onboarding.mutations.quickFill` | — |
| Batches | `api.onboarding.queries.listBatches` | `api.onboarding.mutations.undoBatch` | — | — |

## State Lokal

- `selectedRows` per tab (DataTable selection set).
- `relatedDrawerKey` — current "show related rows" focus.
- `importDialog` open/close + parsed JSON staging.
- Filter / sort / search di handle DataTable internally.

## Dependensi

- `@/shared/components/data-table` — generic DataTable + ColumnDef + FilterDef.
- `@/shared/components/ui/{button,badge,skeleton,responsive-dialog,responsive-alert-dialog,tabs}`.
- `@/shared/lib/formatDate`.
- Domain-specific Convex modules (cv, portfolio, goals, applications, contacts, onboarding).

## Catatan Desain

- **`defineResource` factory**. Setiap tab mengikuti pattern resmi: deklaratif `columns: ColumnDef[]`, `filters: FilterDef[]`, `actions`. Single source of truth — penambahan kolom = edit 1 tempat.
- **Quick Fill = JSON import**. JSON file ditelan oleh `api.onboarding.mutations.quickFill` yang menjalankan validator + hydrate ke beberapa table sekaligus. Hasil di-track sebagai "batch" yang bisa di-undo via `BatchesTab`.
- **`RelatedRowsDrawer`** muncul saat user expand row CV/Lamaran. Hindari blind delete — selalu tampilkan referensi outbound dulu.
- **Tier admin? bukan.** Database VIEW user-scoped — tiap query pakai `optionalUser`/`requireUser`. Tidak menampilkan data user lain.

## Extending

- Tab tambahan untuk Documents / Calendar / Roadmap nodes.
- Inline edit per cell (sekarang baca + bulk delete saja).
- Schema-aware column ordering preferences (persist di `userProfiles.uiPrefs`).

---

## Portabilitas

**Tier:** M

**Files untuk dicopy:**

```
# Slice
frontend/src/slices/database/

# Shared deps
frontend/src/shared/components/data-table/
frontend/src/shared/lib/formatDate.ts

# Backend (any of these the target hasn't already ported)
convex/cv/                   convex/portfolio/    convex/goals/
convex/applications/         convex/contacts/     convex/onboarding/
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

mkdir -p "$DST/frontend/src/slices" \
         "$DST/frontend/src/shared/components/data-table" \
         "$DST/frontend/src/shared/lib"

cp -r "$SRC/frontend/src/slices/database"                         "$DST/frontend/src/slices/"
cp -r "$SRC/frontend/src/shared/components/data-table/."          "$DST/frontend/src/shared/components/data-table/"
cp "$SRC/frontend/src/shared/lib/formatDate.ts"                    "$DST/frontend/src/shared/lib/"

# Backend domains (only if target doesn't have them yet)
for d in cv portfolio goals applications contacts onboarding; do
  cp -r "$SRC/convex/$d" "$DST/convex/" 2>/dev/null || true
done
```

**Schema additions** — depends on which domains the target lacks. Each
domain's `schema.ts` defines its own table fragment; copy verbatim.

**Convex api.d.ts** — `cv`, `portfolio`, `goals`, `applications`,
`contacts`, `onboarding`.

**npm deps:** none (DataTable is homemade — no @tanstack/react-table).

**Env vars:** none.

**Nav registration:**

`dashboardRoutes.tsx`:
```ts
const DATABASE: View = dynamic(
  () => import("@/slices/database").then((m) => m.DatabaseView),
  { loading: loadingFallback },
);
DASHBOARD_VIEWS["database"] = DATABASE;
```

`navConfig.ts`:
```ts
{ id: "database", label: "Database", icon: Database, href: "/dashboard/database", hue: "from-slate-500 to-zinc-700" }
```

**i18n:** Indonesian tab labels ("Lamaran", "Kontak", "Riwayat Impor"),
toast strings, JSON import error messages.

**Common breakage:**

- **`@/shared/components/data-table` missing** — copy entire folder; subcomponents reference internal column meta types.
- **`bulkDelete*` mutation missing on a domain** — implement in target's domain mutations.ts following `convex/cv/mutations.ts → bulkDeleteCVs` pattern (`makeBulkDelete` helper in `_shared`).
- **`api.onboarding.mutations.quickFill` missing** — Quick Fill batches require porting full `convex/onboarding/`. If skipping import feature, remove import button from `defineResource` calls.
- **Related drawer empty for new resources** — pass empty `related: []` in `defineResource` args until you wire that domain's join queries.

**Testing:**
1. Open `/dashboard/database` → CV tab default; data loads, count badge correct.
2. Multi-select 2 rows → "Hapus" button enabled → confirm → bulk-delete fires once (1 mutation, not N).
3. Click "Ekspor JSON" → file downloads with right structure.
4. Import a JSON file → batch row appears in Riwayat Impor → click Undo → all rows from that batch removed.
5. Expand a CV row → RelatedRowsDrawer lists matching applications and ATS scans.

Run `_porting-guide.md` §9 checklist.
