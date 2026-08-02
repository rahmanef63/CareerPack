# CareerPack

Next.js 15 App Router + Convex. Slice-based frontend in `frontend/`, backend functions in `convex/`.

## Full Documentation

Head to **[docs/](./docs/README.md)** — the index of all project context:

- [docs/architecture.md](./docs/architecture.md) — repo layout, routing, slice pattern, providers tree
- [docs/backend.md](./docs/backend.md) — Convex schema + every query/mutation/action
- [docs/auth.md](./docs/auth.md) — login flow + guards
- [docs/development.md](./docs/development.md) — setup, env, scripts, conventions, testing
- [docs/deployment.md](./docs/deployment.md) — deploying Convex + the frontend
- [docs/features/](./docs/features/README.md) — per-feature docs (13 slices)

## Quick Start

```bash
pnpm install
cp .env.example .env.local                   # root — Convex CLI
cp frontend/.env.example frontend/.env.local # frontend — NEXT_PUBLIC_CONVEX_URL
pnpm dev                                     # one-shot Convex push + `next dev`
```

Dev setup details + env matrix: [docs/development.md](./docs/development.md).

## Repo Structure

```
frontend/       Next.js 15 App Router, slices/<feature>, shared/*
convex/         Schema + functions (auth, cv, applications, roadmaps, …)
backend/        Self-hosted Convex Docker stack (optional)
docs/           Complete documentation (architecture, backend, per-feature)
.github/        CI workflows (workflow_dispatch-only since 2026-05-14)
```

## Root Scripts

The ones you'll use most:

- `pnpm dev` — sync Convex + start the frontend
- `pnpm typecheck` — frontend + convex
- `pnpm lint` — ESLint `--max-warnings=0`
- `pnpm test` — Vitest
- `pnpm backend:deploy` — push Convex to self-hosted prod

Full list: [docs/development.md §3](./docs/development.md).

## CI & Gating

GitHub Actions has been `workflow_dispatch`-only (manual) since 2026-05-14 — nothing deploys or runs CI automatically on push/PR. The one real automated gate is the local pre-push hook (`scripts/pre-push.sh`): `pnpm typecheck` + `pnpm exec vitest run`, then `pnpm backend:deploy` if `convex/**` changed. Details: [docs/deployment.md](./docs/deployment.md) + [CLAUDE.md](./CLAUDE.md).

## License

See [LICENSE](./LICENSE).
