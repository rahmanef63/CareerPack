# Convex Backend

Schema + functions for CareerPack. Layout mirrors the frontend slices —
17 domain folders, each owning its schema fragment + functions.

## Layout

```
convex/
  _generated/                 (auto, do not edit)
  _shared/                    cross-domain helpers (auth, env, rateLimit, sanitize, aiProviders)
  _seeds/                     data fixtures (no Convex functions)

  schema.ts                   orchestrator — imports per-domain *Tables fragments
  auth.ts, auth.config.ts     @convex-dev/auth (Password PBKDF2v2 + Anonymous)
  http.ts, router.ts          HTTP routes for auth callback
  crons.ts                    cron schedules
  passwordReset.ts            auth-adjacent (kept at root to avoid auth/ folder collision)
  seed.ts                     orchestrator for demo + minimal seed

  cv/         applications/    documents/    roadmap/      calendar/
  contacts/   notifications/   portfolio/    mockInterview/
  financial/  goals/           profile/      ai/
  admin/      feedback/        files/        matcher/
```

Each domain folder contains:

- `schema.ts` — exports `<domain>Tables` const (table fragments), imported by root `convex/schema.ts`
- `queries.ts` — public/internal `query()` exports
- `mutations.ts` — public/internal `mutation()` exports
- `actions.ts` — `action()` exports (only when needed; e.g. `cv/`, `ai/`)

API path follows the file layout: `api.<domain>.<file>.<fn>`. Examples:

- `api.cv.queries.getUserCVs`
- `api.cv.actions.translate`
- `api.admin.mutations.bulkDeleteUsers`
- `internal.admin.cleanup.cleanupInactiveDemoUsers` (cron target)

Full module map + per-table index list: [docs/backend.md](../docs/backend.md).

## Adding a domain

1. `mkdir convex/<domain>` and create `convex/<domain>/schema.ts` exporting a `<domain>Tables` const.
2. In `convex/schema.ts`, add `import { <domain>Tables } from "./<domain>/schema";` and spread it into `defineSchema`.
3. Add `convex/<domain>/queries.ts` / `mutations.ts` / `actions.ts` as needed. Each file imports `_generated/server` from `../_generated/server` and helpers from `../_shared/...`.
4. Run `npx convex dev --once --local --typecheck=disable` (or `pnpm backend:dev-sync` against a live deployment) to regenerate `_generated/api.d.ts`.

## Dev loop

```bash
pnpm backend:dev          # watch + push to self-hosted (default)
pnpm backend:dev-sync     # one-shot push (regenerates _generated/)
pnpm backend:deploy       # production deploy
```

The `backend:*` scripts pass `--env-file backend/convex-self-hosted/convex.env`
which is gitignored. Never commit it.

## Restructure rationale

The flat-files → per-domain layout shipped 2026-04-25. See
[docs/progress/2026-04-25-convex-restructure.md](../docs/progress/2026-04-25-convex-restructure.md)
for the full migration map (every old → new path).
