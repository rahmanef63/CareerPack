---
name: audit-bp
description: "Cross-framework best-practice auditor — Next.js 16 (App Router + Cache Components) / React 19 / Convex (cloud + self-hosted) / TypeScript / security / performance / deployment. Pulls latest docs via Context7 MCP before scoring. Emits a pragmatic review AND a machine-readable YAML appendix with numeric score."
---

# audit-bp — Best-Practice Auditor

Global skill. Works on **any** Next.js + Convex project on this machine. Project-specific rules layer on top via the project's own `CLAUDE.md` — the core framework checks are the same everywhere.

Sibling specialist reviewers (`convex-reviewer`, `rbac-auditor`, `architecture-reviewer`, `feature-validator`, `test-coverage-checker`) each cover one domain deeply. `audit-bp` is the **holistic, cross-framework** pass — and unlike them, it **verifies guidance against live docs** before calling something a violation.

Companion reference: `./audit-bp-docs.md` (next to this skill when present) captures the full normative background for Next.js 16 + Convex self-hosted that this skill implements.

---

## Phase 0 — Fetch latest framework docs via Context7 MCP

**MANDATORY first step.** Frameworks ship breaking guidance regularly. Anything your memory says may be stale.

Context7 MCP is registered in two places:
- **Global** — `~/.claude.json` → `mcpServers.context7`
- **Project** — `{repo}/.mcp.json` (if the project has one) — overrides global

Typical flow:
1. `mcp__context7__resolve-library-id` → `{ libraryName: "next.js" }`, `{ libraryName: "react" }`, `{ libraryName: "convex" }`. Collect the returned IDs.
2. `mcp__context7__get-library-docs` → for each ID, pull topic-filtered sections:
   - **Next.js 16**: `app-router`, `cache-components`, `use-cache`, `server-components`, `server-actions`, `route-handlers`, `proxy`, `metadata`, `image`, `self-hosting`, `instrumentation`, `opentelemetry`.
   - **React 19**: `hooks`, `suspense`, `server-components`, `use`, `transitions`, `taint`.
   - **Convex**: `schema`, `indexes`, `queries`, `mutations`, `actions`, `auth`, `pagination`, `self-hosted`, `migrations`, `backup-restore`, `nextjs`.

If Context7 tools aren't loaded in the session, `ToolSearch` for `"context7"` to load them. If still absent, fall back to `WebFetch` (`nextjs.org/docs`, `react.dev`, `docs.convex.dev`, `github.com/get-convex/convex-backend`) and report `Context7: FALLBACK` in the final report header — do NOT silently pretend docs were consulted.

**Never cite a rule you haven't just verified** — memory drifts faster than frameworks ship.

---

## Phase 1 — Scope & stack detection

Accept one of:
- `--full` — whole repo.
- `--changed` — uncommitted + last 15 commits (the default).
- `--slice <path>` — one subtree.

Build the file list:
```bash
git diff --name-only HEAD~15 HEAD
git status --porcelain | awk '{print $2}'
```

**Stack detection matrix** — read these up front; they gate which checks run:

| Signal | What it tells you |
|---|---|
| `package.json` → `next` version | Next 15 vs 16 baseline (Cache Components only on 16). |
| `app/` present | App Router path. `pages/` only = legacy Pages Router (compat mode). |
| `proxy.ts` present | Next 16 request boundary. `middleware.ts` alone = legacy — flag. |
| `next.config.*` → `cacheComponents`, `deploymentId`, `cacheHandler` | Modern caching, multi-instance readiness. |
| `convex/` present | Convex is in play. |
| `docker-compose*.yml` with `convex-backend` image | Convex **self-hosted** → self-hosted checks mandatory. |
| `POSTGRES_URL` / `MYSQL_URL` env in compose | Prod-grade DB. Absence with self-hosted → high severity. |
| `convex.json` → `aiFiles.skills.agents` | Multi-agent project — expect AGENTS.md conventions. |
| `instrumentation.ts` | OTel / `onRequestError` integration. Absent → observability gap. |

