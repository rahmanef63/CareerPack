# CV Generator

## Tujuan

Editor CV terstruktur (ATS-friendly) dengan preview live, scoring, AI suggestion per section, export, dan inline checklist dokumen. Format support: `national` (Indonesia) vs `international`.

## Route & Entry

- URL: `/dashboard/cv`
- Slice: `frontend/src/slices/cv-generator/`
- Komponen utama: `CVGenerator.tsx` (terbesar, ~1000 baris)

## Struktur Slice

```
cv-generator/
├─ index.ts
├─ components/
│  ├─ CVGenerator.tsx         Editor + preview + export
│  ├─ CVScoreBadge.tsx        Scoring heuristik (computeScore)
│  ├─ DocChecklistInline.tsx  Inline checklist (ringkas doc-checklist slice)
│  └─ InlineAISuggestChip.tsx AI suggest trigger per section
├─ hooks/
│  ├─ useCV.ts                Convex CRUD + konversi schema↔CVData
│  └─ useCVAIActions.ts       Trigger AI action via bus
├─ constants/index.ts         `initialCVData`, `CVFormat`
└─ types/index.ts             CVData, Education, Experience, Skill, Certification, Project, UserProfile
```

## Data Flow

Convex: tabel `cvs` via `convex/cv.ts`.

| Hook | Convex op | Purpose |
|---|---|---|
| `useCV.cvData` | `api.cv.getUserCVs` | Fetch first CV (multi-CV belum exposed UI) |
| `useCV.saveCV` | `api.cv.createCV` / `updateCV` | Upsert — auto-create kalau belum ada |

Schema roundtrip: frontend `CVData` ↔ Convex `Doc<"cvs">`. Konversi handle:
- `SkillCategory` validation → `"technical" | "soft" | "language" | "tool"` (fallback `technical`)
- `ProficiencyLevel` clamp 1–5

AI: `useCVAIActions` publish ke `aiActionBus` (mis. "improve bullet", "suggest skill") — konsumer = AI agent console yang process via OpenAI action.

## State Lokal

- `cvData` + `isDataLoaded` — form master (sync dari remote)
- `isSaving`, `format`, `photoUrl`
- `previewOpen`, `activeSection` — UI state untuk accordion + dialog preview
- Drag-reorder state: `expDrag`, `skillDrag` via `useDragReorder` dari `MicroInteractions`

## Dependensi

- `@/shared/components/MicroInteractions` — `MagneticTabs`, `SwipeToDelete`, `useDragReorder`, `AnimatedProgress`
- `@/shared/hooks/useAuth` (transitive via `useCV`)
- shadcn: `button`, `input`, `label`, `textarea`, `card`, `badge`, `dialog`
- `sonner` toast

## Catatan Desain

- Satu user = satu CV aktif di UI. Schema dukung multi-CV (`isDefault`), tapi belum diselector.
- Export PDF lewat `html2pdf.js` (dynamic import di click handler → tidak bloat initial bundle). Tombol "Ekspor PDF" ada di preview Dialog + sidebar ("Unduh PDF"). Output text-selectable (html2canvas → jsPDF). Ctrl+P native browser tetap support untuk print langsung.
- Score dihitung client-side di `CVScoreBadge.computeScore(cvData)` — heuristik ringan (completeness, keyword, length). Tidak panggil AI.

## Extending

- Multi-CV picker: tambah selector UI → update `useCV` untuk switch `activeCVId`.
- Template variant (modern/classic) → tambah `CVFormat` values + kondisikan rendering preview.
- [x] Real PDF export → `html2pdf.js` (dynamic import, A4 portrait). Server-side Puppeteer → future, kalau butuh konsistensi cross-browser.
