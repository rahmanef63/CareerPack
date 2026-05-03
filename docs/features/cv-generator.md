# CV Generator

> **Portability tier:** L — slice + 4+ shared deps + 1 Convex module
> + schema table + manifest/binder wiring + external PDF libs

## Tujuan

Editor CV terstruktur (ATS-friendly) dengan preview live, scoring,
AI suggestion per section, AI translate (id ↔ en ↔ …), export PDF,
inline checklist dokumen, dan template picker (modern / classic /
minimal). Format support: `national` (Indonesia, dengan foto formal
4:6) vs `international` (text-only ATS).

CRUD penuh exposed via AI agent (skill `cv.list`, `cv.create`,
`cv.add-experience`, `cv.add-skills`, `cv.update-summary`,
`cv.delete`, `cv.import-from-text`).

## Route & Entry

- URL: `/dashboard/cv`
- Slice: `frontend/src/slices/cv-generator/`
- Komponen utama: `CVGenerator.tsx`
- Lazy-loaded via `manifest.route.component`.

## Struktur Slice

```
cv-generator/
├─ index.ts                                   barrel: CVGenerator, CVCapabilities, manifest, types
├─ manifest.ts                                SliceManifest + 7 skills (CRUD + import-from-text)
├─ components/
│  ├─ CVGenerator.tsx                         page shell — sections orchestrator
│  ├─ CVCapabilities.tsx                      binder: subscribe aiActionBus → run mutations + actions
│  ├─ CVScoreBadge.tsx                        score heuristik (computeScore)
│  ├─ DocChecklistInline.tsx                  inline checklist (ringkas dari doc-checklist slice)
│  ├─ InlineAISuggestChip.tsx                 AI suggest trigger per section
│  ├─ cv-generator/
│  │  ├─ CVPreviewDialog.tsx                  full-screen preview + export
│  │  ├─ PreviewSidebar.tsx                   right-rail mini-preview
│  │  ├─ SectionCard.tsx                      collapsible section wrapper
│  │  ├─ TemplatePicker.tsx                   template chooser (modern/classic/minimal)
│  │  ├─ exportPDF.ts                         html2pdf dynamic import + render pipeline
│  │  └─ sections/
│  │     ├─ PersonalInfoSection.tsx           name/email/phone/avatar/summary
│  │     ├─ ExperienceSection.tsx             experience CRUD + drag-reorder
│  │     ├─ EducationSection.tsx              education CRUD
│  │     ├─ SkillsSection.tsx                 skill CRUD + category + proficiency
│  │     ├─ ProjectsSection.tsx               project CRUD
│  │     ├─ CertificationsSection.tsx         certifications CRUD
│  │     └─ DisplayPrefsSection.tsx           toggles (showPicture, showAge, …)
│  └─ templates/
│     ├─ CVTemplateRenderer.tsx               template dispatcher (modern/classic/minimal)
│     ├─ CVTemplateModern.tsx                 layout: modern
│     ├─ CVTemplateClassic.tsx                layout: classic
│     ├─ CVTemplateMinimal.tsx                layout: minimal
│     └─ ScaledCVPreview.tsx                  CSS-transform preview wrapper
├─ constants/
│  └─ index.ts                                initialCVData, CVFormat
├─ hooks/
│  ├─ useCV.ts                                Convex CRUD + schema↔CVData converter
│  ├─ useCVAIActions.ts                       publish to aiActionBus
│  ├─ useCVHandlers.ts                        section CRUD callbacks (add/remove/reorder)
│  └─ useCVTranslate.ts                       AI translate action wrapper
├─ utils/
│  └─ format.ts                               date/text formatting helpers
└─ types/
   └─ index.ts                                CVData, Education, Experience, Skill, Certification, Project, UserProfile
```

## Data Flow

Backend: tabel `cvs` di `convex/cv/`.

| Hook / call | Convex op | Purpose |
|---|---|---|
| `useCV.cvData` | `api.cv.queries.getUserCVs` | List user's CVs (UI menggunakan first / default) |
| `useCV.saveCV` | `api.cv.mutations.createCV` / `updateCV` | Upsert — auto-create kalau belum ada |
| `useCV.deleteCV` | `api.cv.mutations.deleteCV` | Hapus CV (cascade ATS scans) |
| `useCV.addExperience` | `api.cv.mutations.addExperience` | Append experience entry |
| `useCV.addSkills` | `api.cv.mutations.addSkills` | Append skills (case-insensitive dedupe) |
| `useCV.updateSummary` | `api.cv.mutations.updateSummary` | Patch personalInfo.summary |
| `useCVTranslate` | `api.cv.actions.translate` | AI translate full CV to target locale |
| `useCVAIActions` | publish to `aiActionBus` | Trigger AI suggest/improve flows |

