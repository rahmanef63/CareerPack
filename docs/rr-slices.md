# Rahman Resources (rr) — slice usage di CareerPack

> Project ini punya konvensi path khusus: slice di `frontend/src/slices/` (ada extra `src/` segment).
> Full distribution guide: https://github.com/rahmanef63/resource-site/blob/main/docs/distribution.md

## Struktur project

```
CareerPack/
├── frontend/
│   ├── src/
│   │   ├── components/ui/        ← shadcn primitives
│   │   ├── lib/utils.ts          ← shadcn util
│   │   └── slices/               ← 22 slice (EXTRA src/ segment!)
│   │       ├── admin-panel/  ai-agent/  ai-settings/  auth/
│   │       ├── calendar/  career-dashboard/  cv-generator/
│   │       ├── dashboard-home/  database/  document-checklist/
│   │       ├── financial-calculator/  help/  hero/  library/
│   │       ├── matcher/  mock-interview/  networking/
│   │       ├── notifications/  personal-branding/  portfolio/
│   │       ├── settings/  skill-roadmap/
│   │       └── ...
│   └── ...
├── backend/
└── convex/
```

**Catatan path:** CareerPack pakai monorepo struktur. Slice di `frontend/src/slices/` (bukan `frontend/slices/` seperti project lain). `/rr` skill auto-detect ini.

## Slice dari rr (terinstall via `npx rr add`)

- `document-checklist` — sudah lift ke rr di commit `02a2127`

## Slice yang BELUM di-lift (harvest priority)

Per audit 2026-05-16, slice CareerPack worth-lifting:

**Portable + unique value:**
- `cv-generator` — CV PDF builder (kalau dipisah dari job-specific logic)
- `financial-calculator` — calculator widget reusable
- `skill-roadmap` — visual roadmap component
- `networking` — CRM-lite

**Skip (business-locked):**
- `matcher` — job match algorithm (CareerPack-specific)
- `career-dashboard` — job seeker domain
- `mock-interview` — interview simulator domain
- `ai-agent` — niche tapi mungkin portable

## Workflow umum

### Install slice baru dari rr

```bash
cd ~/projects/CareerPack
npx rr add seo                # contoh
# CLI default install ke slices/ — tapi CareerPack pakai frontend/src/slices/
# Mungkin perlu manual: mv slices/ frontend/src/slices/
```

**Catatan:** CLI saat ini install ke `slices/<name>/` flat. Karena CareerPack pakai `frontend/src/slices/`, ada gap. Workaround: install dulu, lalu manual move. Long-term fix: CLI bisa baca config (mis. `rr.json`) dengan custom install path.

### Lift slice CareerPack → rr

```bash
# pastikan slice bersih (no hardcode "CareerPack", no job-search specific)
cp -r frontend/src/slices/cv-generator/ ~/projects/resources/frontend/slices/cv-generator/
cd ~/projects/resources
# edit imports + bikin metadata + commit + push
```

Atau pakai `/rr lift <slug>` skill (terpandu).

## Hal yang TIDAK perlu dilakukan

- ❌ `.kitab.json` per slice — udah dihapus 2026-05-16 (1 file dihapus dari CareerPack)
- ❌ `bidir` block di slice.contract.ts — vestigial
- ❌ `npx rr scan-consumers` — removed v1.0.0

## Hard rules

1. **No Clerk** — `@convex-dev/auth`
2. **shadcn-only UI**
3. **Push direct main**
