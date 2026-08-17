# Development

## 1. Prereq

- Node.js ≥ 20 (test di 22)
- `pnpm@10.24.0` (fixed via `packageManager` di root `package.json`)
- (Opsional) Docker kalau mau jalankan Convex self-hosted lokal

## 2. First-time Setup

```bash
pnpm install
cp .env.example .env.local                   # root — Convex CLI env
cp frontend/.env.example frontend/.env.local # frontend — NEXT_PUBLIC_CONVEX_URL
```

Default `.env.local` mengarah ke prod self-hosted (`<your-convex-backend>`). Untuk dev lokal, ganti ke Convex cloud dev atau self-hosted Docker lokal (lihat §5).

## 3. Scripts (root `package.json`)

| Script | Aksi |
|---|---|
| `pnpm dev` | `backend:dev-sync` (push Convex sekali) + `next dev` |
| `pnpm build` | `next build` frontend |
| `pnpm start` | `next start` (butuh `build` dulu) |
| `pnpm lint` | ESLint `--max-warnings=0` |
| `pnpm test` | Vitest run sekali |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm typecheck` | `tsc --noEmit` frontend + convex |
| `pnpm backend:dev` | Convex dev watch mode (live push tiap file change) |
| `pnpm backend:dev-sync` | Convex push sekali tanpa watch (untuk sync types) |
| `pnpm backend:deploy-prod` | **Deploy ke produksi** — Convex Cloud `proficient-dove-151` (`--env-file backend/convex-cloud/prod.env`) |
| `pnpm backend:deploy` | Deploy ke stack self-hosted legacy — **bukan** produksi |
| `pnpm backend:admin-key` | Generate admin key dari container self-hosted |

`backend:dev` dan `backend:dev-sync` menjalankan `convex dev` **tanpa** `--env-file`, jadi keduanya menyasar deployment yang disebut `CONVEX_DEPLOYMENT` di `.env.local` (Convex Cloud dev). Yang memakai env-file tinggal dua: `backend:deploy` → `backend/convex-self-hosted/convex.env` (legacy), `backend:deploy-prod` → `backend/convex-cloud/prod.env` (produksi). Dua-duanya secret — jangan commit, jangan `source` (nilai deploy key mengandung `|`).

> Kenapa ini penting: selama `backend:dev-sync` masih menunjuk env-file self-hosted, ia menulis ulang `.env.local` dan menghapus baris `CONVEX_DEPLOYMENT` — yang menurunkan pre-push hook dari tier 2 ke tier 3, dan sejak tier 3 membatalkan push, itu tampil sebagai push yang ditolak tanpa sebab yang jelas. Lihat [CLAUDE.md](../CLAUDE.md) bagian Commands.

## 4. Env Matrix

### Root `.env.local` (Convex CLI)

```bash
CONVEX_SELF_HOSTED_URL=https://<your-convex-backend>  # atau http://localhost:3210 untuk lokal
CONVEX_SELF_HOSTED_ADMIN_KEY=careerpack|xxx        # generate: pnpm backend:admin-key
```

### `frontend/.env.local`

```bash
NEXT_PUBLIC_CONVEX_URL=https://<your-convex-backend>  # wajib — di-inline time build
```

### `backend/convex-self-hosted/.env` (Docker container)

```bash
JWT_PRIVATE_KEY=<PEM RSA 2048 content>
CONVEX_SITE_URL=https://<your-convex-backend>
CONVEX_OPENAI_BASE_URL=https://api.openai.com/v1    # atau Azure/OpenRouter/dll
CONVEX_OPENAI_API_KEY=sk-...
AI_CRED_SECRET=<string bebas>       # opsional — tanpa ini API key AI tersimpan plaintext (tetap jalan) dan OAuth connect provider menolak
```

Lihat `backend/convex-self-hosted/convex.env.example` + `backend/convex-self-hosted/README.md`.
`AI_CRED_SECRET` (enkripsi + rotasi + kenapa OAuth menolak): [deployment.md §10](./deployment.md).

## 5. Dev Loop Pilihan

### Opsi A — Convex self-hosted lokal (Docker)

```bash
cd backend/convex-self-hosted
cp convex.env.example .env
# isi JWT_PRIVATE_KEY dan (kalau pakai AI) CONVEX_OPENAI_*
docker compose up -d
cd ../..
# Update root .env.local → CONVEX_SELF_HOSTED_URL=http://localhost:3210
# Update frontend/.env.local → NEXT_PUBLIC_CONVEX_URL=http://localhost:3210
pnpm backend:admin-key           # copy output ke root .env.local
pnpm backend:dev-sync            # push functions
pnpm dev                         # start frontend
```

### Opsi B — Convex cloud dev

```bash
pnpm exec convex dev             # interaktif: pilih / buat deployment
# Akan menulis CONVEX_DEPLOYMENT ke .env.local otomatis
# Frontend: set NEXT_PUBLIC_CONVEX_URL dari dashboard (https://<id>.convex.cloud)
pnpm dev
```

Catatan: `pnpm backend:dev` **sudah** menjalankan `convex dev` tanpa env-file, jadi opsi B tidak butuh perintah khusus — `CONVEX_DEPLOYMENT` di `.env.local` yang menentukan sasarannya.

## 6. Coding Conventions

### TypeScript

- `strict: true`, `noEmit: true` (Next + separate convex tsconfig)
- Path alias: `@/*` → `frontend/*`
- Convex generated types: `import { api } from "../../../../convex/_generated/api"`

### React

- Default ke **Server Component**. Pakai `"use client"` hanya kalau butuh state/effect/browser API.
- Slice catch-all views di-lazy via `next/dynamic` di `dashboardRegistry.ts` — jangan bypass.
- Styling: Tailwind + shadcn. Brand palette `career-{50..900}` di `tailwind.config.ts`. Design tokens di `shared/styles/index.css`.

### Convex

- Mutation: wajib `await requireUser(ctx)`
- Query list: pakai `optionalUser` (graceful unauth)
- Owner check: `await requireOwnedDoc(ctx, id, "Label")`
- AI action: wajib `await requireQuota(ctx)` + `sanitizeAIInput()` + `wrapUserInput()`

### File Naming

| Jenis | Pola | Contoh |
|---|---|---|
| Slice folder | `kebab-case` | `cv-generator/` |
| React component file | `PascalCase.tsx` | `CVGenerator.tsx` |
| Hook file | `camelCase.ts(x)` | `useAgenda.ts`, `useAuth.tsx` |
| Shared util | `camelCase.ts` | `aiActionBus.ts` |
| shadcn UI | `kebab-case.tsx` | `alert-dialog.tsx` |

## 7. Git Hooks

`simple-git-hooks` + `lint-staged` aktif. Pre-commit:

- Frontend `.ts/.tsx` → `eslint --max-warnings=0 --fix`
- Convex `.ts` → `tsc --noEmit -p ../convex/tsconfig.json`

Pastikan `pnpm install` sekali supaya hook ter-install (`prepare` script).

## 8. Testing

Vitest. Sekarang ada 40 file, 463 test (per 2026-06-15) — tersebar co-located
di `convex/**` dan `frontend/{shared,slices}/**` (lihat `vitest.config.ts`
`include`). Contoh: `frontend/shared/lib/env.test.ts` (env validator),
`convex/_shared/rateLimit.test.ts` (token bucket), `convex/_shared/sanitize.test.ts`
(input sanitizer).

Tambah test: co-locate file `*.test.ts` dekat source. Global setup tidak perlu — Vitest auto-detect.

Coverage punya anti-regression floor di `vitest.config.ts` (`thresholds`).
`pnpm test:coverage` menjalankan test + cek floor; pre-push gate memanggil ini
supaya regresi coverage di kode ber-test ikut menggagalkan push. Ratchet naik
seiring coverage tumbuh — jangan turunkan.

## 9. CI

**Gating otomatis = pre-push hook lokal, BUKAN GitHub Actions.** Sejak
2026-05-14 semua workflow (`ci.yml`, `convex-deploy.yml`) `workflow_dispatch`-only
(manual) untuk hemat biaya — tidak ada lagi trigger push/PR. Gerbang otomatis
nyata adalah `scripts/pre-push.sh` (via `simple-git-hooks`): jalankan
`pnpm typecheck` + `pnpm lint` + `pnpm test:coverage` (vitest + cek coverage
thresholds) + `pnpm build` tiap push, lalu kalau push range menyentuh
`convex/**` ia deploy SEBELUM push landing — target di-resolve 3 tingkat:
`backend/convex-cloud/prod.env` → sesi CLI Convex yang sudah login (dua-duanya
Cloud PROD) → self-hosted (legacy; hook-nya teriak keras kalau kena yang ini,
karena fungsi produksi tidak berubah).
`pnpm build` wajib ada di gate: typecheck dan vitest buta terhadap breakage
yang cuma muncul saat build (import native di top-level, `serverExternalPackages`
kurang, export route yang bentrok sama config Next) — dan Dokploy build
langsung dari push ke main.
Bypass: `SKIP_PUSH_CHECKS=1` (skip gate) / `SKIP_CONVEX_DEPLOY=1` (skip deploy).
Detail di [CLAUDE.md](../CLAUDE.md) bagian Commands + [deployment.md](./deployment.md).

`.github/workflows/ci.yml` (jalan manual via **Actions → Run workflow**):

1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck`
3. `pnpm lint`
4. `pnpm test`
5. `pnpm build` (dengan dummy `NEXT_PUBLIC_CONVEX_URL`)

`.github/workflows/convex-deploy.yml` push Convex ke prod — juga `workflow_dispatch`-only (manual), butuh secret `CONVEX_SELF_HOSTED_URL` + `CONVEX_SELF_HOSTED_ADMIN_KEY`.

## 10. Adding a Feature

Lihat [features/README.md](./features/README.md) — ada walkthrough step-by-step.
