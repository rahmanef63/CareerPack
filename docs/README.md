# CareerPack Docs

A complete map of the project context. Every document is self-contained — each one can be read on its own.

## Entry Points

| Document | When to read it |
|---|---|
| **[ai-onboarding.md](./ai-onboarding.md)** | **A new AI agent entering the repo — 4-min orientation** |
| [architecture.md](./architecture.md) | Understanding the repo layout, Next.js routing, slice pattern |
| [backend.md](./backend.md) | Understanding the Convex schema + every query/mutation/action |
| [auth.md](./auth.md) | Understanding the login / sign-up / guard flow |
| [development.md](./development.md) | Local setup, env, scripts, testing, conventions |
| [deployment.md](./deployment.md) | Deploy self-hosted Convex + frontend (Vercel / Dokploy) |
| [db-backup.md](./db-backup.md) | Backup Convex — Cloud prod export (deployed, drill PASSED) + legacy self-hosted volume tar |
| **[rules.md](./rules.md)** | **Non-negotiable conventions — R1..R17 (read before committing)** |
| **[guides.md](./guides.md)** | **Step-by-step recipes (add slice, Convex mutation, theme token, preset, etc.)** |
| [features/README.md](./features/README.md) | **Portable feature docs** — 27 entries with cp commands, schema migrations, npm deps for transplanting to other projects |
| [qa/quality-report-2026-04-23.md](./qa/quality-report-2026-04-23.md) | Latest audit — ship-readiness snapshot |
| [qa/ui-sweep-prompt.md](./qa/ui-sweep-prompt.md) | QA protocol v2.1 — copy-paste into the auditor agent |

## Quick Map

```
CareerPack/
├─ frontend/          Next.js 15 App Router (slice-based)
│  ├─ app/            Route tree — layouts + pages (thin, delegates to slices)
│  ├─ shared/         Cross-cutting: providers, hooks, UI kit, containers
│  └─ slices/         Feature slice (self-contained, barrel via index.ts)
├─ convex/            Backend — schema + query/mutation/action
│  └─ _shared/        Server helpers (auth guard, rate limit, sanitize, env)
├─ backend/convex-self-hosted/   Optional: Docker Compose stack
├─ docs/              ← you are here
└─ .github/workflows/ workflow_dispatch SAJA sejak 2026-05-14 — gerbang nyata = pre-push hook
```

## Design Principles

1. **Slice-based architecture** — each feature = one folder under `slices/<name>/`. Components, hooks, types, and constants live side by side. Cross-slice coupling is forbidden — use `@/shared/*` as the bridge.
2. **App Router + catch-all dashboard** — every dashboard view resolves through `/dashboard/[[...slug]]/page.tsx`, which reads the `DASHBOARD_VIEWS` registry (SSOT in `shared/lib/dashboardRegistry.ts`; `dashboardRoutes.tsx` is only a re-export shim). Each view is lazy-loaded via `next/dynamic` — automatic per-slice code-splitting.
3. **Convex = data SSOT** — no REST/tRPC layer. The frontend calls `useQuery`/`useMutation` directly. Auth uses `@convex-dev/auth`.
4. **Strict typecheck** — `strict: true`, ESLint `--max-warnings=0`, `tsc --noEmit` for frontend + Convex. CI fails if there is any warning.
5. **Lazy env** — `shared/lib/env.ts` reads env through getters instead of at module load time, so the Next layout bundle does not crash before the ErrorBoundary is ready.
