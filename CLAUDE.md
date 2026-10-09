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
| Run single test file | `pnpm exec vitest run <path>` (e.g. `pnpm exec vitest run frontend/shared/lib/env.test.ts`) |
| Convex dev (watch push) | `pnpm backend:dev` |
| Convex one-shot sync (types only) | `pnpm backend:dev-sync` |
| Convex deploy to prod | `pnpm backend:deploy` |
| Regenerate self-hosted admin key | `pnpm backend:admin-key` |
| Smoke-test production | `pnpm smoke` |
| Wait for the Dokploy rebuild, then smoke-test | `pnpm smoke:watch` (run right after a push) |

Pre-commit hook (`simple-git-hooks` + `lint-staged`) runs ESLint `--fix` on frontend TS and `tsc --noEmit` on `convex/**/*.ts`. Do not bypass with `--no-verify`.

**Pre-push hook = quality gate.** `scripts/pre-push.sh` runs typecheck, lint, tests with coverage and production build. It never deploys code. Deploy the reviewed `main` commit with `.github/workflows/convex-deploy.yml`; configure required reviewers and main-only deployment rules for the `production` environment.

**Production target is explicit.** The workflow requires `CONVEX_SELF_HOSTED_URL=https://api.careerpack.org` and a nonempty matching admin credential, and verifies the frontend Dockerfile uses that same backend. Target mismatch or missing credentials aborts deployment.

**PRODUCTION RECOVERY 2026-09-09 — read this before any Convex/deploy change.** The Cloud production project that owned `proficient-dove-151` became inaccessible between the successful 2026-09-05 04:00 backup and the 2026-09-06 backup run. Its public `.convex.cloud` / `.convex.site` endpoints now return 404. Production data from the verified 2026-09-05 snapshot (58 tables + file storage) was restored into the still-healthy self-hosted fallback and current Convex functions were deployed there. Frontend production is therefore temporarily pinned to `https://api.careerpack.org`. Do **not** point clients back at `proficient-dove-151`, and do not repurpose `api.careerpack.org` / `site.careerpack.org` as Convex Cloud CNAMEs while they are the live rollback path. Google/password auth on the fallback still requires its deployment auth env to be restored through an approved secret-management path; browser-local demo mode deliberately does not depend on it.

**Which Convex deployment is production (re-audited 2026-09-09).**

| Deployment | Used by | CLI target |
|---|---|---|
| **Self-hosted Docker (Dokploy), `api.careerpack.org` / `site.careerpack.org`** | **temporary production recovery target**; restored from the 2026-09-05 Cloud snapshot | `pnpm backend:deploy` → `backend/convex-self-hosted/convex.env` |
| Convex Cloud `proficient-dove-151` | **INACCESSIBLE / never target production** until ownership/access is explicitly recovered and verified | old `backend/convex-cloud/prod.env` target; nightly backup began failing 2026-09-06 |
| Convex Cloud `savory-oyster-802` | older healthy rollback project; code/auth endpoint is healthy but its data is stale relative to the 2026-09-05 snapshot | use only for controlled recovery/credential migration, never direct traffic cutover without data reconciliation |
| Convex Cloud `effervescent-hedgehog-352` | local/dev history only | do not use for production |

The pre-push hook does not resolve deployment credentials. Only the main-only workflow deploys; there is no fallback to ambient CLI login, a stale Cloud key, or uncommitted local files.

Both env files are secrets — never commit either. Paths are gitignored.

**Prod data backup.** [`scripts/backup-prod.sh`](./scripts/backup-prod.sh) snapshots the **explicit active target** selected by `PROD_ENV_FILE` (current default: `backend/convex-self-hosted/convex.env`), includes file storage, validates every JSONL row, and prunes to `KEEP`. It runs from the `rahman` crontab at `0 4 * * *`. Never make backup target selection depend on ambient Convex CLI login/project state again: that is how backups silently stopped after `proficient-dove-151` became inaccessible. A pre-recovery self-hosted volume rollback archive also exists outside the repo; production snapshot archives remain under `~/backups/careerpack/`.

**Where this repo lives.** The working checkout at `/home/rahman/projects/CareerPack` is **on the production VPS** (`srv614914.hstgr.cloud`, Hostinger, `76.13.23.37`) — the same host that runs Dokploy, every app container, and the legacy self-hosted Convex. So "local" and "the server" are the same machine: crontabs, `docker ps`, and `~/bin/health-watch.sh` are all right here, no SSH needed. `backend/convex-cloud/prod.env` is a real production credential sitting on a shared host — mode `0600`, gitignored, and **never shell-source it**: the deploy key contains a `|`, so `. prod.env` truncates the value and pipes the rest to a command. Use `convex --env-file`, or `sed -n 's/^CONVEX_DEPLOY_KEY=//p'`.