Skill server-side `cv.list` di `convex/ai/skillHandlers.ts` (top 20,
trim noise — title/template/isDefault/summary/counts only). Skill
mutation/compose dieksekusi oleh `CVCapabilities` setelah user
approve. `cv.import-from-text` calls `useAction` (parser AI) +
chained mutations (profile + cv + portfolio + goals + applications +
contacts hydrate).

Schema roundtrip frontend `CVData` ↔ Convex `Doc<"cvs">`. Konversi
handle:
- `SkillCategory` validation → `"technical" | "soft" | "language" | "tool"`
- `ProficiencyLevel` clamp 1–5
- `personalInfo.avatarStorageId` — optional foto formal (WebP via
  `files` table) + optional `dateOfBirth` + `displayPrefs` (showPicture,
  showAge, showGraduationYear, templateId)

## State Lokal

- `cvData` + `isDataLoaded` — form master (sync dari remote)
- `isSaving`, `format` ("national" | "international")
- `avatarStorageId` on cvData.personalInfo — foto persistance
- `previewOpen`, `activeSection` — UI state untuk accordion + dialog
- Drag-reorder state via `useDragReorder` dari `MicroInteractions`
- `displayPrefs` toggles (showPicture, showAge, showGraduationYear)

## Dependensi

- `@/shared/components/files/FileUpload` — foto formal (crop 4:6)
- `@/shared/components/interactions/MicroInteractions` —
  `MagneticTabs`, `SwipeToDelete`, `useDragReorder`,
  `AnimatedProgress`
- `@/shared/components/stats/ProgressWalker` — progress visualizer
- `@/shared/components/ui/responsive-carousel`
- `@/shared/components/ui/responsive-dialog`
- `@/shared/components/ui/responsive-select`
- `@/shared/components/ui/dropdown-menu`
- shadcn primitives: `button`, `input`, `label`, `textarea`, `card`,
  `badge`, `checkbox`, `switch`
- `@/shared/hooks/useAuth` (transitive via `useCV`)
- `@/shared/lib/notify` — toast wrapper
- `@/shared/lib/utils` — `cn`
- `@/shared/lib/aiActionBus` — `subscribe` (binder)
- `@/shared/types/sliceManifest`
- npm: `html2pdf.js`, `jspdf`, `html2canvas` — PDF export (dynamic
  import; loaded only on click)
- npm: `react-easy-crop` — transitively via `FileUpload` for avatar
  cropping

## Catatan Desain

- Schema dukung multi-CV (`isDefault`); UI sekarang menampilkan first
  CV. AI agent `cv.list` returns full array → `cv.add-*` mutations
  accept optional `cvId` (default = first).
- Export PDF lewat `html2pdf.js` dynamic import di click handler
  (`exportPDF.ts`) → tidak bloat initial bundle. Output text-selectable
  (html2canvas → jsPDF). Ctrl+P native juga supported.
- Template renderer (`CVTemplateRenderer`) is the dispatcher; new
  template = add another `CVTemplate*.tsx` + entry in renderer's
  switch.
- Score di-compute client-side (`CVScoreBadge.computeScore`) —
  heuristik ringan (completeness, keyword, length). Tidak panggil AI.
- Foto formal disimpan sebagai `storageId`, resolve URL via
  `api.files.queries.getFileUrl` (re-query on render). Crop lock 4:6
  match rasio foto KTP Indonesia.
- `cv.import-from-text` skill is the agent-facing wrapper around the
  "Isi Cepat dengan AI" flow — paste raw resume → parser action →
  hydrates 6 entities (profile + cv + portfolio + goals + applications
  + contacts) in one batch.

## Extending

- Multi-CV picker UI: tambah selector → switch `activeCVId`.
- Server-side Puppeteer export untuk konsistensi cross-browser.
- New template variant (sidebar-modern, two-column-classic) → add
  `CVTemplate*.tsx` + entry in `CVTemplateRenderer`.

