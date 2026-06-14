# CareerPack

Next.js 15 App Router + Convex. Frontend slice-based di `frontend/`, backend functions di `convex/`.

## Dokumentasi Lengkap

Masuk ke **[docs/](./docs/README.md)** — index semua konteks:

- [docs/architecture.md](./docs/architecture.md) — layout repo, routing, pola slice, providers tree
- [docs/backend.md](./docs/backend.md) — schema Convex + semua query/mutation/action
- [docs/auth.md](./docs/auth.md) — flow login + guard
- [docs/development.md](./docs/development.md) — setup, env, scripts, konvensi, testing
- [docs/deployment.md](./docs/deployment.md) — deploy Convex + frontend
- [docs/features/](./docs/features/README.md) — dokumen per-fitur (13 slice)

## Quick Start

```bash
pnpm install
cp .env.example .env.local                   # root — Convex CLI
cp frontend/.env.example frontend/.env.local # frontend — NEXT_PUBLIC_CONVEX_URL
pnpm dev                                     # push Convex sekali + `next dev`
```

Detail setup dev + env matrix: [docs/development.md](./docs/development.md).

## Repo Structure

```
frontend/       Next.js 15 App Router, slices/<feature>, shared/*
convex/         Schema + functions (auth, cv, applications, roadmaps, …)
backend/        Docker stack Convex self-hosted (opsional)
docs/           Dokumentasi komplit (architecture, backend, per-feature)
.github/        CI workflows (workflow_dispatch-only sejak 2026-05-14)
```

## Root Scripts

Paling sering dipakai:

- `pnpm dev` — sync Convex + start frontend
- `pnpm typecheck` — frontend + convex
- `pnpm lint` — ESLint `--max-warnings=0`
- `pnpm test` — Vitest
- `pnpm backend:deploy` — push Convex ke self-hosted prod

Full list: [docs/development.md §3](./docs/development.md).

## CI & Gating

GitHub Actions `workflow_dispatch`-only (manual) sejak 2026-05-14 — tidak ada deploy/CI otomatis saat push/PR. Gerbang otomatis nyata = pre-push hook lokal (`scripts/pre-push.sh`): `pnpm typecheck` + `pnpm exec vitest run`, lalu `pnpm backend:deploy` kalau `convex/**` berubah. Detail: [docs/deployment.md](./docs/deployment.md) + [CLAUDE.md](./CLAUDE.md).

## License

Lihat [LICENSE](./LICENSE).