## Architecture

### Workspace layout

- `frontend/` — Next.js 15 App Router. Only pnpm workspace member (`pnpm-workspace.yaml`).
- `convex/` — Convex schema + functions. Separate `tsconfig.json` typechecked alongside frontend.
- `backend/convex-self-hosted/` — Docker Compose stack for self-hosted Convex. **Temporarily serves production recovery as of 2026-09-09**; keep it healthy and backed up until a replacement Cloud production deployment is fully restored, authenticated, custom-domain verified, and cut over.
- `docs/` — Authoritative long-form docs; read these before architectural work.

### Routing (Next.js App Router)

Three route groups under `frontend/app/`:

1. `(marketing)/` — public. `/` renders `HeroSection`; `/login` renders `LoginPage`. Authenticated users on `/` auto-redirect to `/dashboard`.
2. `(dashboard)/` — auth-guarded layout. All dashboard pages resolve through a **catch-all** `dashboard/[[...slug]]/page.tsx` that looks the first slug segment up in `DASHBOARD_VIEWS`.
3. `admin/page.tsx` — role-guarded (`state.user?.role === "admin"`).

**Adding a dashboard page = ONE edit** (consolidated 2026-06-15): add an entry to the
registry in `frontend/shared/lib/dashboardRegistry.ts` — `{ slug, view (lazy via
next/dynamic), nav?: { placement: "primary" | "more", label, icon, hue?, badge?,
superAdminOnly? } }`. Everything is **derived** from this one list:
- `DASHBOARD_VIEWS` (catch-all `/dashboard/[[...slug]]` router — slug `""` = home),
- `PRIMARY_NAV` (mobile BottomNav tabs + desktop sidebar primaries),
- `MORE_APPS` (MoreDrawer / sidebar secondaries — registry order = display order),
- `activeNavForPath()` / `labelForPath()` (active-state matching).

So routing and nav can no longer drift. `dashboardRoutes.tsx` and
`navConfig.ts` are now thin **re-export shims** over the registry (kept for
import-path stability) — do NOT add route/nav data there. Omit `nav` for a
route-only slug (e.g. the `ai-settings` legacy alias). A `dashboardRegistry.test.ts`
pins the derived maps against expected values. `routes.ts` (`ROUTES.dashboard.*`)
stays separate — typed redirect targets for RouteGuard/useAuth; keep its paths in
sync if you add one those consume.

Routing and nav are **not** driven by slice manifests. The per-slice `manifest.ts` + `shared/lib/sliceRegistry.ts` registry is the **AI skill catalog only** (`SliceManifest.skills` → slash commands, approval-card meta, LLM brief). Manifests carry no route/nav fields — adding AI skills for a slice is a separate, independent edit from the registry edit above.

### Slice pattern

`frontend/slices/<kebab-name>/` — 22 feature slices (`admin-panel`, `ai-agent`, `ai-settings`, `auth`, `calendar`, `career-dashboard`, `cv-generator`, `dashboard-home`, `database`, `document-checklist`, `financial-calculator`, `help`, `hero`, `library`, `matcher`, `mock-interview`, `networking`, `notifications`, `personal-branding`, `portfolio`, `settings`, `skill-roadmap`). Each exports public API via `index.ts` barrel.

Slice folders contain `components/`, and optionally `hooks/`, `lib/`, `utils/`, `types/`, `constants/`, `config.ts`. Empty folders with `export {}` are intentional feature-contract scaffolding — don't delete them.

**Hard rules:**
- A slice must not import from another slice. Cross-slice code goes under `@/shared/*`.
- Promote cross-slice hooks to `@/shared/hooks/` (slice can re-export for local ergonomics).
- Promote cross-slice types to `@/shared/types/`.
- Slice AI actions publish to the global `aiActionBus` (`@/shared/lib/aiActionBus.ts`); slices subscribe for local execution.

### Responsive shell

`frontend/shared/containers/ResponsiveContainer.tsx` picks layout by `useIsMobile()` (shared `use-mobile` hook):
- `< lg` → `MobileContainer`: 5-slot BottomNav + AI FAB + MoreDrawer.
- `≥ lg` → `DesktopContainer`: shadcn `Sidebar` (collapsible icon mode) + `SiteHeader`.

AI agent is global — `<AIAgentConsole>` from `slices/ai-agent`, opened from both nav shells.

### Providers tree