---

## Phase 2 — Run the KPI scripts for fast numeric signal

Two complementary scripts. Run both when the audit covers UI-touching code.

### 2a. Cross-cutting (Next.js / React / Convex / TS / security)

```bash
bash ~/.agents/skills/audit-bp/scripts/audit-bp.sh [--changed|--full|--slice <path>] [--json]
```

The script runs quick-scan commands and emits machine-readable counts:

```
audit-bp.kpi {
  "scope": "changed",
  "files_scanned": 71,
  "raw_anchor_count": 0,
  "raw_img_count": 0,
  "unbounded_collect_count": 0,
  "native_date_input_count": 0,
  "identity_email_bypass_count": 0,
  "typed_catch_any_count": 0,
  "hardcoded_feature_id_count": 0,
  "ts_ignore_unreasoned_count": 0,
  "legacy_middleware_count": 0,
  "preloadquery_multi_count": 0,
  "server_action_no_auth_count": 0,
  "convex_public_no_validator_count": 0,
  "selfhosted_sqlite_default_count": 0,
  "missing_deployment_id_count": 0,
  "missing_server_actions_key_count": 0,
  "exit": 0
}
```

### 2b. Per-feature layout consistency (feature-sliced projects)

```bash
bash ~/.agents/skills/audit-bp/scripts/audit-features.sh [--json|--md] [--slice <slug>]
```

Scans every `frontend/slices/{slug}/` directory against canonical layout
rules. Validates:

- **P0 (10 pts each)** — `config.ts` + `defineFeature()`, `init.ts`,
  `page.tsx`; if `hasConvex: true` then schema + queries + mutations exist
  under `convex/features/`; `status.state` is honest (no `stable` claim
  with missing backend).
- **P1 (5 pts each)** — `agent/index.ts` (singular, not plural `agents/`),
  `settings/index.ts`, `features-preview/index.tsx`, `views/` directory,
  `<FeatureShell>` used in views, no raw shadcn `<Dialog>` (use
  `ResponsiveDialog`), no native `<input type="date">` (use `DateField`),
  `permissions: [...]` populated when `hasConvex: true`.
- **P2 (2 pts each)** — no native `<input type="file">` (use `<FileUpload>`),
  no raw `<a href="/...">` for internal routes (use `next/link` or
  `SmartLink`), no raw `<img>` (use `next/image`).

Score: 100 − sum of deductions. Grade: A≥90 · B≥80 · C≥70 · D≥60 · F<60.
Exit 0 if every feature scores ≥80, else 1.

Modes:
- (default) human table + JSON appendix.
- `--json` — JSON only, CI-safe.
- `--md` — full markdown report including findings detail per slice.

Save a dated report:
```bash
bash ~/.agents/skills/audit-bp/scripts/audit-features.sh --md \
  > docs/coordination/$(date +%Y-%m-%d)-feature-audit.md
```

Exit codes:
- `0` — all metrics zero (clean at the mechanical level).
- `1` — one or more metrics nonzero (dig deeper in Phase 3).
- `2` — script error (no git, etc).

Use the KPI as a fast pre-filter — if all counts are zero, Phase 3's deep read can focus on judgement calls (memoisation, architectural drift, security nuance). If counts are nonzero, each finding has a concrete file:line to cite.

---

## Phase 3 — Deep review per domain

Every finding must cite `file:line` AND the exact doc rule it violates (from Phase 0).

### A. Next.js 16 / React 19

