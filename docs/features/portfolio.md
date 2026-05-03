# Portofolio

> **Portability tier:** L — slice + FileUpload stack + 1 Convex domain + schema (multi-media + multi-link)

## Tujuan

Showcase proyek, sertifikasi, publikasi dengan dukungan multi-media (gambar / video / PDF), multi-link (live / repo / case-study), tech stack, role/client/duration metadata, dan per-item public branding visibility. Featured carousel + filter tabs + import dari CV projects.

## Route & Entry

- URL: `/dashboard/portfolio`
- Slice: `frontend/src/slices/portfolio/`
- Komponen utama: `PortfolioView.tsx`, `PortfolioCard.tsx`, `PortfolioForm.tsx`

## Struktur Slice

```
portfolio/
├─ index.ts
├─ components/
│  ├─ PortfolioView.tsx              Page — header + stats + featured carousel + tabs + grid
│  ├─ PortfolioCard.tsx              Cover (media[0] / emoji+gradient) + tech chips + actions
│  ├─ PortfolioDetailDialog.tsx      Read-only deep view — media gallery, links, outcomes
│  ├─ PortfolioForm.tsx              ResponsiveDialog shell mounting BasicTab/DetailTab
│  ├─ LibraryPicker.tsx              Pick existing files dari `files` table (avoids re-upload)
│  └─ portfolio-form/
│     ├─ BasicTab.tsx                Title, category, date, cover, featured toggle
│     ├─ DetailTab.tsx               Role/client/duration, outcomes, skills, branding visibility
│     ├─ CoverPreview.tsx            Live cover preview (media[0] or emoji+gradient)
│     ├─ LinksEditor.tsx             Typed multi-link editor (live/repo/slides/etc.)
│     └─ MediaEditor.tsx             Multi-media uploader (image/video/pdf)
├─ hooks/usePortfolio.ts             Convex CRUD wrappers
├─ lib/itemToValues.ts               Doc → form values mapping
├─ constants/index.ts                CATEGORY_LABELS, COVER_GRADIENTS, EMOJI_SUGGESTIONS, DEFAULT_FORM
└─ types/index.ts                    PortfolioItem, PortfolioCategory, PortfolioFilter, PortfolioFormValues
```

## Data Flow

Backend domain: `convex/portfolio/`. Tabel: `portfolioItems`.

| Hook / method | Convex op | Purpose |
|---|---|---|
| `usePortfolio.items` | `api.portfolio.queries.listPortfolio` | Owner items desc by createdAt; resolves `media[].storageId` → URL inline |
| `usePortfolio.create` | `api.portfolio.mutations.createPortfolioItem` | Insert (validates link + media kinds) |
| `usePortfolio.update` | `api.portfolio.mutations.updatePortfolioItem` | Partial patch |
| `usePortfolio.remove` | `api.portfolio.mutations.deletePortfolioItem` | Ownership-checked hard delete |
| `usePortfolio.bulkRemove` | `api.portfolio.mutations.bulkDeletePortfolioItems` | Multi-select delete |
| `usePortfolio.toggleFeatured` | `api.portfolio.mutations.togglePortfolioFeatured` | Flip `featured` |
| `usePortfolio.toggleBrandingShow` | `api.portfolio.mutations.togglePortfolioBrandingShow` | Per-item public visibility override |
| `LibraryPicker` | `api.files.queries.listMyFiles` | Pick prior uploads tanpa re-upload |

Schema (lihat `convex/portfolio/schema.ts` — abridged):

```ts
portfolioItems: defineTable({
  userId: v.id("users"),
  title: v.string(),
  description: v.string(),
  category: v.string(),                     // "project" | "certification" | "publication"
  // Legacy single-cover (preserved for back-compat reads)
  coverEmoji: v.optional(v.string()),
  coverGradient: v.optional(v.string()),
  coverStorageId: v.optional(v.string()),
  // Multi-media gallery
  media: v.optional(v.array(v.object({
    storageId: v.string(),
    kind: v.string(),                       // image | video | pdf | file
    caption: v.optional(v.string()),
  }))),
  // Legacy single-link + new typed multi-link
  link: v.optional(v.string()),
  links: v.optional(v.array(v.object({
    url: v.string(),
    label: v.string(),
    kind: v.string(),                       // live | repo | case-study | slides | video | article | store | other
  }))),
  techStack: v.optional(v.array(v.string())),
  date: v.string(),                         // ISO YYYY-MM-DD
  featured: v.boolean(),
  // Rich metadata
  role: v.optional(v.string()),
  client: v.optional(v.string()),
  duration: v.optional(v.string()),
  outcomes: v.optional(v.array(v.string())),
  collaborators: v.optional(v.array(v.string())),
  skills: v.optional(v.array(v.string())),
  // Per-item branding visibility (overrides global publicPortfolioShow)
  brandingShow: v.optional(v.boolean()),
  sortOrder: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_user_category", ["userId", "category"])
  .index("by_user_featured", ["userId", "featured"]),
```