---

## Portabilitas

**Tier:** L

**Files untuk dicopy:**

```
# Slice itself (fully self-contained within the folder)
frontend/src/slices/cv-generator/

# Shared deps
frontend/src/shared/components/interactions/MicroInteractions.tsx
frontend/src/shared/components/files/FileUpload.tsx
frontend/src/shared/components/stats/ProgressWalker.tsx
frontend/src/shared/components/ui/responsive-carousel.tsx
frontend/src/shared/components/ui/responsive-dialog.tsx
frontend/src/shared/components/ui/responsive-select.tsx
frontend/src/shared/components/ui/dropdown-menu.tsx
frontend/src/shared/hooks/useFileUpload.ts
frontend/src/shared/lib/imageConvert.ts
frontend/src/shared/lib/notify.ts
frontend/src/shared/lib/aiActionBus.ts                # if not yet present
frontend/src/shared/types/sliceManifest.ts            # if not yet present

# Backend
convex/cv/                                            # actions.ts (translate), mutations.ts, queries.ts, schema.ts
convex/files/                                         # for foto feature
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
mkdir -p "$DST/frontend/src/shared/components/stats"
mkdir -p "$DST/frontend/src/shared/components/ui"
mkdir -p "$DST/frontend/src/shared/hooks"
mkdir -p "$DST/frontend/src/shared/lib"
mkdir -p "$DST/frontend/src/shared/types"

cp "$SRC/frontend/src/shared/components/interactions/MicroInteractions.tsx" "$DST/frontend/src/shared/components/interactions/"
cp "$SRC/frontend/src/shared/components/files/FileUpload.tsx"               "$DST/frontend/src/shared/components/files/"
cp "$SRC/frontend/src/shared/components/stats/ProgressWalker.tsx"           "$DST/frontend/src/shared/components/stats/"
cp "$SRC/frontend/src/shared/components/ui/responsive-carousel.tsx"         "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-dialog.tsx"           "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-select.tsx"           "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/dropdown-menu.tsx"               "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/hooks/useFileUpload.ts"                        "$DST/frontend/src/shared/hooks/"
cp "$SRC/frontend/src/shared/lib/imageConvert.ts"                           "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/lib/notify.ts"                                 "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/lib/aiActionBus.ts"                            "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/types/sliceManifest.ts"                        "$DST/frontend/src/shared/types/"

# Backend
cp -r "$SRC/convex/cv"    "$DST/convex/"
cp -r "$SRC/convex/files" "$DST/convex/"
```

**Schema additions** — append to target's `convex/schema.ts` (copy
exactly from `convex/cv/schema.ts`):

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
    dateOfBirth: v.optional(v.string()),
  }),
  displayPrefs: v.optional(v.object({
    showPicture: v.optional(v.boolean()),
    showAge: v.optional(v.boolean()),
    showGraduationYear: v.optional(v.boolean()),
    templateId: v.optional(v.string()),
  })),
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
    id: v.string(), institution: v.string(), degree: v.string(),
    field: v.string(), startDate: v.string(), endDate: v.string(),
    gpa: v.optional(v.string()),
  })),
  skills: v.array(v.object({
    id: v.string(), name: v.string(), category: v.string(),
    proficiency: v.number(),
  })),
  certifications: v.array(v.object({
    id: v.string(), name: v.string(), issuer: v.string(),
    date: v.string(), expiryDate: v.optional(v.string()),
  })),
  languages: v.array(v.object({
    language: v.string(), proficiency: v.string(),
  })),
  projects: v.array(v.object({
    id: v.string(), name: v.string(), description: v.string(),
    technologies: v.array(v.string()), link: v.optional(v.string()),
  })),
  isDefault: v.boolean(),
}).index("by_user", ["userId"]),