1. **`"use client"` discipline** — minimal boundaries. Server by default.
2. **Cache Components + `use cache`** — on Next 16, `cacheComponents: true` is the modern caching model. Flag routes still relying on pre-16 `fetch`-based `revalidate` / `cache: 'force-cache'` without migration plan.
3. **`proxy.ts` vs `middleware.ts`** — Next 16 positions `proxy.ts` as the request-time boundary (optimistic auth checks, CSP nonce, header shaping). `middleware.ts` alone on Next 16 is legacy — flag P1. Proxy is NOT the security boundary — authz still lives in DAL / Route Handler / Server Action.
4. **Server Actions are public POST endpoints** — every `"use server"` function MUST perform authn + authz server-side. Secure IDs are NOT authz. Return payload must not leak raw records — use DTO. Flag P0 if action returns DB row straight to client without sanitisation.
5. **`next.config.*` self-host hardening** — `output: 'standalone'`, `deploymentId` set, `cacheHandler` + `cacheMaxMemorySize: 0` if multi-instance, `experimental.serverActions.allowedOrigins` bounded, `bodySizeLimit` set. Absence on a multi-instance deploy is P1.
6. **`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`** — MUST be set and identical across instances or rolling deploys break Server Actions. Check env.example / secrets doc. Missing on multi-instance = P0.
7. **`next/image`** — no raw `<img>` for hosted assets. Width/height or `fill` present. `unoptimized` only when the URL is outside the Next allowlist (user CDN, Convex storage blob URL).
8. **`next/link`** — no raw `<a>` for internal routes. External URLs need `target="_blank" rel="noopener noreferrer"`. Protocol URLs (`mailto:`, `tel:`) stay as `<a>`. Project's `SmartLink` primitive if one exists.
9. **`next/dynamic`** — heavy client-only components code-split via dynamic import with `ssr: false` where appropriate.
10. **`useCallback` / `useMemo`** — only where profiled, not prophylactic.
11. **Metadata API** — `generateMetadata` for dynamic titles/OG. No manual `<Head>` in App Router.
12. **React 19** — `use(promise)` for client-side data where it replaces a `useEffect` + `setState` roundtrip. Ref-as-prop for new components (no `forwardRef` wrap). React taint APIs (`experimental_taintObjectReference`, `experimental_taintUniqueValue`) for sensitive data crossing server→client.
13. **Hydration** — no `typeof window !== "undefined"` in render paths. Date/Math.random deterministic between SSR+CSR.
14. **Suspense + ErrorBoundary** — colocated with route. Long server work behind `<Suspense>` + `loading.tsx`.
15. **Streaming infra** — if self-hosted behind nginx-like proxy, headers include `X-Accel-Buffering: no` or proxy buffering is disabled at the proxy. Suspense streaming will appear broken otherwise.
16. **`instrumentation.ts`** — `register()` for OTel, `onRequestError` for error reporting. Absent → observability gap P1.
17. **Edge runtime constraints** — Edge has a narrower API surface and does NOT support ISR. Flag any Edge route that expects ISR behaviour.
18. **Bundle size** — flag client-bundle > 300kB first-load without justification.

### B. Convex (cloud + self-hosted)