## State Lokal

- Filter tab (`PortfolioFilter`: all / project / certification / publication)
- Form values via `itemToValues(doc)` — controlled across BasicTab / DetailTab
- Featured carousel auto-derived dari `items.filter(i => i.featured)`
- Detail dialog state (`activeItemId`)
- Demo overlay state via `useDemoPortfolioOverlay`

## Dependensi

- `@/shared/components/files/FileUpload` — multi-media upload
- `@/shared/components/onboarding` — `QuickFillButton` (auto-import dari CV projects)
- `@/shared/components/ui/responsive-page-header`
- `@/shared/components/ui/responsive-carousel`
- `@/shared/components/ui/responsive-dialog`
- `@/shared/components/ui/responsive-alert-dialog`
- `@/shared/components/ui/responsive-select`
- `@/shared/components/layout/PageContainer`
- `@/shared/hooks/useAuth`, `@/shared/hooks/useDemoOverlay` (`useDemoPortfolioOverlay`)
- `@/shared/lib/formatDate` (`formatMonthYear`), `@/shared/lib/notify`, `@/shared/lib/utils` (`cn`)
- shadcn: `badge`, `button`, `checkbox`, `input`, `label`, `skeleton`, `switch`, `tabs`, `textarea`
- Convex: `api.portfolio.*`, `api.files.queries.listMyFiles`

## Catatan Desain

- **Multi-media + multi-link** — schema mendukung gallery + typed links (live/repo/slides/dst.). Legacy `coverStorageId` + `link` masih dibaca untuk row lama; tulisan baru pakai `media[]` + `links[]`.
- **`media[0]` jadi cover** kalau ada; fallback ke `coverEmoji + coverGradient` (zero-storage).
- **`brandingShow` per-item** override `publicPortfolioShow` global — user bisa kurasi item mana yang muncul di public page tanpa unshare semua.
- **`LibraryPicker`** baca `api.files.queries.listMyFiles` jadi user bisa attach file yang sudah di-upload via slice lain (mis. CV avatar) tanpa duplikasi storage.
- Manifest belum ada — slice bukan AI bus subscriber.

## Extending

- Reorder drag & drop pakai `MicroInteractions.useDragReorder` + `sortOrder` field (sudah ada di schema).
- Public share link (`/p/:shareId`) — read-only route untuk item single.
- Auto-sync dari `cvs.projects` setiap save (sekarang manual via `QuickFillButton`).
- AI skill: `portfolio.create-from-cv-project` — manifest + binder pattern mirip networking.

---

## Portabilitas

**Tier:** L

**Files untuk dicopy:**

