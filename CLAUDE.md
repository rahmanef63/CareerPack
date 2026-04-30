# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All scripts run from repo root (pnpm workspace, `packageManager = pnpm@10.24.0`).

| Task | Command |
|---|---|
| Install | `pnpm install` |
| Dev (Convex sync + Next.js) | `pnpm dev` |
| Build frontend | `pnpm build` |
| Lint (zero-warning policy) | `pnpm lint` |
| Typecheck frontend + convex | `pnpm typecheck` |
| Run all tests | `pnpm test` |
| Watch tests | `pnpm test:watch` |
| Run single test file | `pnpm exec vitest run <path>` (e.g. `pnpm exec vitest run frontend/src/shared/lib/env.test.ts`) |
| Convex dev (watch push) | `pnpm backend:dev` |
| Convex one-shot sync (types only) | `pnpm backend:dev-sync` |
| Convex deploy to prod | `pnpm backend:deploy` |
| Regenerate self-hosted admin key | `pnpm backend:admin-key` |

Pre-commit hook (`simple-git-hooks` + `lint-staged`) runs ESLint `--fix` on frontend TS and `tsc --noEmit` on `convex/**/*.ts`. Do not bypass with `--no-verify`.

All `backend:*` scripts pass `--env-file backend/convex-self-hosted/convex.env`. That file is a secret — never commit it.

## Architecture

### Workspace layout

- `frontend/` — Next.js 15 App Router. Only pnpm workspace member (`pnpm-workspace.yaml`).
- `convex/` — Convex schema + functions. Separate `tsconfig.json` typechecked alongside frontend.
- `backend/convex-self-hosted/` — Docker Compose stack for self-hosted Convex (prod runs on Dokploy).
- `docs/` — Authoritative long-form docs; read these before architectural work.

### Routing (Next.js App Router)

Three route groups under `frontend/app/`:

1. `(marketing)/` — public. `/` renders `HeroSection`; `/login` renders `LoginPage`. Authenticated users on `/` auto-redirect to `/dashboard`.
2. `(dashboard)/` — auth-guarded layout. All dashboard pages resolve through a **catch-all** `dashboard/[[...slug]]/page.tsx` that looks the first slug segment up in `DASHBOARD_VIEWS`.
3. `admin/page.tsx` — role-guarded (`state.user?.role === "admin"`).

**Adding a dashboard page = two edits, nothing else:**
1. Register the view in `frontend/src/shared/lib/dashboardRoutes.tsx` (`DASHBOARD_VIEWS` map). Lazy-load via `next/dynamic` — do not bypass.
2. Add an entry in `frontend/src/shared/components/layout/navConfig.ts`. The `href` must match the slug key in `DASHBOARD_VIEWS`.

`navConfig.ts` is the nav SSOT: `PRIMARY_NAV` (mobile BottomNav tabs + desktop sidebar primaries), `MORE_APPS` (MoreDrawer / sidebar secondaries), and `activeNavForPath()` for active-state matching.

### Slice pattern

`frontend/src/slices/<kebab-name>/` — 14 feature slices (`cv-generator`, `ai-agent`, `calendar`, `career-dashboard`, `skill-roadmap`, `document-checklist`, `mock-interview`, `financial-calculator`, `dashboard-home`, `settings`, `ai-settings`, `hero`, `auth`, `admin`). Each exports public API via `index.ts` barrel.

Slice folders contain `components/`, and optionally `hooks/`, `lib/`, `utils/`, `types/`, `constants/`, `config.ts`. Empty folders with `export {}` are intentional feature-contract scaffolding — don't delete them.

**Hard rules:**
- A slice must not import from another slice. Cross-slice code goes under `@/shared/*`.
- Promote cross-slice hooks to `@/shared/hooks/` (slice can re-export for local ergonomics).
- Promote cross-slice types to `@/shared/types/`.
- Slice AI actions publish to the global `aiActionBus` (`@/shared/lib/aiActionBus.ts`); slices subscribe for local execution.

### Responsive shell

