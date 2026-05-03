# Document Checklist

> **Portability tier:** L — slice + Convex module + schema + big
> hardcoded Indonesian template + manifest/binder wiring

## Tujuan

Ceklis dokumen persiapan kerja — varian `local` (Indonesia) dan
`international`. Track mana yang ready, notes per item, expiry date.
Toggle lewat UI atau via AI agent (skill `documents.toggle`).

## Route & Entry

- URL: `/dashboard/checklist`
- Slice: `frontend/src/slices/document-checklist/`
- Komponen utama: `DocumentChecklist.tsx`
- Lazy-loaded via `manifest.route.component`.

## Struktur Slice

```
document-checklist/
├─ index.ts                                    barrel: DocumentChecklist, DocumentChecklistCapabilities, manifest
├─ manifest.ts                                 SliceManifest + skills (list, toggle)
├─ components/
│  ├─ DocumentChecklist.tsx                    page shell — variant tabs, progress, filters
│  ├─ DocumentChecklistCapabilities.tsx        binder: subscribe → updateDocumentStatus
│  └─ document-checklist/
│     ├─ CategoryFilter.tsx                    chip filter per category
│     ├─ CategorySection.tsx                   collapsible per-category list
│     ├─ ChecklistItemCard.tsx                 single item (checkbox + notes + expiry)
│     ├─ ItemDetailDialog.tsx                  detail/edit dialog
│     └─ ProgressGrid.tsx                      progress per category visual
├─ constants/
│  └─ icons.ts                                 lucide icon map per category
├─ hooks/
│  └─ useChecklistData.ts                      Convex CRUD + variant init
└─ types/
   └─ index.ts                                 ChecklistItem, DocumentCategory, DocumentSubcategory
```

Inline variant ringkas: `cv-generator/components/DocChecklistInline.tsx`
(embed di CV editor — bukan bagian dari slice ini, lihat
`cv-generator.md`).

## Data Flow

Backend: tabel `documentChecklists` di `convex/documents/`.

| Hook / call | Convex op | Purpose |
|---|---|---|
| `useChecklistData().checklist` | `api.documents.queries.getUserDocumentChecklist` | Fetch user's checklist |
| `useChecklistData().init` | `api.documents.mutations.createDocumentChecklist` | Init with variant template |
| `useChecklistData().toggle` | `api.documents.mutations.updateDocumentStatus` | Toggle/update item state |

Skill server-side `documents.list` di `convex/ai/skillHandlers.ts`
(top 100 items, trim noise). `documents.toggle` (mutation) dieksekusi
oleh `DocumentChecklistCapabilities` setelah user approve.

Schema:
- `type: string` — `"local" | "international"`
- `country?: string` — ID/SG/MY/dst (untuk international template)
- `documents: Array<{ id, name, category, subcategory?, required, completed, notes, expiryDate? }>`
- `progress: number` (0–100)
- Index: `by_user`

Template default datang dari frontend (`shared/data/indonesianData.ts`)
via `indonesianDocumentChecklist` + `indonesianCategoryLabels`. Server
seeding pakai itu via `_seeds/`.

## State Lokal

- `typeFilter` / `categoryFilter`
- `expandedItemId` untuk edit notes / expiry
- Demo overlay state via `useDemoChecklistOverlay` (onboarding)

## Dependensi

- `@/shared/hooks/useAuth`
- `@/shared/hooks/useDemoOverlay` — `useDemoChecklistOverlay`
- `@/shared/data/indonesianData` — `indonesianDocumentChecklist`,
  `indonesianCategoryLabels`
- `@/shared/components/layout/PageContainer`
- `@/shared/components/ui/responsive-page-header`
- `@/shared/components/ui/responsive-dialog`
- `@/shared/components/ui/date-picker`
- `@/shared/components/ui/scroll-area`
- `@/shared/lib/notify` — toast
- `@/shared/lib/utils` — `cn`
- `@/shared/lib/aiActionBus` — `subscribe` (binder)
- `@/shared/types/sliceManifest`
- shadcn primitives: `card`, `tabs`, `progress`, `badge`, `button`,
  `label`, `textarea`
- npm: `date-fns` (transitively via date-picker for expiry math)

## Catatan Desain

- Frontend owns template (title/description/icons), server stores per-item
  completion state. (See `guides.md` G13 pattern A.) Template change =
  frontend deploy, no schema migration.
- Category-based grouping bikin scan cepat (Application / Credentials /
  Identity / Legal / Education / Health / Skills).
- `expiryDate` optional — null = tidak tracked (mis. CV tidak punya
  expiry; KTP punya, ijazah tidak).

## Extending

- Upload dokumen (file storage) → pakai Convex storage + link ke
  `storageId` per item.
- Reminder ekspirasi → notification 30/7/1 hari sebelum expiry
  (scheduled function).
- Sharing checklist ke coach / mentor — butuh role-based access.

---

## Portabilitas

**Tier:** L

**Files untuk dicopy:**