```
# Slice
frontend/src/slices/portfolio/

# Shared deps
frontend/src/shared/components/files/FileUpload.tsx                     # multi-media
frontend/src/shared/components/onboarding/                              # QuickFillButton
frontend/src/shared/components/ui/responsive-page-header.tsx
frontend/src/shared/components/ui/responsive-carousel.tsx
frontend/src/shared/components/ui/responsive-dialog.tsx
frontend/src/shared/components/ui/responsive-alert-dialog.tsx
frontend/src/shared/components/ui/responsive-select.tsx
frontend/src/shared/components/layout/PageContainer.tsx
frontend/src/shared/hooks/useFileUpload.ts
frontend/src/shared/hooks/useDemoOverlay.ts                             # demoPortfolio overlay
frontend/src/shared/lib/imageConvert.ts                                 # WebP + crop
frontend/src/shared/lib/formatDate.ts                                   # formatMonthYear
frontend/src/shared/lib/notify.ts
frontend/src/shared/lib/utils.ts

# Backend
convex/portfolio/                                                       # schema + queries + mutations
convex/files/                                                           # required for media + LibraryPicker
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

# Slice
mkdir -p "$DST/frontend/src/slices"
cp -r "$SRC/frontend/src/slices/portfolio" "$DST/frontend/src/slices/"

# Shared deps
mkdir -p "$DST/frontend/src/shared/components/files"
mkdir -p "$DST/frontend/src/shared/components/onboarding"
mkdir -p "$DST/frontend/src/shared/components/ui"
mkdir -p "$DST/frontend/src/shared/components/layout"
mkdir -p "$DST/frontend/src/shared/hooks"
mkdir -p "$DST/frontend/src/shared/lib"

cp    "$SRC/frontend/src/shared/components/files/FileUpload.tsx"          "$DST/frontend/src/shared/components/files/"
cp -r "$SRC/frontend/src/shared/components/onboarding"                    "$DST/frontend/src/shared/components/"
cp    "$SRC/frontend/src/shared/components/ui/responsive-page-header.tsx" "$DST/frontend/src/shared/components/ui/"
cp    "$SRC/frontend/src/shared/components/ui/responsive-carousel.tsx"    "$DST/frontend/src/shared/components/ui/"
cp    "$SRC/frontend/src/shared/components/ui/responsive-dialog.tsx"      "$DST/frontend/src/shared/components/ui/"
cp    "$SRC/frontend/src/shared/components/ui/responsive-alert-dialog.tsx" "$DST/frontend/src/shared/components/ui/"
cp    "$SRC/frontend/src/shared/components/ui/responsive-select.tsx"      "$DST/frontend/src/shared/components/ui/"
cp    "$SRC/frontend/src/shared/components/layout/PageContainer.tsx"      "$DST/frontend/src/shared/components/layout/"
cp    "$SRC/frontend/src/shared/hooks/useFileUpload.ts"                   "$DST/frontend/src/shared/hooks/"
cp    "$SRC/frontend/src/shared/hooks/useDemoOverlay.ts"                  "$DST/frontend/src/shared/hooks/"
cp    "$SRC/frontend/src/shared/lib/imageConvert.ts"                      "$DST/frontend/src/shared/lib/"
cp    "$SRC/frontend/src/shared/lib/formatDate.ts"                        "$DST/frontend/src/shared/lib/"
cp    "$SRC/frontend/src/shared/lib/notify.ts"                            "$DST/frontend/src/shared/lib/"

# Backend
cp -r "$SRC/convex/portfolio" "$DST/convex/"
cp -r "$SRC/convex/files"     "$DST/convex/"     # if not already ported
```

**Schema additions** — copy verbatim dari `convex/portfolio/schema.ts` (snippet di "Data Flow"). Indexes wajib: `by_user`, `by_user_category`, `by_user_featured`. Plus `files` table dari `file-upload.md`.

**Convex api.d.ts** — add `portfolio` + `files` modules:

```ts
import type * as portfolio_mutations from "../portfolio/mutations.js";
import type * as portfolio_queries from "../portfolio/queries.js";

declare const fullApi: ApiFromModules<{
  // ...
  "portfolio/mutations": typeof portfolio_mutations;
  "portfolio/queries":  typeof portfolio_queries;
}>;
```

**npm deps:**

```bash
pnpm -F frontend add react-easy-crop      # transitive via FileUpload
```

**Env vars** — none specific; Convex storage baseline.

**Manifest + binder wiring** — N/A (slice tidak punya manifest saat ini).

**Nav registration** — `dashboardRoutes.tsx` + `navConfig.ts` (see `_porting-guide.md` §4). Slug `portfolio` (label "Portofolio", icon `Folder`, hue `from-orange-400 to-orange-600`, placement `MORE_APPS`).

**i18n** — Indonesian copy:
- Category labels: "Proyek" / "Sertifikasi" / "Publikasi"
- Form sections: "Informasi Dasar" / "Detail" / "Media" / "Tautan"
- Actions: "Tambah", "Simpan", "Hapus", "Jadikan unggulan"
- Link kinds: "live", "repo", "case-study", "slides", "video", "article", "store", "other" — keys English, label optional

**Common breakage after port:**

- **Cover blank** — `listPortfolio` resolve `media[0].storageId` lewat `getUrl()`. Kalau `convex/files/` belum diport, query throw. Port `files/` lebih dulu (lihat `file-upload.md`).
- **LibraryPicker error** — butuh `api.files.queries.listMyFiles`. Sama: `files/` wajib.
- **`techStack` chip ilang** — schema lama (pre-multi-media) tidak punya array; kalau target sudah punya rows lama, run migrasi additive.
- **`react-easy-crop` SSR** — `FileUpload` adalah Client Component, jangan `import` di Server Component parent.
- **`QuickFillButton` undefined** — `@/shared/components/onboarding` belum dicopy; tanpanya, tombol auto-import dari CV projects ilang.

**Testing the port:**

1. Navigate `/dashboard/portfolio` → grid render
2. Klik "Tambah" → form buka dengan 2 tab (Basic / Detail)
3. Upload image di Media tab → preview muncul, simpan → cover render di card
4. Tambah typed link (live + repo) → muncul di detail dialog
5. Toggle "Unggulan" → item naik ke featured carousel
6. Toggle `brandingShow` → cek public page tidak menampilkan item (kalau `/[slug]` route ported)
7. Reload → semua data persist

Run `_porting-guide.md` §9 checklist.