`frontend/src/shared/containers/ResponsiveContainer.tsx` picks layout by `useIsMobile()` (shared `use-mobile` hook):
- `< lg` → `MobileContainer`: 5-slot BottomNav + AI FAB + MoreDrawer.
- `≥ lg` → `DesktopContainer`: shadcn `Sidebar` (collapsible icon mode) + `SiteHeader`.

AI agent is global — `<AIAgentConsole>` from `slices/ai-agent`, opened from both nav shells.

### Providers tree

`app/layout.tsx` mounts in this order (inner to outer):
`ThemeProvider` → `ConvexClientProvider` (`ConvexAuthNextjsProvider`) → `AuthProvider` → `AIConfigProvider` → `UIPrefsProvider` → children + `InstallChip` + Sonner `Toaster`.

### Convex backend

`convex/` mirrors the frontend slices — 17 domain folders, each owning its
schema fragment + functions. The root `convex/schema.ts` is a thin
orchestrator that imports `<domain>/schema.ts` fragments and spreads them
into a single `defineSchema`. Indexes follow `by_user[_<field>]` convention.
Full table + module map in [docs/backend.md](./docs/backend.md). Restructure
rationale + migration history: [docs/progress/2026-04-25-convex-restructure.md](./docs/progress/2026-04-25-convex-restructure.md).

```
convex/
  _generated/                 (auto, untouched)
  _shared/                    (cross-domain helpers — auth, env, rateLimit, sanitize, aiProviders)
  _seeds/                     (data fixtures)
  schema.ts                   (orchestrator)
  auth.ts, auth.config.ts, http.ts, router.ts, crons.ts, passwordReset.ts, seed.ts
  cv/         applications/    documents/    roadmap/      calendar/
  contacts/   notifications/   portfolio/    mockInterview/
  financial/  goals/           profile/      ai/
  admin/      feedback/        files/        matcher/
```

Each domain folder contains `schema.ts` (table fragment), and any of
`queries.ts` / `mutations.ts` / `actions.ts` as needed. API paths follow
`api.<domain>.<file>.<fn>` — e.g. `api.cv.queries.getUserCVs`,
`api.cv.actions.translate`, `api.admin.mutations.deleteUser`.

**Adding a backend domain = three steps:**
1. Create `convex/<domain>/schema.ts` exporting a `<domain>Tables` const.
2. Add `import { <domain>Tables } from "./<domain>/schema";` + spread into root `defineSchema`.
3. Add `convex/<domain>/queries.ts` (and/or `mutations.ts` / `actions.ts`).
   Frontend then calls `api.<domain>.<file>.<fn>`.

**Guard helpers in `convex/_shared/auth.ts` — use consistently:**
- `requireUser(ctx)` on **every mutation**. Throws `"Tidak terautentikasi"` if no session.
- `optionalUser(ctx)` on **every list query**. Returns `null` on unauth so SSR + logout don't crash.
- `requireOwnedDoc(ctx, id, "Label")` for typed ownership check. Throws `"… tidak ditemukan"` (not "forbidden") to avoid enumeration leaks.

**AI actions must pipeline through:** `requireQuota(ctx)` (`_shared/rateLimit.ts`, token bucket 10/min + 100/day) → `sanitizeAIInput()` → `wrapUserInput()` before hitting the OpenAI-compatible proxy.

### Auth specifics

`@convex-dev/auth` with `Password` (primary) + `Anonymous` providers. Password hashing is **custom PBKDF2-SHA256 100k iter**, not the default Scrypt — Scrypt takes >60s behind Dokploy's reverse proxy and blows past WebSocket action timeouts. Do not revert to Scrypt. New hashes use prefix `pbkdf2v2_`; verifier still accepts legacy `pbkdf2_` (10k iter) for backward compat.

Login flow (`useAuth.login`) is **login-or-register in one call**: query `userExistsByEmail` first, then `signIn` with `flow: "signIn"` or `flow: "signUp"`. After success, `seedForCurrentUser()` bootstraps starter CV/checklist/roadmap; failures are logged and swallowed.

## Hard constraints — DO NOT violate

**Tech stack is fixed. Never propose swapping or adding a new engine/framework/provider. Audit and fix what exists; do not invent new dependencies.**