// Plus `files` table (see file-upload.md)
```

**Convex `api.d.ts`** — add `cv: typeof cv` + `files: typeof files`
imports + typeof aliases.

**npm deps:**

```bash
pnpm -F frontend add html2pdf.js jspdf html2canvas react-easy-crop
```

**Manifest + binder wiring:**

1. `frontend/src/shared/lib/sliceRegistry.ts`:
   ```ts
   import { cvGeneratorManifest } from "@/slices/cv-generator";
   export const SLICE_REGISTRY = [/* …, */ cvGeneratorManifest];
   ```
2. `frontend/src/shared/providers/Providers.tsx`:
   ```ts
   import { CVCapabilities } from "@/slices/cv-generator";
   <CVCapabilities />
   ```
3. `convex/_seeds/aiDefaults.ts` `DEFAULT_AI_TOOLS` — append the
   cv-generator block (`cv.list`, `cv.create`, `cv.add-experience`,
   `cv.add-skills`, `cv.update-summary`, `cv.delete`,
   `cv.import-from-text` — copy verbatim from CareerPack). Legacy
   `cv.fillExperience` / `cv.improveSummary` / `cv.addSkills` /
   `cv.setFormat` entries mirror older AgentAction types — keep
   them if the target's chat console still expects them.
4. `convex/ai/skillHandlers.ts`:
   ```ts
   "cv.list": async (ctx) => {
     const cvs = await ctx.runQuery(api.cv.queries.getUserCVs, {});
     return cvs.slice(0, 20).map((c) => ({
       cvId: c._id, title: c.title, template: c.template,
       isDefault: Boolean(c.isDefault),
       summary: c.personalInfo?.summary ?? "",
       experienceCount: c.experience?.length ?? 0,
       skillsCount: c.skills?.length ?? 0,
       educationCount: c.education?.length ?? 0,
     }));
   },
   ```

**Nav registration** — manifest-driven (slug `cv`, placement
`primary`, order 20). Legacy fallback: edit
`navConfig.ts` + `dashboardRoutes.tsx`.

**Env vars** — none specific beyond Convex baseline + AI
(`CONVEX_OPENAI_API_KEY` / `CONVEX_OPENAI_BASE_URL` for `translate`
action and `cv.import-from-text` parser).

**i18n** — Indonesian copy in `CVGenerator.tsx` and section files.
Notable strings: "Informasi Pribadi", "Pengalaman Kerja",
"Unggah Foto", "Ekspor PDF", "Nasional" / "Internasional",
experience-level labels, template names.

**Common breakage after port:**

- **`MicroInteractions.tsx` dependencies** — imports `framer-motion`
  and custom Tailwind utilities. Install `framer-motion`, skim file
  for `bg-brand` / `text-foreground` references that need OKLCH
  theme tokens.
- **PDF export shows wrong fonts** — `html2pdf.js` doesn't inline
  custom webfonts. If target has custom fonts, ensure `@font-face`
  is in a stylesheet loaded before `exportPDF.ts` runs.
- **Foto formal doesn't persist** — make sure `convex/files/` ported
  AND `personalInfo.avatarStorageId` field added to `cvs` schema.
- **Score stuck at 0** — `CVScoreBadge.computeScore` heuristics
  tuned for Indonesian market keyword set; adjust `KEYWORD_HINTS`
  for target locale.
- **Template renderer crash** — `displayPrefs.templateId` value
  must match a key in `CVTemplateRenderer`'s switch (`modern` /
  `classic` / `minimal`). Stale value from prior data → fallback
  to `modern` in code, but custom template id → blank render.
- **AI skill silent** — verify (a) manifest entry in
  `sliceRegistry.ts`, (b) `CVCapabilities` mounted in
  `Providers.tsx`, (c) `DEFAULT_AI_TOOLS` updated, (d) re-seed via
  admin "Seed default" button, (e) handler for `cv.list` registered
  in `skillHandlers.ts`.
- **`cv.import-from-text` errors with "min 40 char"** — text shorter
  than 40 chars → parser action validates input. Legitimate guard,
  not a port bug.

**Testing the port:**

1. Navigate `/dashboard/cv` → editor renders
2. Type fullName → Convex mutation fires within 1s (devtools)
3. Toggle format to "national" → FileUpload appears, displayPrefs
   shows "Tampilkan foto"
4. Upload photo → appears in preview + persists across reload
5. Switch template (modern → classic → minimal) → preview updates
6. Click "Ekspor PDF" → downloads `.pdf` with content
7. Drag-reorder experience items → order persists after save
8. Open AI agent, type "tambah pengalaman di Tokopedia sebagai
   Frontend Engineer mulai 2024-01" → ApproveActionCard for
   `cv.add-experience`
9. Approve → entry appears in editor, toast fires
10. Type "berapa CV saya" → agent calls `cv.list` handler

Run `_porting-guide.md` §9 checklist.
