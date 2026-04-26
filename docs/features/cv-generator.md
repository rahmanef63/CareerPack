# CV Generator

> **Portability tier:** L — slice + 2 shared components + 1 Convex module + schema table + external PDF libs

## Tujuan

Editor CV terstruktur (ATS-friendly) dengan preview live, scoring,
AI suggestion per section, export PDF, dan inline checklist dokumen.
Format support: `national` (Indonesia, dengan foto formal 4:6) vs
`international` (text-only, ATS).

## Route & Entry

- URL: `/dashboard/cv`
- Slice: `frontend/src/slices/cv-generator/`
- Main component: `CVGenerator.tsx` (~1000 baris — the big one)

## Struktur Slice

```
cv-generator/
├─ index.ts
├─ components/
│  ├─ CVGenerator.tsx         Editor + preview + export
│  ├─ CVScoreBadge.tsx        Scoring heuristik (computeScore)
│  ├─ DocChecklistInline.tsx  Inline checklist (ringkas dari doc-checklist slice)
│  └─ InlineAISuggestChip.tsx AI suggest trigger per section
├─ hooks/
│  ├─ useCV.ts                Convex CRUD + konversi schema↔CVData
│  └─ useCVAIActions.ts       Trigger AI action via bus
├─ constants/index.ts         `initialCVData`, `CVFormat`
└─ types/index.ts             CVData, Education, Experience, Skill, Certification, Project, UserProfile
```

## Data Flow

Backend: tabel `cvs` via `convex/cv/`.

| Hook / method | Convex op | Purpose |
|---|---|---|
| `useCV.cvData` | `api.cv.queries.getUserCVs` | Fetch first CV (multi-CV belum exposed UI) |
| `useCV.saveCV` | `api.cv.mutations.createCV` / `updateCV` | Upsert — auto-create kalau belum ada |

Schema roundtrip: frontend `CVData` ↔ Convex `Doc<"cvs">`. Konversi handle:
- `SkillCategory` validation → `"technical" | "soft" | "language" | "tool"` (fallback `technical`)
- `ProficiencyLevel` clamp 1–5
- `personalInfo.avatarStorageId` — optional foto formal (WebP via `files` table)

AI: `useCVAIActions` publish ke `aiActionBus` (mis. "improve bullet",
"suggest skill") — konsumer = AI agent console yang process via
OpenAI action.

## State Lokal

- `cvData` + `isDataLoaded` — form master (sync dari remote)
- `isSaving`, `format` ("national" | "international")
- `avatarStorageId` on cvData.profile — foto persistance
- `previewOpen`, `activeSection` — UI state untuk accordion + dialog preview
- Drag-reorder state: `expDrag`, `skillDrag` via `useDragReorder` dari `MicroInteractions`

## Dependensi

- `@/shared/components/files/FileUpload` — foto formal (crop 4:6)
- `@/shared/components/interactions/MicroInteractions` — `MagneticTabs`, `SwipeToDelete`, `useDragReorder`, `AnimatedProgress`
- `@/shared/hooks/useAuth` (transitive via `useCV`)
- shadcn: `button`, `input`, `label`, `textarea`, `card`, `badge`, `responsive-dialog`
- `sonner` toast
- `html2pdf.js`, `jspdf`, `html2canvas` — PDF export (dynamic import, dibundle hanya saat click)

## Catatan Desain

- Satu user = satu CV aktif di UI. Schema dukung multi-CV (`isDefault`), tapi belum ada selector.
- Export PDF lewat `html2pdf.js` (dynamic import di click handler → tidak bloat initial bundle). Tombol "Ekspor PDF" ada di preview Dialog + sidebar ("Unduh PDF"). Output text-selectable (html2canvas → jsPDF). Ctrl+P native browser tetap support.
- Score dihitung client-side di `CVScoreBadge.computeScore(cvData)` — heuristik ringan (completeness, keyword, length). Tidak panggil AI.
- Foto formal disimpan sebagai `storageId`, resolver URL via `api.files.queries.getFileUrl` (re-query on render). Crop lock 4:6 match rasio foto KTP Indonesia.

## Extending

- Multi-CV picker: tambah selector UI → update `useCV` untuk switch `activeCVId`.
- Template variant (modern/classic) → tambah `CVFormat` values + kondisikan rendering preview.
- Server-side Puppeteer export untuk konsistensi cross-browser (current client-only).

---

## Portabilitas

**Tier:** L

**Files untuk dicopy:**

