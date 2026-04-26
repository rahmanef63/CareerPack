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
| `pnpm backend:deploy` | Convex deploy (production) |
| `pnpm backend:admin-key` | Generate admin key dari container self-hosted |

Semua script memakai `--env-file backend/convex-self-hosted/convex.env`. File ini adalah secret — jangan commit.

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
```

Lihat `backend/convex-self-hosted/convex.env.example` + `backend/convex-self-hosted/README.md`.

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

Catatan: script `backend:dev` saat ini point ke `--env-file backend/convex-self-hosted/convex.env`. Untuk Convex cloud, jalankan langsung `pnpm exec convex dev` tanpa env-file.

## 6. Coding Conventions

### TypeScript

- `strict: true`, `noEmit: true` (Next + separate convex tsconfig)
- Path alias: `@/*` → `frontend/src/*`
- Convex generated types: `import { api } from "../../../../convex/_generated/api"`

### React

- Default ke **Server Component**. Pakai `"use client"` hanya kalau butuh state/effect/browser API.
- Slice catch-all views di-lazy via `next/dynamic` di `dashboardRoutes.tsx` — jangan bypass.
- Styling: Tailwind + shadcn. Brand palette `career-{50..900}` di `tailwind.config.ts`. Design tokens di `src/shared/styles/index.css`.

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

Vitest. Sekarang ada 3 file, 18 test:
- `frontend/src/shared/lib/env.test.ts` — env validator
- `convex/_shared/rateLimit.test.ts` — token bucket
- `convex/_shared/sanitize.test.ts` — input sanitizer

Tambah test: co-locate file `*.test.ts` dekat source. Global setup tidak perlu — Vitest auto-detect.

## 9. CI

`.github/workflows/ci.yml` jalankan di PR + push main:

1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck`
3. `pnpm lint`
4. `pnpm test`
5. `pnpm build` (dengan dummy `NEXT_PUBLIC_CONVEX_URL`)

`.github/workflows/convex-deploy.yml` auto-push Convex ke prod saat `convex/**` berubah di main. Butuh secret `CONVEX_SELF_HOSTED_URL` + `CONVEX_SELF_HOSTED_ADMIN_KEY`.

## 10. Adding a Feature

Lihat [features/README.md](./features/README.md) — ada walkthrough step-by-step.
