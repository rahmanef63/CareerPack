# File Upload (Infrastructure)

> **Portability tier:** XL — not a slice, cross-cutting platform asset. Consumed by `settings`, `cv-generator`, `portfolio`, and any future feature that uploads media.

## Tujuan

Client-side image→WebP conversion + Canvas-based crop + Convex blob
storage upload + tenant-scoped access control, all as a reusable
hook + drop-zone component.

## What it provides

| Asset | Type | Purpose |
|---|---|---|
| `useFileUpload()` | React hook | Validate → convert → XHR upload → return storageId |
| `<FileUpload>` | React component | Drag-drop zone + optional crop dialog + progress bar |
| `convertImageToWebP()` | Pure fn | Canvas re-encode (quality 0.9, EXIF strip, original resolution) |
| `applyCropToImage()` | Pure fn | Canvas source-rect crop + re-encode |
| `describeConversion()` | Pure fn | "3,4 MB → 1,1 MB (−68%)" formatter |
| `files` table + `convex/files/` | Convex backend | Tenant-scoped metadata + enumeration-safe getFileUrl. Module is a folder (`schema.ts`, `queries.ts`, `mutations.ts`) — paths: `api.files.queries.{getFileUrl,listMyFiles}` and `api.files.mutations.{generateUploadUrl,saveFile,updateFileMetadata,deleteFile}` |

## Data Flow

```
User picks file
  ↓
validateFile()                  client MIME + size check
  ↓
convertImageToWebP() (if image) Canvas re-encode, EXIF stripped
  ↓
generateUploadUrl() mutation    auth-gated, returns tokenized URL
  ↓
xhrUpload(url, file)            XHR POST with upload.onprogress
  ↓
saveFile() mutation             persist metadata, server-derived tenantId
  ↓
{ storageId, fileId }           caller stores storageId on their record
```

Read path:
```
api.files.queries.getFileUrl({ storageId })
  ↓
requireUser + tenant match check
  ↓
ctx.storage.getUrl(storageId) OR null  (enumeration-safe)
```

## Catatan Desain

- **Whitelist strict on server:** `image/webp` + `application/pdf`
  only. Raw JPEG arriving at `saveFile` = client bypassed the
  converter; rejected. Single-path enforcement.
- **Client converts even pre-existing WebP** — strips EXIF from
  phone-exported WebP that may contain GPS metadata. Small CPU cost,
  big privacy win.
- **tenantId = userId.toString()** today. The string column (not
  `v.id("users")`) leaves room for real multi-tenant (orgs,
  workspaces) later without migration.
- **Upload POST uses XHR**, not fetch — fetch Response doesn't expose
  request-body progress. XHR's `upload.onprogress` drives the %
  indicator.
- **Delete order:** DB row first, storage blob second. Orphan blob is
  benign; dead metadata breaks `getFileUrl`.
- **Crop uses react-easy-crop** (14 kB gz, MIT). Rolling own would be
  ~200 lines of touch-event handling. Only consumer slices pay the
  bundle cost (dynamic import via `<FileUpload>`).

## Extending

- **Multi-file queue** — `<FileUpload multiple>` — batch upload with
  per-file progress. Deferred; no concrete consumer.
- **Cleanup job** — orphan-blob sweep (no DB row pointing at it).
  Acceptable to defer until storage usage warrants.
- **Image dimension cap** — `maxDimension` downscale before encode.
  Not needed yet.
- **Video/audio** — Convex blob store isn't streaming-optimized.
  Use a dedicated media service (Cloudflare Stream, Mux) if needed.

---

## Portabilitas

**Tier:** XL

**Files untuk dicopy (6 files):**