```
# Slice (fully self-contained within the folder)
frontend/src/slices/cv-generator/

# Shared deps
frontend/src/shared/components/interactions/MicroInteractions.tsx    # drag-reorder, tabs, etc.
frontend/src/shared/components/files/FileUpload.tsx                   # foto formal
frontend/src/shared/hooks/useFileUpload.ts                            # uploader hook
frontend/src/shared/lib/imageConvert.ts                               # WebP + crop pipeline

# Backend
convex/cv/                                                          # CV CRUD
convex/files/                                                       # if foto feature wanted
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

# Slice
mkdir -p "$DST/frontend/src/slices"
cp -r "$SRC/frontend/src/slices/cv-generator" "$DST/frontend/src/slices/"

# Shared deps
mkdir -p "$DST/frontend/src/shared/components/interactions"
mkdir -p "$DST/frontend/src/shared/components/files"
mkdir -p "$DST/frontend/src/shared/hooks"
mkdir -p "$DST/frontend/src/shared/lib"

cp "$SRC/frontend/src/shared/components/interactions/MicroInteractions.tsx" "$DST/frontend/src/shared/components/interactions/"
cp "$SRC/frontend/src/shared/components/files/FileUpload.tsx"               "$DST/frontend/src/shared/components/files/"
cp "$SRC/frontend/src/shared/hooks/useFileUpload.ts"                        "$DST/frontend/src/shared/hooks/"
cp "$SRC/frontend/src/shared/lib/imageConvert.ts"                           "$DST/frontend/src/shared/lib/"

# Backend
cp "$SRC/convex/cv/"    "$DST/convex/"
cp "$SRC/convex/files/" "$DST/convex/"
```

**Schema additions** — append to target's `convex/schema.ts`:

```ts
cvs: defineTable({
  userId: v.id("users"),
  title: v.string(),
  template: v.string(),
  personalInfo: v.object({
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    location: v.string(),
    linkedin: v.optional(v.string()),
    portfolio: v.optional(v.string()),
    summary: v.string(),
    avatarStorageId: v.optional(v.string()),
  }),
  experience: v.array(v.object({
    id: v.string(),
    company: v.string(),
    position: v.string(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    current: v.boolean(),
    description: v.string(),
    achievements: v.array(v.string()),
  })),
  education: v.array(v.object({
    id: v.string(),
    institution: v.string(),
    degree: v.string(),
    field: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    gpa: v.optional(v.string()),
  })),
  skills: v.array(v.object({
    id: v.string(),
    name: v.string(),
    category: v.string(),
    proficiency: v.number(),
  })),
  certifications: v.array(v.object({ /* …see cvs schema in CareerPack */ })),
  languages: v.array(v.object({ language: v.string(), proficiency: v.string() })),
  projects: v.array(v.object({ /* …see cvs schema */ })),
  isDefault: v.boolean(),
}).index("by_user", ["userId"]),

// Plus `files` table (see file-upload.md)
```

**Convex api.d.ts** — add `cv` + `files` imports + typeof aliases
(see `_porting-guide.md` §2).

**npm deps:**

```bash
pnpm -F frontend add html2pdf.js jspdf html2canvas react-easy-crop
```

**Env vars** — none specific; Convex baseline only.

**Nav registration** — `dashboardRoutes.tsx` + `navConfig.ts` (see
`_porting-guide.md` §4). Slug `cv`.

**i18n** — Indonesian copy in `CVGenerator.tsx`. Notable strings:
"Informasi Pribadi", "Pengalaman Kerja", "Unggah Foto", "Ekspor PDF",
"Nasional" / "Internasional", experience level labels.

**Common breakage after port:**

- **`MicroInteractions.tsx` dependencies** — imports `framer-motion`
  and custom Tailwind utilities. Install `framer-motion`, and skim
  the file for any `bg-brand` / `text-foreground` references that
  need the theme tokens.
- **PDF export shows wrong fonts** — `html2pdf.js` doesn't inline
  custom webfonts. If target has custom fonts, ensure `@font-face`
  is in a stylesheet loaded before the export handler runs.
- **foto formal doesn't persist** — make sure `files.ts` ported and
  `personalInfo.avatarStorageId` added to `cvs` schema.
- **Score stuck at 0** — `CVScoreBadge.computeScore` uses heuristics
  tuned for Indonesian market (keyword set). Adjust `KEYWORD_HINTS`
  in `CVScoreBadge.tsx` for target locale.

**Testing the port:**

1. Navigate `/dashboard/cv` → editor renders
2. Type fullName → Convex mutation fires within 1s (check devtools)
3. Toggle format to "national" → FileUpload appears
4. Upload photo → appears in preview + persists across reload
5. Click "Ekspor PDF" → downloads `.pdf` with content
6. Drag-reorder experience items → order persists after save

Run `_porting-guide.md` §9 checklist.