`app/layout.tsx` mounts `<Providers>` (`frontend/shared/providers/Providers.tsx`), which nests outer→inner:
`ThemeProvider` → `ThemePresetProvider` → `ConvexClientProvider` (`ConvexAuthNextjsProvider`) → `AuthProvider` → `AIConfigProvider` → `UIPrefsProvider` → `LocaleProvider` → `TooltipProvider` → children, plus siblings of children: 14 slice `*Capabilities` binders (aiActionBus subscribers), PWA/system components (`RegisterSW`, `SWUpdatePrompt`, `UpdateChecker`, `ThemeColorSync`, `TranslateHint`, `ExtensionErrorFilter`, `CommandPalette`), and Sonner `Toaster`. The PWA install entry is `InstallSidebarButton` inside the desktop sidebar (the old floating `InstallChip` is gone). Root layout also wires GA4 via `next/script`.

### Convex backend

`convex/` mirrors the frontend slices — 20 domain folders, each owning its
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
  onboarding/ pageviews/       engine/       (engine/ nests graph/ plan/ outcomes/ atoms/ dp/)
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

**AI actions must pipeline through:** `requireQuota(ctx)` (local helper in each actions file → `internal.ai.mutations._checkAIQuota` → `enforceRateLimit` in `_shared/rateLimit.ts`; token bucket 10/min + 100/day) → `sanitizeAIInput()` → `wrapUserInput()` before hitting the OpenAI-compatible proxy.

**AI credentials** resolve in `_shared/aiResolve.ts` only (per-user `aiSettings` → `globalAISettings` singleton → env) and are decrypted there. `apiKey` columns hold **either** AES-256-GCM ciphertext (`encv1:` prefix, `_shared/aiCrypto.ts`, keyed by the Convex env `AI_CRED_SECRET`) **or** plaintext — all new writes require `AI_CRED_SECRET`; missing configuration rejects writes. Legacy plaintext remains readable during migration: run `admin/aiCreds.reencryptAICreds` before completing rollout. Set/rotate: [docs/deployment.md](./docs/deployment.md) §10. A provider declares how it can be logged into via `AIProviderSpec.auth` (`_shared/aiProviders.ts`); consumers ask `providerOAuth(id)` and never compare provider ids — adding an OAuth provider is a config block + an adapter in `convex/ai/oauth.ts`, per [docs/features/ai-settings.md](./docs/features/ai-settings.md).

### Auth specifics

`@convex-dev/auth` with `Password` (primary) + `Anonymous` providers. Password hashing is **custom PBKDF2-SHA256 100k iter**, not the default Scrypt — Scrypt takes >60s behind Dokploy's reverse proxy and blows past WebSocket action timeouts. Do not revert to Scrypt. New hashes use prefix `pbkdf2v2_`; verifier still accepts legacy `pbkdf2_` (10k iter) for backward compat.

Login flow (`useAuth.login`) is **login-or-register in one call**: `fetch` the `/api/auth/check-email` httpAction first (IP-gated 30/hr; the old public `userExistsByEmail` query was deleted 2026-05-07 to plug enumeration), then `signIn` with `flow: "signIn"` or `flow: "signUp"`. After success, `seedForCurrentUser()` runs; failures are logged and swallowed. It creates **only** the `userProfiles` row (plus a welcome email and `ADMIN_BOOTSTRAP_EMAILS` promotion only after email verification) — no CV, checklist, or roadmap. Those seed lazily from their own slice hooks (`useChecklistData`, `useSkillRoadmap`) on first visit.

## Hard constraints — DO NOT violate

**Tech stack is fixed. Never propose swapping or adding a new engine/framework/provider. Audit and fix what exists; do not invent new dependencies.**

