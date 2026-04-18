# Features

12 slice aktif + 5 placeholder coming-soon. Setiap feature self-contained di `frontend/src/slices/<name>/`.

## Active Slices

| Slice | Route | Dokumen |
|---|---|---|
| `hero` | `/` | [hero.md](./hero.md) |
| `auth` | `/login` | [auth.md](./auth.md) |
| `dashboard-home` | `/dashboard` | [dashboard-home.md](./dashboard-home.md) |
| `cv-generator` | `/dashboard/cv` | [cv-generator.md](./cv-generator.md) |
| `calendar` | `/dashboard/calendar` | [calendar.md](./calendar.md) |
| `career-dashboard` | `/dashboard/applications` | [career-dashboard.md](./career-dashboard.md) |
| `skill-roadmap` | `/dashboard/roadmap` | [skill-roadmap.md](./skill-roadmap.md) |
| `document-checklist` | `/dashboard/checklist` | [document-checklist.md](./document-checklist.md) |
| `mock-interview` | `/dashboard/interview` | [mock-interview.md](./mock-interview.md) |
| `financial-calculator` | `/dashboard/calculator` | [financial-calculator.md](./financial-calculator.md) |
| `settings` | `/dashboard/settings` | [settings.md](./settings.md) |
| `ai-agent` | (FAB global) | [ai-agent.md](./ai-agent.md) |
| `ai-settings` | (belum di-route — in progress) | [ai-settings.md](./ai-settings.md) |
| `admin` | `/admin` | [admin.md](./admin.md) |

## Placeholders (coming-soon stubs)

Rendered via `DashboardPlaceholders` — tidak ada slice terpisah. Definisi di `frontend/src/shared/components/DashboardPlaceholders.tsx`:

- `matcher` — AI Job Matcher
- `networking` — LinkedIn / kontak
- `portfolio` — Portfolio builder
- `notifications` — In-app notifications
- `help` — Help Center

## Feature Doc Template

Setiap doc feature mengikuti struktur:

```
# <Feature Name>

## Tujuan          — 1-2 kalimat, masalah yang dipecahkan
## Route & Entry   — URL + file komponen utama
## Struktur Slice  — tree folder
## Data Flow       — Convex tables + query/mutation yang dipakai
## State Lokal     — useState / useMemo penting
## Dependensi      — shared components, hooks, slice lain
## Catatan Desain  — trade-off penting / constraint
## Extending       — apa yang mungkin ditambah selanjutnya
```

## Adding a New Feature

1. **Folder**: buat `frontend/src/slices/<kebab-name>/`.
2. **Component**: `components/<PascalName>.tsx`. Pakai `"use client"` kalau butuh state.
3. **Barrel**: `index.ts` export komponen utama (dan types kalau cross-slice).
4. **Backend** (opsional): tambah table di `convex/schema.ts` + module `convex/<name>.ts` (pakai `requireUser`/`requireOwnedDoc`).
5. **Navigation**:
   - Edit `frontend/src/shared/components/navConfig.ts` — tambah ke `MORE_APPS` atau `PRIMARY_NAV`.
   - Edit `frontend/src/shared/lib/dashboardRoutes.tsx` — tambah slug + `dynamic import`.
   - Edit `frontend/app/(dashboard)/dashboard/[[...slug]]/page.tsx` — tambah slug di `generateStaticParams`.
6. **Tulis doc** `docs/features/<name>.md` — ikuti template di atas.
7. Run `pnpm typecheck && pnpm lint && pnpm test`.

Cross-slice sharing = pindah ke `@/shared/hooks/` atau `@/shared/types/`, slice asal re-export untuk kompat.