```
# Backend (folder, not flat file)
convex/files/                                              # schema.ts + queries.ts + mutations.ts
# Functions: api.files.queries.{getFileUrl, listMyFiles}
#            api.files.mutations.{generateUploadUrl, saveFile, updateFileMetadata, deleteFile}
# (also add `files` table to target's convex/schema.ts — see below)

# Pure utilities (no React)
frontend/src/shared/lib/imageConvert.ts                     # Canvas WebP + crop pipeline

# React hook
frontend/src/shared/hooks/useFileUpload.ts                  # Validate → convert → XHR upload

# React component
frontend/src/shared/components/files/FileUpload.tsx         # Drag-drop + crop dialog + progress
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

mkdir -p "$DST/frontend/src/shared/lib"
mkdir -p "$DST/frontend/src/shared/hooks"
mkdir -p "$DST/frontend/src/shared/components/files"

cp -r "$SRC/convex/files/"                                 "$DST/convex/"
cp "$SRC/frontend/src/shared/lib/imageConvert.ts"            "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/hooks/useFileUpload.ts"         "$DST/frontend/src/shared/hooks/"
cp "$SRC/frontend/src/shared/components/files/FileUpload.tsx" "$DST/frontend/src/shared/components/files/"
```

**Schema additions** — append to target's `convex/schema.ts` inside
`applicationTables`:

```ts
files: defineTable({
  storageId: v.string(),
  fileName: v.string(),
  fileType: v.string(),
  fileSize: v.number(),
  uploadedBy: v.id("users"),
  tenantId: v.string(),
  createdAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_user", ["uploadedBy"])
  .index("by_storage", ["storageId"]),
```

**Convex api.d.ts** — add:

```ts
import type * as files_mutations from "../files/mutations.js";
import type * as files_queries from "../files/queries.js";
// …inside fullApi (Convex auto-derives once you run `convex dev` — but if you're
// hand-editing api.d.ts):
files: { mutations: typeof files_mutations; queries: typeof files_queries; };
```

**npm deps:**

```bash
pnpm -F frontend add react-easy-crop   # ~14 kB gz, MIT, touch+mouse crop
```

Everything else (`convex`, `sonner`, `lucide-react`, `next/image`) is
already part of the baseline (see `_porting-guide.md` §0).

**Env vars** — none required. Convex self-hosted storage is built-in.

**Shared hook dependency** — `shared/components/ui/slider.tsx` +
`responsive-dialog.tsx` (shadcn). If target doesn't have them:

```bash
pnpm dlx shadcn@latest add slider dialog
```

`ResponsiveDialog` is a CareerPack-specific wrapper over `Dialog` +
`Drawer` (mobile). If the target has only stock shadcn, swap
`ResponsiveDialog*` → `Dialog*` in `FileUpload.tsx`.

**Consumer integration example:**

```tsx
// In any slice
import { FileUpload } from "@/shared/components/files/FileUpload";

<FileUpload
  label="Foto profil"
  crop={{ aspect: 1 }}
  onUploaded={async ({ storageId }) => {
    await saveAvatarMutation({ storageId });
  }}
/>

// Rendering back
import { useQuery } from "convex/react";
const url = useQuery(api.files.queries.getFileUrl, { storageId });
{url && <Image src={url} alt="" width={200} height={200} unoptimized />}
```

**Common breakage after port:**

- **WebP not supported** — target browser matrix older than Chrome 32
  / Safari 16. Add a fallback MIME (e.g. JPEG 0.9) — rare in 2026.
- **`tenantId` mismatch on rename** — if the target uses a different
  identity model (not Convex auth userId), update the tenantId
  derivation in `saveFile.handler`.
- **CORS on upload URL** — Convex-minted upload URLs are same-origin
  to the Convex deployment. If you've added a reverse proxy, ensure
  it forwards the upload POST without stripping Content-Type.
- **Shadcn ResponsiveDialog missing** — replace with stock
  `<Dialog>` + `<DialogContent>` + … in `FileUpload.tsx`. 5-line
  find-and-replace.

**Testing the port:**

1. Upload a JPEG > 2 MB → see "Asli X MB → WebP Y MB (−Z%)" toast
2. Upload a file > 10 MB → see "Gambar terlalu besar untuk
   dikonversi (maks 10 MB)" error
3. Upload a PDF → passes through unchanged
4. Upload with `crop={{ aspect: 1 }}` → dialog opens, zoom slider
   works, confirm → cropped WebP stored
5. As a different user, call `getFileUrl` with a neighbour's
   storageId → returns `null` (tenant isolation works)

Run `_porting-guide.md` §9 checklist.