1. **Every query/mutation `.withIndex(...)`** — never bare `.query("table").collect()`. Write-path `.collect()` must have `.take(N)` safety cap.
2. **Argument validators on every public function** — `args: { ... }` block with `v.*` validators is MANDATORY on `query()`, `mutation()`, `action()`. Missing validator on public fn = P0 (docs: "crucial for security"). Internal functions (`internalMutation` etc.) may relax this, but prefer explicit.
3. **Access control on every public function** — `ctx.auth.getUserIdentity()` (or an equivalent RBAC helper like the project's `requirePermission(ctx, workspaceId, "feature.action")`) BEFORE any DB write. `requireActiveMembership` alone is insufficient for write paths.
4. **Don't authz on spoofable identity fields** — never key auth off `identity.email`; use `subject` or a server-minted user record. Project-normalised helpers (`readIdentityEmail` / `resolveIdentityEmail`) are fine for display, not for RBAC identity.
5. **Internal functions for scheduler / `ctx.run*`** — `ctx.runQuery`, `ctx.runMutation`, `ctx.runAction`, and `ctx.scheduler.*` should target `internal.*`, not `api.*`. Publicly-callable fns in cron/scheduler = surface area leak.
6. **Action vs mutation** — `action()` only for external I/O; DB work goes through `ctx.runMutation`. No `ctx.db.*` inside `action()`. Prefer default Convex runtime; `"use node"` only when a Node-only dep forces it. Actions are NOT auto-retried — treat side effects as at-most-once from Convex's side.
7. **Granular mutations** — prefer `setTeamOwner(...)` over `updateTeam(...)` — tighter authz per operation.
8. **`Date.now()` placement** — OK in mutations/actions; anti-pattern inside queries (breaks determinism / cache).
9. **Audit events** — every state change via the project's `logAuditEvent` helper. Action format: `feature.entity.verb`.
10. **Orphan-blob safety** — mutations accepting a `storageId` from the client wrap body in `try/catch` and `ctx.storage.delete(storageId)` on any throw.
11. **Monotonic IDs** — never `(await ctx.db.query(...).take(n)).length + 1`. Use the project's counter helper (`nextCounterValue` pattern).
12. **Cron refs** — Convex's generated `internal` type exceeds tsc's instantiation budget once the schema grows. `@ts-ignore TS2589` immediately above the specific identifier is the agreed workaround. Flag bare `internal.*` in `crons.ts` that break the build.
13. **Schema** — `by_workspace` index on every workspace-scoped table. Compound indexes for common filter patterns. Explicit `schema.ts` is mandatory by the time a project touches staging.
14. **Migrations** — live data changes go through the Convex migrations component (online, resume-after-failure, dry-run). Flag "manual bulk scripts" without resume/rollback plan.

### C. Convex — self-hosted only (skip if cloud-only)

1. **Database** — prod backends MUST set `POSTGRES_URL` or `MYSQL_URL`. Default SQLite is dev-only. DB region MUST be colocated with backend region. Missing on prod = P0.
2. **Object storage** — S3-compatible buckets configured for: `S3_STORAGE_EXPORTS_BUCKET`, `S3_STORAGE_SNAPSHOT_IMPORTS_BUCKET`, `S3_STORAGE_MODULES_BUCKET`, `S3_STORAGE_FILES_BUCKET`, `S3_STORAGE_SEARCH_BUCKET`. Missing when workloads need them = P1.
3. **Origins** — `CONVEX_CLOUD_ORIGIN` (API, port 3210), `CONVEX_SITE_ORIGIN` (HTTP actions, port 3211), dashboard (port 6791) all set coherently. `NEXT_PUBLIC_DEPLOYMENT_URL` matches `CONVEX_CLOUD_ORIGIN`.
4. **Reverse proxy + TLS** — no raw port exposure to the internet. TLS terminates at the proxy. Admin key + instance secret NOT in repo.
5. **Healthcheck** — `GET /version` wired into compose / k8s probe.
6. **Concurrency knobs** — `APPLICATION_MAX_CONCURRENT_MUTATIONS/QUERIES/NODE_ACTIONS/V8_ACTIONS` tuned to host resources, not left at defaults blindly.
7. **Observability** — `DISABLE_METRICS_ENDPOINT=false` and `REDACT_LOGS_TO_CLIENT=true` for prod. Dev-only logging leaks stack traces to connected clients.
8. **Backup/restore** — `npx convex export` + `npx convex import --replace` (or dashboard ZIP) path must be documented AND drilled in the last 30 days. Backup-exists ≠ restore-works. No drill in runbook = P1.
9. **Local deployments** — `npx convex dev --local` is dev-only beta. Flag any prod artifact referencing `.convex/` local-deployment state.
10. **Pinned images** — compose uses `:${REV}` or explicit tag, not `:latest` in prod.
11. **Graceful shutdown** — self-hosted Next should allow 10–30s shutdown so `after()` callbacks / in-flight requests drain.

### D. Integration — Next.js ↔ Convex

1. **`preloadQuery` for SSR + post-hydration reactivity** — Server Components that want initial HTML + live updates use `preloadQuery`, paired with `usePreloadedQuery` in a Client Component.
2. **`fetchQuery` for non-reactive server reads** — Route Handlers, Server Actions, admin BFF flows.
3. **No multi-`preloadQuery` consistency assumption** — docs explicitly warn `ConvexHTTPClient` is stateless per call. Pages doing 2+ `preloadQuery` that must agree on a DB snapshot = P1.
4. **Server Action → Convex mutation** — Server Action performs authn, obtains a JWT/OIDC token, then `fetchMutation(api.x, args, { token, url })`. No direct DB access from Server Action.
5. **Auth baseline** — default stance: **OIDC/JWT provider external** (Clerk / WorkOS / Auth0 / custom JWT). Convex Auth for Next.js SSR is still evolving and self-hosted CLI path needs manual wiring; do NOT recommend as default for new production work on this stack.

### E. TypeScript

1. **No `any` outside documented escape hatches** — allowlist: `any-api` helper (TS2589 escape), `ctx: any` for cross-boundary helpers, Convex-generated `internal as any` cron pattern.
2. **`v.id("table")` not `v.string()`** on ID fields.
3. **`as const`** on literal arrays feeding discriminated unions.
4. **No unused `@ts-expect-error`** — every one needs a trailing reason comment. Unused directives break `next build`.
5. **Zod on inputs** — every form input (`react-hook-form` + `zodResolver`) and mutation body.

### F. Security

1. **No secrets in client code** — `process.env.*` only in server-side (`app/`, `convex/`, `lib/`), never in `"use client"` files. `NEXT_PUBLIC_*` is inlined into browser bundle — anything sensitive under that prefix = P0.
2. **Permission checks on every mutation** before any DB write.
3. **Workspace isolation** — every read filtered by `workspaceId`. Cross-workspace access needs explicit platform-admin gate.
4. **DAL + DTO + `server-only`** — data access layer carries authz, DTO sanitises payload crossing server→client, `import 'server-only'` on modules that must never bundle to the client.
5. **CSP nonce via `proxy.ts`** — if nonce-based CSP is required, implement in proxy; note that nonce forces dynamic rendering for affected routes (trade-off).
6. **Input bounds** — string length, number ranges, array size limits in Zod or handler.
7. **File upload** — server-side MIME + size re-check, not just client-side.
8. **No raw HTML injection** — `dangerouslySetInnerHTML` only on sanitised content.
9. **Rate limits** — any mutation callable by anonymous visitors (public webhooks, host-resolved public endpoints) must bound rows-per-caller.

### G. Performance

1. **Client bundle** — `npm run build` top-N analysis. Flag > 300kB first-load without justification.
2. **Streaming** — long server work behind `Suspense` + `loading.tsx`.
3. **Memoisation** — only where profiled.
4. **Convex query fanout** — no N+1 (`for (const x of xs) { await ctx.db.get(...) }`). Use `Promise.all` over pre-fetched IDs.
5. **Image optimisation** — `next/image` with explicit dimensions for CLS.
6. **`.filter()` on large tables** — replace with `.withIndex(...)` range queries.

### H. CI / CD

1. **Persist `.next/cache`** — required for Next build caching to work across CI runs.
2. **Convex codegen gate** — `npx convex codegen` + `git diff --exit-code convex/_generated` catches stale generated types.
3. **Version pinning** — Docker images pinned by digest or tag in compose, not `:latest`.
4. **Secrets never in repo** — admin keys, instance secrets, JWT signing keys sourced from secret manager or CI vars.

### I. Project-specific (CLAUDE.md)

Read `{repo}/CLAUDE.md` and apply project-specific rules. Examples (look for analogous rules in other projects):
- `defineFeature({ id, name, ui, technical, status, permissions })` — all fields present, status honest.
- Feature folder canonical layout.
- Auto-discovery — no hardcoded feature list.
- `ResponsiveDialog` (not raw shadcn `Dialog`). Forms wrapping `Body + Footer` need `className="flex min-h-0 flex-1 flex-col"`.
- `SharedDatePicker` / `DateField` for date inputs.
- `<FileUpload>` + `useFileUpload` for file flows.
- Indonesian copy per project rule if applicable.

---

## Phase 4 — Report

### Human section

```
AUDIT-BP REPORT
===============
Scope: {--full | --changed | --slice <path>}
Files scanned: {N}
Context7 consulted: next.js@vX, react@vY, convex@vZ   (or FALLBACK)
Stack: Next {15|16} · App Router · Convex {cloud|self-hosted} · DB {postgres|mysql|sqlite|n/a}
KPI counts: raw_anchor={n}, legacy_middleware={n}, convex_public_no_validator={n}, ...

NEXT.JS / REACT
  PASS — {checks} green
  FINDINGS — {count}
    1. {SEV} — {rule (doc cite)} — {file:line} — Fix: {suggestion}
CONVEX ...
CONVEX SELF-HOSTED ...
INTEGRATION ...
TYPESCRIPT ...
SECURITY ...
PERFORMANCE ...
CI/CD ...
PROJECT-SPECIFIC ...

TOTAL FINDINGS: P0: x, P1: y, P2: z
SCORE: {0..100}   (baseline 100, -25 blocker, -12 high, -6 medium, -2 low, floor 0)
VERDICT:
  - >=85 -> APPROVE (land backlog alongside shipping)
  - 70..84 -> APPROVE-WITH-FOLLOWUPS (remediate before hardening)
  - <70 -> REJECT (not production-ready)
TOP-3 FOLLOWUPS (ordered by blast radius):
  1. ...
  2. ...
  3. ...
```

### Severity <-> P-level mapping

| New-doc severity | P-level | Examples |
|---|---|---|
| blocker | P0 | Public Server Action w/o authz, public Convex fn w/o access control, missing secrets boundary, self-hosted Convex exposed w/o reverse-proxy TLS, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` missing on multi-instance. |
| high | P0/P1 (judge by blast radius) | Missing arg validators on public Convex fn, multi-instance Next without shared cache / `deploymentId`, prod Convex on default SQLite, no backup-restore runbook. |
| medium | P1 | Pages Router used for new work, unbounded `.collect()`, `.filter()` on large tables, no `onRequestError` hook, no metrics/log redaction policy. |
| low | P2 | Missing `AGENTS.md`, missing cache-profile docs, doc drift. |

### Machine-readable appendix (YAML)

Emit this block after the human report:

```yaml
audit_bp:
  version: "2026-04-25"
  scope: changed   # or full / slice
  stack:
    next: "16.x"
    convex: self-hosted   # or cloud
    database: postgres     # or mysql / sqlite / n/a
  score: 0
  verdict: APPROVE   # APPROVE-WITH-FOLLOWUPS | REJECT
  findings:
    - id: "NEXT-SA-001"
      severity: blocker    # high | medium | low | info
      area: nextjs         # react | convex | convex-selfhosted | integration | typescript | security | performance | ci-cd | project
      evidence:
        - "app/foo/actions.ts:42"
      recommendation: "Add ensureUser + requirePermission before fetchMutation."
      source_of_truth:
        - "nextjs.org/docs/app/building-your-application/authentication"
  open_questions:
    - "..."
```

---

## Rules of engagement

- **Cite docs, not memory.** Every violation ties to a Phase-0 rule. Include the doc section name.
- **Don't double-up specialist reviewers.** If `convex-reviewer` / `rbac-auditor` covers a finding deeply, one-line summary + link.
- **Don't fix.** You report; a follow-up coding agent lands the fix. Exception: genuinely one-line fixes can be noted as `Fix: <one-liner>`.
- **Stay within scope.** `--slice` means don't wander.
- **Honest SKIPPED** when a domain couldn't be verified (e.g. Context7 down, `next build` failed pre-audit, docker-compose absent so self-hosted section not applicable) — never silent pass.
- **KPI script first.** Mechanical findings come from `scripts/audit-bp.sh`. Phase-3 deep reading focuses on judgement calls the grep can't see (memoisation discipline, architectural drift, security nuance).
- **Self-hosted is a choice, not an accident.** When you detect self-hosted Convex, treat section C as mandatory and note the operational trade-off explicitly in the report.