- **Database**: Convex (self-hosted on Dokploy) is the *only* data store. **Treat Convex as a black box** — do not reference, propose, or audit its internal storage engine (whatever Convex uses under the hood is not the user's concern). **Do not propose Postgres, MySQL, Supabase, Firebase, Mongo, Prisma, Drizzle, SQLite tooling, or any external DB** — even as "optional" or "for scale". Reactive queries + realtime are non-negotiable; that's why Convex was chosen. When auditing data persistence, flag at the Convex abstraction layer only (volume backup, image pin, port binding, admin key rotation, env hygiene).
- **Auth**: `@convex-dev/auth` with `Password` + `Anonymous` providers + custom PBKDF2-SHA256 100k iter (Scrypt timed out behind Dokploy's reverse proxy — see `convex/auth.ts`). **Do not propose Clerk, Auth0, NextAuth, BetterAuth, or swapping to Argon2/bcrypt** without explicit user request. Bumping iter count = OK; replacing the algorithm = NOT OK.
- **Frontend**: Next.js 15 App Router + React 19 + Tailwind + shadcn/ui. **Do not propose Remix, SvelteKit, Astro, Vite-only SPA, Material UI, Chakra, Radix-only, etc.**
- **Deploy**: Dokploy (Docker Compose). **Do not propose Vercel, Railway, Fly.io, Render, AWS ECS, Kubernetes** even when discussing self-hosted concerns.
- **AI**: OpenAI-compatible proxy via `_shared/aiProviders.ts`. **Do not propose direct provider SDKs** — pipeline must stay `requireQuota → sanitizeAIInput → wrapUserInput → proxy`.
- **Package manager**: pnpm@10.24.0. Never propose npm/yarn/bun migrations.
- **Test runner**: Vitest. Never propose Jest/Mocha/Playwright migrations.

When auditing, flag risks **within the existing stack** (missing backups, weak iter count, unrate-limited mutations, fragile cron, etc.). If a finding requires a stack swap to fix, restate as "needs hardening of existing X" — never as "migrate to Y".

## Conventions

- TS strict, `@/*` → `frontend/src/*`.
- Convex generated types imported from relative path: `../../../../convex/_generated/api`.
- Default to **Server Components**. Only mark `"use client"` when state/effects/browser APIs are needed.
- Tailwind + shadcn/ui. Brand palette `career-{50..900}` lives in `tailwind.config.ts`; design tokens in `src/shared/styles/index.css`.
- File naming: slice folders `kebab-case`, React components `PascalCase.tsx`, hooks `camelCase.ts(x)`, shadcn primitives `kebab-case.tsx` (matches upstream).
- i18n: UI strings are Indonesian (see `<html lang="id">`). Error messages thrown from Convex are also Indonesian — match existing strings when adding new errors.

## CI

`.github/workflows/ci.yml` runs on PR + push to main: typecheck → lint → test → build (build uses a dummy `NEXT_PUBLIC_CONVEX_URL`). `.github/workflows/convex-deploy.yml` auto-deploys Convex on `convex/**` changes to main — requires secrets `CONVEX_SELF_HOSTED_URL` + `CONVEX_SELF_HOSTED_ADMIN_KEY`.

## Further reading

- [docs/architecture.md](./docs/architecture.md) — full layout, routing table, providers
- [docs/backend.md](./docs/backend.md) — every Convex module + schema
- [docs/auth.md](./docs/auth.md) — provider rationale + route guard patterns
- [docs/development.md](./docs/development.md) — env matrix, dev-loop options (self-hosted Docker vs Convex cloud)
- [docs/db-backup.md](./docs/db-backup.md) — Convex volume backup plan (two-layer on-VPS recipe, TBD)
- [docs/features/](./docs/features/) — per-slice deep dives (one file per slice)
- [.claude/skills/slice-refactor/SKILL.md](./.claude/skills/slice-refactor/SKILL.md) — file-length thresholds, canonical slice layout (flat vs complex-slice variant), refactor protocol, DRY rules, iframe-template caveats
- [.claude/skills/slice-new/SKILL.md](./.claude/skills/slice-new/SKILL.md) — scaffolding a fresh slice + dual SSOT registration