```
# Slice itself
frontend/src/slices/document-checklist/

# Shared deps
frontend/src/shared/hooks/useAuth.tsx                  # baseline (per _porting-guide.md §1)
frontend/src/shared/hooks/useDemoOverlay.ts            # onboarding overlay (or stub)
frontend/src/shared/data/indonesianData.ts             # contains template + category labels
frontend/src/shared/components/layout/PageContainer.tsx
frontend/src/shared/components/ui/responsive-page-header.tsx
frontend/src/shared/components/ui/responsive-dialog.tsx
frontend/src/shared/components/ui/date-picker.tsx
frontend/src/shared/components/ui/scroll-area.tsx
frontend/src/shared/lib/notify.ts
frontend/src/shared/lib/aiActionBus.ts                 # if not yet present
frontend/src/shared/types/sliceManifest.ts             # if not yet present

# Backend
convex/documents/                                      # queries.ts, mutations.ts, schema.ts
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

# Slice
mkdir -p "$DST/frontend/src/slices"
cp -r "$SRC/frontend/src/slices/document-checklist" "$DST/frontend/src/slices/"

# Shared helpers
mkdir -p "$DST/frontend/src/shared/hooks"
mkdir -p "$DST/frontend/src/shared/lib"
mkdir -p "$DST/frontend/src/shared/types"
mkdir -p "$DST/frontend/src/shared/data"
mkdir -p "$DST/frontend/src/shared/components/layout"
mkdir -p "$DST/frontend/src/shared/components/ui"

cp "$SRC/frontend/src/shared/hooks/useDemoOverlay.ts"          "$DST/frontend/src/shared/hooks/"
cp "$SRC/frontend/src/shared/data/indonesianData.ts"           "$DST/frontend/src/shared/data/"
cp "$SRC/frontend/src/shared/components/layout/PageContainer.tsx" "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/components/ui/responsive-page-header.tsx" "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-dialog.tsx"      "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/date-picker.tsx"            "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/scroll-area.tsx"            "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/lib/notify.ts"                    "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/lib/aiActionBus.ts"               "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/types/sliceManifest.ts"           "$DST/frontend/src/shared/types/"

# Backend
cp -r "$SRC/convex/documents" "$DST/convex/"
```

**Schema additions** — append to target's `convex/schema.ts`:

```ts
documentChecklists: defineTable({
  userId: v.id("users"),
  type: v.string(),                    // local | international
  country: v.optional(v.string()),
  documents: v.array(v.object({
    id: v.string(),
    name: v.string(),
    category: v.string(),
    subcategory: v.optional(v.string()),
    required: v.boolean(),
    completed: v.boolean(),
    notes: v.string(),
    expiryDate: v.optional(v.string()),
  })),
  progress: v.number(),
}).index("by_user", ["userId"]),
```

**Convex `api.d.ts`** — add `documents: typeof documents`.

**npm deps** — none (date-fns is transitive).

**Manifest + binder wiring:**

1. `sliceRegistry.ts`:
   ```ts
   import { documentChecklistManifest } from "@/slices/document-checklist";
   export const SLICE_REGISTRY = [/* …, */ documentChecklistManifest];
   ```
2. `Providers.tsx`:
   ```ts
   import { DocumentChecklistCapabilities } from "@/slices/document-checklist";
   <DocumentChecklistCapabilities />
   ```
3. `convex/_seeds/aiDefaults.ts` `DEFAULT_AI_TOOLS` — append:
   `documents.list`, `documents.toggle` (copy block from CareerPack).
4. `convex/ai/skillHandlers.ts`:
   ```ts
   "documents.list": async (ctx) => {
     const checklist = await ctx.runQuery(
       api.documents.queries.getUserDocumentChecklist, {});
     if (!checklist) return [];
     return (checklist.documents ?? []).slice(0, 100).map((d) => ({ /* trim */ }));
   },
   ```

**Nav registration** — manifest-driven (slug `checklist`, placement
`more`, hue `from-emerald-400 to-emerald-600`). Legacy fallback: edit
`navConfig.ts` + `dashboardRoutes.tsx`.

**Env vars** — none beyond Convex baseline.

**i18n & content** — `indonesianDocumentChecklist` di
`shared/data/indonesianData.ts` ≈ 200 item Indonesia-spesifik (KTP,
NPWP, paspor, ijazah, transkrip, SKCK, visa reqs). Full rewrite
untuk target market — paling besar mass dari port slice ini. Category
labels juga di file yang sama.

**Common breakage after port:**

- **Empty list on first load** — `createDocumentChecklist` belum
  dipanggil. Tombol "Mulai" di UI memicu init dengan template;
  pastikan mutation menerima variant `local` / `international`.
- **`useDemoOverlay` missing** — onboarding-only feature; aman
  di-stub jadi `() => ({ shown: false })` jika tidak ported.
- **AI skill toggling wrong item** — `documents.toggle` butuh
  `documentId` (the per-row UUID, NOT Convex `_id`). Kalau handler
  di `skillHandlers.ts` keluarin `documentId: d.id` (sudah benar
  di template), no issue.
- **Category icons broken** — `constants/icons.ts` map ke lucide
  icons; jika target pakai lucide version berbeda, beberapa nama
  icon mungkin berubah.

**Testing the port:**

1. Navigate `/dashboard/checklist` → empty state + "Mulai" button
2. Click "Mulai" → checklist tergenerasi dari template, ~30+ item
3. Toggle satu item → progress percentage naik
4. Edit item → notes + expiry tersimpan
5. Open AI agent, type "tandai paspor sudah ada" → agent calls
   `documents.list` (handler) → identifies row → emits
   `documents.toggle` ApproveActionCard
6. Approve → checkbox state berubah, toast fires

Run `_porting-guide.md` §9 checklist.
