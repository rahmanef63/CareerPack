# Library (Content Library)

> **Portability tier:** M — slice + file-upload infrastructure.

## Tujuan

Pusat media: semua gambar dan dokumen yang user unggah, siap dipakai
ulang di portfolio, CV, dan personal branding. Lihat semua file,
filter berdasarkan tipe, tag, atau search; edit metadata (nama, note,
tag); usage indicator menunjukkan berapa entitas yang merujuk file
sebelum delete.

## Route & Entry

- URL: `/dashboard/library`
- Slice: `frontend/src/slices/library/`
- Komponen utama: `LibraryView.tsx`

## Struktur Slice

```
library/
├─ index.ts                                    export { LibraryView }
├─ components/
│  ├─ LibraryView.tsx                          Orchestrator: state + dialog plumbing
│  └─ library-view/
│     ├─ LibraryToolbar.tsx                    Search + kind filter + tag chip + stats
│     ├─ LibraryGrid.tsx                       Card grid + skeleton + empty state
│     └─ EditMetadataDialog.tsx                Edit fileName, note, tags
└─ types/file.ts                               LibraryFile, KindFilter
```

## Data Flow

Backend: `convex/files/`.

| Hook / op | Convex | Purpose |
|---|---|---|
| `useQuery(api.files.queries.listMyFiles)` | list user's files | name, type, size, tags, note, usedIn[] |
| `useMutation(api.files.mutations.updateFileMetadata)` | rename / re-tag / annotate | partial patch |
| `useMutation(api.files.mutations.deleteFile)` | delete blob + row | warns if `usedIn.length > 0` |
| `<FileUpload>` from `@/shared/components/files/FileUpload` | upload entry | drives `generateUploadUrl` + `saveFile` |

`usedIn[]` field di setiap file dihitung server-side dengan scan
referensi (mis. portfolio item yang `coverStorageId === file.storageId`).
Result di-pakai LibraryView untuk warning sebelum delete.

## State Lokal

- `search: string`
- `kind: "all" | "image" | "pdf"`
- `activeTag: string | null`
- `editFile: LibraryFile | null`
- `confirmDelete: LibraryFile | null`
- `showUpload: boolean` — controls upload dialog
- Memoized `allTags`, `filtered`, `stats` (total count, total bytes, used count).

## Dependensi

- `@/shared/components/files/FileUpload` — drag-drop + crop + upload pipeline.
- `@/shared/components/layout/PageContainer`.
- `@/shared/components/ui/responsive-page-header`, `responsive-dialog`, `responsive-alert-dialog`, `button`, `input`, `label`, `textarea`, `badge`, `skeleton`.
- `@/shared/components/ui/responsive-select` (kind filter).
- `@/shared/lib/notify`, `@/shared/lib/utils`.
- `convex/react` — `useQuery`, `useMutation`.
- `lucide-react`.

## Catatan Desain

- **Library = thin layer atas `files` table.** Tidak punya schema sendiri; bergantung pada `convex/files/` (porting library tanpa file-upload tidak mungkin).
- **Tag list derived.** `allTags` dihitung client-side dari union of all tags — tidak ada tabel `tags` terpisah.
- **Usage warning sebelum delete.** Kalau `usedIn.length > 0`, dialog menyebut nama entitas yang merujuk. User tetap bisa lanjut, tapi tahu reference akan rusak.
- **Upload dialog separate.** Tidak inline di toolbar — `<FileUpload>` di dalam `<ResponsiveDialog>` agar konversi/crop UI punya space.
- **`KindFilter` literal union** ("all" / "image" / "pdf") match strict server whitelist (`image/webp`, `application/pdf`).

## Extending

- Multi-select + bulk delete + bulk re-tag.
- Folder/album nesting (tag-based hierarchy).
- Image preview lightbox (sekarang masih card thumb).
- Per-file `share` link (publik via signed URL).

---

## Portabilitas

**Tier:** M

**Prereq:** port `file-upload.md` first — Library cannot exist without `convex/files/` + shared upload pipeline.

**Files untuk dicopy:**

```
# Slice
frontend/src/slices/library/

# Shared (already required by file-upload.md)
frontend/src/shared/components/files/FileUpload.tsx
frontend/src/shared/hooks/useFileUpload.ts
frontend/src/shared/lib/imageConvert.ts

# Backend
convex/files/                                            # already from file-upload.md
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

mkdir -p "$DST/frontend/src/slices"
cp -r "$SRC/frontend/src/slices/library" "$DST/frontend/src/slices/"
# (FileUpload + convex/files/ assumed already ported per file-upload.md)
```

**Schema additions** — extend the `files` table from `file-upload.md` with the metadata columns Library needs:

```ts
files: defineTable({
  storageId: v.string(),
  fileName: v.string(),
  fileType: v.string(),
  fileSize: v.number(),
  uploadedBy: v.id("users"),
  tenantId: v.string(),
  tags: v.optional(v.array(v.string())),
  note: v.optional(v.string()),
  createdAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_user", ["uploadedBy"])
  .index("by_storage", ["storageId"]),
```

`updateFileMetadata` mutation accepts patches for `fileName`, `tags`,
`note`. `usedIn[]` is computed server-side (not stored).

**Convex api.d.ts:** `files` (already from file-upload).

**npm deps:** `react-easy-crop` (transitive via `<FileUpload>`).

**Env vars:** none.

**Nav registration:**

`dashboardRoutes.tsx`:
```ts
const LIBRARY: View = dynamic(
  () => import("@/slices/library").then((m) => m.LibraryView),
  { loading: loadingFallback },
);
DASHBOARD_VIEWS["library"] = LIBRARY;
```

`navConfig.ts`:
```ts
{ id: "library", label: "Library", icon: FolderOpen, href: "/dashboard/library", hue: "from-amber-400 to-orange-600" }
```

**i18n:** Indonesian — page header, toolbar labels ("Filter tipe",
"Tag aktif"), dialog text ("Hapus file?", "Masih dipakai oleh: …"),
toast strings.

**Common breakage:**

- **`usedIn[]` always empty** → server-side scan in `listMyFiles` not implemented for target's domains. Add lookup in `convex/files/queries.ts → listMyFiles` for each domain that pins storageIds (portfolio, cv profile avatar, etc.).
- **`deleteFile` orphan blob** — DB row first, blob second; if storage delete fails, blob orphans. Acceptable; sweep later.
- **`updateFileMetadata` missing** — port from `convex/files/mutations.ts` (Library doc adds this on top of bare file-upload module).
- **`ResponsiveAlertDialog` missing** in target shadcn → swap to stock `<AlertDialog>` set.

**Testing:**

1. Upload an image → appears in grid; stats reflect new count + bytes.
2. Click pencil icon → edit dialog → set tags `[hero, brand]` → save → tag chips appear; appear in toolbar tag list.
3. Filter by tag chip → grid narrows.
4. Delete a file referenced by portfolio → warning lists portfolio item; confirm → file gone, portfolio cover broken (expected).
5. Search "logo" → matches fileName / note / tag substrings.

Run `_porting-guide.md` §9 checklist.
