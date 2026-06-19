# 2026-06-19 — Ponytail Sweep (audit over-engineering repo-wide)

Pembersihan **complexity/bloat** seluruh tree (bukan bug/security/perf — itu
sudah ditutup di campaign QA 83→93.38). Audit multi-agent (8 agent) merangking
temuan "biggest cut first", lalu sweep multi-agent (4 agent, disjoint-file)
memverifikasi **zero-importer via grep sebelum tiap potong**, baru menerapkan.
**0 temuan di-skip** — semua terkonfirmasi mati.

Commit: `417d254` (di branch `qa/loop-to-100`, lalu merge ke main).

## Yang dipotong (net -535 baris kode + 4 dep)

| Tag | Apa | Path |
|---|---|---|
| delete | 2 script migrasi one-shot yang sudah selesai (tak bisa jalan lagi) — 397 baris | `scripts/flatten-frontend-src.mjs`, `scripts/split-roadmap-templates.mjs` |
| delete | `shared/types/api.ts` — REST/CRUD scaffolding tanpa konsumen (app ini reactive Convex, bukan REST) | `frontend/shared/types/api.ts` |
| delete | `shared/types/chat.ts` — ChatMessage/ChatSession yang di-shadow tipe milik slice ai-agent | `frontend/shared/types/chat.ts` |
| delete | tipe spekulatif tanpa importer: IdentifiableEntity/PartialUpdate/CreateEntity, DemandTrend, SalaryRange | `base-entity.ts`, `common.ts` |
| delete | re-export/stub mati: `QueryCtx/MutationCtx` re-export, alias `TweaksPanel`, `FunctionRef`, stub `register()` kosong | `email.ts`, `settings/index.ts`, `defineResource.tsx`, `instrumentation.ts` |
| delete | 4 dep nganggur (0 import di source): `embla-carousel-react`, `input-otp`, `react-resizable-panels`, `@dnd-kit/modifiers` | `frontend/package.json` (+ lockfile −6 pkg) |
| stdlib | id generator buatan tangan → `crypto.randomUUID()`: `genId()` ×2 (+2 call site), `randomEventId()` loop hex | `admin-panel/lib/*`, `errorSink.ts` |

Dipertahankan (sengaja, sesuai CLAUDE.md): scaffold `export {}`, re-export `cn`
dari rahman-shared, `transpilePackages`, split 17 domain Convex,
`@dnd-kit/core|sortable|utilities`, shim routing `dashboardRoutes`/`navConfig`.

## Verifikasi

- 4 agent sweep re-grep importer (frontend/convex/scripts/backend) sebelum tiap
  potong; whole-file via `rm`, partial via Edit; barrel `types/index.ts`
  dibersihkan dari re-export modul terhapus.
- Gate ijo: `pnpm typecheck` (frontend + convex) ✅ · `pnpm lint`
  `--max-warnings=0` ✅ · `pnpm exec vitest run` **472 test / 41 file** ✅ ·
  pre-commit lint-staged lewat.
- `pnpm install` prune lockfile (`Packages: -6`).

## Dampak skor

Maintainability/arsitektur naik tipis (−535 baris mati, surface impor lebih
kecil), tapi **bukan re-score formal** — temuan kelasnya kosmetik/bloat, bukan
dimensi berbobot. Headline tetap **93.38** (lihat
[scorecard](../audit/2026-06-15-qa-scorecard.md)). Jarak ke 100 tetap
human/console-gated (provider snapshot, OAuth) + 1 refactor file-length opsional.
