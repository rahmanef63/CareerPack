# Portofolio

## Tujuan

Showcase proyek, sertifikasi, dan publikasi user. Emoji + gradient cover (zero-file-upload), category tabs, featured carousel.

## Route & Entry

- URL: `/dashboard/portfolio`
- Slice: `frontend/src/slices/portfolio/`
- Komponen utama: `PortfolioView.tsx`, `PortfolioCard.tsx`, `PortfolioForm.tsx`

## Struktur Slice

```
portfolio/
├─ index.ts
├─ components/
│  ├─ PortfolioView.tsx    Page — header + stats + Sparkles featured carousel + category tabs + grid
│  ├─ PortfolioCard.tsx    Gradient-cover card dengan emoji, tech stack, favorite + delete
│  └─ PortfolioForm.tsx    ResponsiveDialog — emoji picker + gradient swatch + tech chip input
├─ hooks/usePortfolio.ts
├─ constants/index.ts      CATEGORY_LABELS, COVER_GRADIENTS, EMOJI_SUGGESTIONS, DEFAULT_FORM
└─ types/index.ts          PortfolioItem, PortfolioCategory, PortfolioFilter, PortfolioFormValues
```

## Data Flow

| Operation | Convex fn | Purpose |
|---|---|---|
| List | `api.portfolio.queries.listPortfolio` | Owner items desc by createdAt |
| Create | `api.portfolio.mutations.createPortfolioItem` | Insert with techStack default `[]`, featured default `false` |
| Update | `api.portfolio.mutations.updatePortfolioItem` | Partial patch — all fields optional |
| Delete | `api.portfolio.mutations.deletePortfolioItem` | Ownership-checked hard delete |
| Feature | `api.portfolio.mutations.togglePortfolioFeatured` | Flip `featured` flag |

## Schema

Tabel `portfolioItems`:

```ts
{
  userId, title, description,
  category: "project" | "certification" | "publication",
  coverEmoji?,     // e.g. "🚀"
  coverGradient?,  // Tailwind gradient class, e.g. "from-cyan-400 to-cyan-600"
  link?,
  techStack?: string[],
  date: string,    // ISO YYYY-MM-DD
  featured: boolean
}
```

Indexes: `by_user`, `by_user_category`, `by_user_featured`.

## UI

1. **ResponsivePageHeader** — title + description + "Tambah" action.
2. **Stats strip** — Total / Unggulan / Proyek / Sertifikasi.
3. **"Unggulan" `ResponsiveCarousel`** (items dengan `featured=true`) dengan Sparkles icon.
4. **Filter tabs (`variant="pills"`)** — Semua / Proyek / Sertifikasi / Publikasi dengan count badges.
5. **3-col grid** PortfolioCard (1/2/3 responsive).

Tiap card: gradient banner dengan emoji besar + "Unggulan" star badge kiri-atas + category badge kanan-atas + tech stack chips + favorite toggle + delete action.

## Dependensi

- `@/shared/components/ui/responsive-page-header`
- `@/shared/components/ui/responsive-carousel`
- `@/shared/components/ui/responsive-dialog` (form)
- `@/shared/components/ui/responsive-select` (category picker)
- shadcn: `card`, `input`, `textarea`, `badge`, `switch`, `tabs`

## Catatan Desain

- **Emoji + gradient as cover** — tanpa file upload storage. User pilih dari 20 emoji suggestion + 8 gradient palette. Scale-up opsi: upload real cover via Convex storage (kalau dibutuhkan).
- `featured` carousel bukan "popularitas" algoritmik — user manual toggle. Sengaja opt-in supaya tidak ada surprise.
- Delete hard (tanpa archive). ResponsiveAlertDialog confirmation wajar ditambah nanti jika user complain.

## Extending

- Upload real image cover (Convex storage + presigned URL)
- Public share link (`/p/:shareId` read-only route)
- Sync otomatis dari `cvs.projects` — auto-populate portfolio dari Proyek section di CV Generator
- Reorder drag & drop — pakai `MicroInteractions.useDragReorder`
- Template gallery (preset cover + copy struktur)

---

## Portabilitas

**Tier:** L — slice + FileUpload integration + Convex module + schema.

**Files:**

```
frontend/src/slices/portfolio/
frontend/src/shared/hooks/usePortfolio.ts          # if not inside slice
frontend/src/shared/components/files/FileUpload.tsx # cover image upload
frontend/src/shared/hooks/useFileUpload.ts
frontend/src/shared/lib/imageConvert.ts
convex/portfolio/
convex/files/
```

**cp:**

```bash
SRC=~/projects/CareerPack DST=~/projects/<target>
cp -r "$SRC/frontend/src/slices/portfolio" "$DST/frontend/src/slices/"
cp "$SRC/convex/portfolio/"              "$DST/convex/"
# + full file-upload copy per file-upload.md
```

**Schema:** add `portfolioItems` table (title, description, category union ["project"|"certification"|"publication"], coverEmoji?, coverGradient?, coverStorageId?, link?, techStack?, date, featured) with `by_user`, `by_user_category`, `by_user_featured` indexes.

**Convex api.d.ts:** add `portfolio`.

**npm deps:** `react-easy-crop` (from file-upload).

**Nav:** `portfolio` slug in MORE_APPS.

**i18n:** category labels ("Project", "Sertifikasi", "Publikasi"), cover emoji set, "Jadikan unggulan".

**Pattern:** cover image takes priority; falls back to emoji+gradient. See `listPortfolio` inline URL resolution.

See `file-upload.md` + `_porting-guide.md`.