- **Database**: Convex is the *only* data store (production recovery currently uses self-hosted `api.careerpack.org`; `proficient-dove-151` is inaccessible). **Treat Convex as a black box** — do not reference, propose, or audit its internal storage engine (whatever Convex uses under the hood is not the user's concern). **Do not propose Postgres, MySQL, Supabase, Firebase, Mongo, Prisma, Drizzle, SQLite tooling, or any external DB** — even as "optional" or "for scale". Reactive queries + realtime are non-negotiable; that's why Convex was chosen. When auditing data persistence, flag at the Convex abstraction layer only (volume backup, image pin, port binding, admin key rotation, env hygiene).
- **Auth**: `@convex-dev/auth` with `Password` + `Anonymous` providers + custom PBKDF2-SHA256 100k iter (Scrypt timed out behind Dokploy's reverse proxy — see `convex/auth.ts`). **Do not propose Clerk, Auth0, NextAuth, BetterAuth, or swapping to Argon2/bcrypt** without explicit user request. Bumping iter count = OK; replacing the algorithm = NOT OK.
- **Frontend**: Next.js 15 App Router + React 19 + Tailwind + shadcn/ui. **Do not propose Remix, SvelteKit, Astro, Vite-only SPA, Material UI, Chakra, Radix-only, etc.**
- **Deploy**: Dokploy (Docker Compose). **Do not propose Vercel, Railway, Fly.io, Render, AWS ECS, Kubernetes** even when discussing self-hosted concerns.
- **AI**: OpenAI-compatible proxy via `_shared/aiProviders.ts`. **Do not propose direct provider SDKs** — pipeline must stay `requireQuota → sanitizeAIInput → wrapUserInput → proxy`.
- **Package manager**: pnpm@10.24.0. Never propose npm/yarn/bun migrations.
- **Test runner**: Vitest. Never propose Jest/Mocha/Playwright migrations.

When auditing, flag risks **within the existing stack** (missing backups, weak iter count, unrate-limited mutations, fragile cron, etc.). If a finding requires a stack swap to fix, restate as "needs hardening of existing X" — never as "migrate to Y".

## Conventions

- TS strict, `@/*` → `frontend/*`.
- Convex generated types imported from relative path: `../../../../convex/_generated/api`.
- Default to **Server Components**. Only mark `"use client"` when state/effects/browser APIs are needed.
- Tailwind + shadcn/ui. Brand palette `career-{50..900}` lives in `tailwind.config.ts`; design tokens in `shared/styles/index.css`.
- File naming: slice folders `kebab-case`, React components `PascalCase.tsx`, hooks `camelCase.ts(x)`, shadcn primitives `kebab-case.tsx` (matches upstream).
- i18n: UI strings are Indonesian (see `<html lang="id">`). Error messages thrown from Convex are also Indonesian — match existing strings when adding new errors.

## CI

**GitHub Actions is manual-only since 2026-05-14** (`b678c58`, cost reduction — the original push/PR triggers are preserved as `.github/workflows/*.yml.bak`). Both `ci.yml` (typecheck → lint → test → build, build uses a dummy `NEXT_PUBLIC_CONVEX_URL`) and `convex-deploy.yml` run via `workflow_dispatch` only; `convex-deploy.yml` requires secrets `CONVEX_SELF_HOSTED_URL` + `CONVEX_SELF_HOSTED_ADMIN_KEY`. Automated gating happens locally instead: pre-commit (ESLint `--fix` + convex `tsc`) and pre-push (typecheck + lint + vitest with coverage + build; production deployment uses the main-only workflow — see Commands).

## SSOT — rahman-shared adopted (2026-05-13, PR #25)

- pnpm workspace: install via `pnpm --filter=careerpack-frontend add rahman-shared`
- `frontend/shared/lib/utils.ts` is a 1-line re-export from `rahman-shared/lib/utils` — DO NOT inline cn back
- `frontend/next.config.ts` has `transpilePackages: ["rahman-shared"]` (Turbopack TS hint, REQUIRED)
- 140 `@/shared/lib/utils` import sites continue working — only resolution chain changed
- Bump via `pnpm --filter=careerpack-frontend update rahman-shared`
- Skill `/use-adopt-rahman-shared` codifies pattern

## Further reading

- [docs/architecture.md](./docs/architecture.md) — full layout, routing table, providers
- [docs/backend.md](./docs/backend.md) — every Convex module + schema
- [docs/auth.md](./docs/auth.md) — provider rationale + route guard patterns
- [docs/development.md](./docs/development.md) — env matrix, dev-loop options (self-hosted Docker vs Convex cloud)
- [docs/db-backup.md](./docs/db-backup.md) — Convex backup. ⚠️ the cron **tar** + its restore drill cover the **self-hosted** volume, which no longer holds production data. Production (Convex Cloud) is covered separately by `scripts/backup-prod.sh` (`convex export --prod`, import drill PASSED 2026-07-30) — see the doc's "Cloud gap" section.
- [docs/features/](./docs/features/) — per-slice deep dives (one file per slice)
- [.claude/skills/slice-refactor/SKILL.md](./.claude/skills/slice-refactor/SKILL.md) — file-length thresholds, canonical slice layout (flat vs complex-slice variant), refactor protocol, DRY rules, iframe-template caveats
- [.claude/skills/slice-new/SKILL.md](./.claude/skills/slice-new/SKILL.md) — scaffolding a fresh slice + dual SSOT registration

---

## Rahman Resources kitab — BSDL (legacy, removed 2026-05-16)

This project briefly adopted the kitab **Bidirectional Sync (BSDL)** consumer
manifest (`.kitab.json` per slice, added 2026-05-15). The kitab repo tore BSDL
down on 2026-05-16; the manifest was deleted here in `75eabcc` and **no tool
reads `.kitab.json` anymore**.

- **Do not create `.kitab.json` files.** Do not use `/rr-prep` / `/rr-send`.
- Sharing a slice with another repo is now manual: `cp -r` the slice into the
  target, adapt (routes, tables, copy), and commit there.
- Historical context: [`docs/kitabsync.md`](./docs/kitabsync.md) (consumer
  scrape report, snapshot 2026-05-15) and the rr repo's CLAUDE.md
  "BSDL (legacy) — removed 2026-05-16" section.
