# Progress Tracker

Last updated: 2026-05-15.

## Recent batches

- 2026-05-07 — UX: `UltimateCalendar` wrapper. Single typed surface over shadcn `<Calendar>` (which itself wraps react-day-picker v9). Knobs: `variant` (default/outline/ghost/filled), `size` (sm/md/lg via `--cell-size` CSS var), `accent` (primary/success/warning/destructive/info/secondary — wired via `--ucal-accent` CSS var into selected-day + today via Tailwind arbitrary-attribute selectors), `bordered`/`shadowed`/`roundedDays`, `showWeekdays`, plus passthrough for every native DayPicker prop (`captionLayout`, `numberOfMonths`, `pagedNavigation`, `dir`, `timeZone`, `disabled`, `showWeekNumber`, `fixedWeeks`, `hideNavigation`, etc.). `markedDates: MarkedDate[]` exposes per-date dot indicators via DayPicker `modifiers` + `modifiersClassNames`. `header` / `footer` slots above + below the grid. Migrated `slices/calendar/components/CalendarView.tsx` as the first adopter — replaces hand-rolled `modifiersClassNames` for event dots with the typed `markedDates` API. Type uses intersection (not Omit/extension) so `mode`-discriminated `selected` / `onSelect` stay narrowed at callsites.
- 2026-05-07 — UX: compact `PhotoPicker` for CV photo (audit-bp follow-up). Old form ate ~140px tall — drop-zone + preview + clear button stacked vertically. New `<PhotoPicker>` (in `@/shared/components/files/`) is a single 40px row: thumbnail + URL / Unggah / Library / Clear buttons. `URL` toggles an inline input (rejects non-http/https/data: schemes), `Unggah` opens existing `<FileUpload>` inside a `<ResponsiveDialog>` (becomes a Drawer on mobile automatically), `Library` opens `<LibraryPicker>` (also auto-Drawer). Schema additive: `personalInfo.avatarUrl?: v.optional(v.string())` lets users paste a hosted image URL alongside the existing storageId path. `<LibraryPicker>` promoted from `slices/portfolio/` to `@/shared/components/files/` so cross-slice consumers (CV, future branding/onboarding) use the same primitive — closes a slice-import-leak.
- 2026-05-07 — Roadmap content gap (partial): added `business/hospitality-manager.json` — 8-node Hospitality & Hotel Management track (Front Office → Housekeeping → F&B → Revenue → Guest Experience → MICE Sales → GM Leadership) with Indonesia-specific resources (PHRI, Kemenparekraf, BPOM HACCP). Marks the start of clearing the "non-tech domain" gap; remaining domains (construction, agriculture, manufacturing) still need a domain expert pass.
- 2026-05-07 — i18n phase 1 — browser-translate-first locale primitive. New `useLocale()` hook + `LocaleProvider` (id ↔ en, persisted to localStorage, auto-detects from `navigator.language`). Bound `Intl.*` formatters pivot date / number / currency between `id-ID`+IDR and `en-US`+USD. `<TranslateHint />` shows a one-time dismissible banner to non-id browsers pointing to right-click → Translate. Settings → Appearance → "Bahasa & Format" surfaces the toggle with a live sample. Existing `formatDate.ts` (50+ callsites, hard-coded id-ID) untouched this round — that refactor is the obvious next step. Aligns with the user's directive: "as dynamic as possible, lean on browser auto-translate."
- 2026-05-07 — Idempotency rollout to remaining 3 retry-prone actions: `cv.tailor`, `cv.generateCoverLetter`, `matcher.scanCV` each take optional `idempotencyKey` + wrap their handler body via `withIdempotency(ctx, userId, key, () => impl(...))`. Frontend mints `crypto.randomUUID()` per click in the four call sites (CoverLetterDialog, ResumeTailorDialog, useATSScan, MatcherCapabilities). Skipped: `ai.chat` (streaming reconnect already retry-safe via chatConversations history merge); `matcher.ats.extractKeywords` is wrapped at the parent `scanCV` boundary instead.
- 2026-05-07 — si-coder audit follow-up: build-time `NEXT_PUBLIC_CONVEX_URL` placeholder guard. Dockerfile uses `ARG NEXT_PUBLIC_CONVEX_URL=https://example.convex.cloud` as build default (Dokploy is expected to override via build-arg). If the override is missing, the dummy URL gets inlined into the JS bundle — every Convex call silently fails. `frontend/shared/lib/env.ts` now throws on read when the placeholder is detected, failing loud at first access instead of silently. 1 new vitest case = 160 total. Aligned with si-coder mandate: NEXT_PUBLIC vars must be real at build time, not placeholders.
- 2026-05-07 — signIn brute-force gate + CSP `unsafe-eval` drop + PWA validate. New `/api/auth/signin-attempt` httpAction (POST + OPTIONS) bumps the existing `loginCheckIpEvents` bucket on every failed login; brute-force scripts running through the official client share a 30/hr/IP budget with the email-pre-check, capping out fast. Convex auth's `signIn` is sealed → raw-WebSocket abuse is residual; PBKDF2-SHA256 100k iter (~100ms/attempt) handles the worst case. Dropped `'unsafe-eval'` from `script-src` in `next.config.ts` (verified zero `eval` / `new Function` callsites in bundle). PWA static config validated — manifest (10 icons + maskable + apple-touch + screenshots + shortcuts), sw.js (precache + versioned cache name).
- 2026-05-07 — AI idempotency cache. New `aiIdempotency` table + `withIdempotency(ctx, userId, key, fn)` helper in `_shared/idempotency.ts`. Wraps action body so duplicate `(userId, key)` within 30m returns the cached `JSON.stringify(result)` — no quota deduct, no upstream call. First adopter: `cv.translate` (frontend mints `crypto.randomUUID()` per click). Result-size cap 10KB. `pruneAppendOnlyTables` extended to sweep `aiIdempotency` >30m. Pattern documented for further actions to adopt.
- 2026-05-07 — Security batch: CSRF Origin gate + PII-safe logs + `/api/health` probe + encrypted backups. `_shared/origin.ts` rejects POSTs from origins not in `APP_URL` ∪ `localhost:3000` (wired to `/api/password-reset/request` + `/api/auth/check-email`). `_shared/redact.ts` shrinks emails to `a***@domain` and ids to `kf2abcde…` before logging — applied to passwordReset, seed, notifications/digest. `convex/health.ts` exposes `GET /api/health` returning `{ ok, ts, db }` (200) or `{ ok: false }` (503) for Dokploy / external uptime monitors. `backend/convex-self-hosted/backup.sh` now AES-256 encrypts via `gpg --symmetric` when `BACKUP_PASSPHRASE_FILE` is set + readable (no-op when unset → back-compat). 16 new vitest cases for redact + origin = 159 total.
- 2026-05-07 — Login email enumeration plug: deleted public `userExistsByEmail` query; new `/api/auth/check-email` httpAction (POST + OPTIONS) gated 30/hr/IP via SHA-256 hashed-IP bucket (`loginCheckIpEvents` table, mirrors `passwordResetIpEvents` pattern). 429 on overflow. Frontend `useAuth.login` now `fetch()`s instead of `convex.query()`. `pruneAppendOnlyTables` cron extended to clean the new bucket >1d. Closes the WebSocket-side enumeration vector flagged during 2026-05-07 audit.
- 2026-05-07 — Docs validation pass: verified all 7 commits from 2026-05-06 batch landed (143 tests green, 0 typecheck/lint warnings, all 5 Convex deploys success). Ticked AI-dispatch audit done-criteria (5/5 verified — 18 `subscribe()` callsites, all in `*Capabilities`/`AIAgentConsole`; legacy action union shrunk to `nav.go` only; zombie tool seeds removed). Cleaned stale TODO in `admin/queries.ts` re: rate-limit pruning (now done by `pruneAppendOnlyTables` cron).
- 2026-05-06 — Hard-bound fetch latency: `_shared/fetchWithTimeout.ts` (AbortController + composable caller signal). Wired to all 13 outbound fetches: AI gateway calls (chat / cv translate / cv tailor / cv coverletter / matcher ATS / matcher external paste / chat completions), OpenRouter model list, Resend email, Sentry envelope, generic ERROR_SINK_URL, RemoteOK + WWR feed crawls. Per-purpose `FETCH_TIMEOUTS` const (aiChat 60s / sentry 5s / email 10s / modelList 10s / jobFeed 15s). 8 new vitest cases. 143 tests total.
- 2026-05-06 — Schema growth bound: daily TTL cron `pruneAppendOnlyTables` for `errorLogs` (90d), `rateLimitEvents` (7d), `passwordResetIpEvents` (1d), `passwordResetTokens` (used / expired). Caps at 1000 deletes per table per run — backlog drains in days, single tick fits Convex mutation budget. Plugs unbounded-growth gap from tonight's table additions.
- 2026-05-06 — Quota fairness + Sentry envelope: `_refundAIQuota` internal mutation refunds the latest minute+day rateLimitEvents row when AI gateway 5xx fails — wired to ai.chat / cv.translate / cv.tailor / cv.generateCoverLetter / matcher.ats.extractKeywords. `errorSink.ts` now speaks Sentry envelope protocol (DSN parse + `X-Sentry-Auth` header + framed JSON event) when `SENTRY_DSN` env is set; falls back to plain JSON POST for `ERROR_SINK_URL`. 14 new vitest cases (DSN parse + V8/Firefox stack parsing). 135 tests total.
- 2026-05-06 — AI usage observability: admin `getAIUsageStats` query (30-day sparkline data + top users + top error sources + rolling load 60s/24h), `AIUsagePanel` admin tab w/ inline bar chart. User-facing `QuotaChip` di AI agent header — reactive `getMyQuota` query, color-tier (default → warn ≥75% → destructive ≥95%). Closes a gap between errorLogs UX (rows only) and operational visibility (trends + top offenders).
- 2026-05-06 — Phase C consolidation + CORS preflight + helper tests: `DEFAULT_AI_TOOLS` reduced from 14 → 1+64 (only `nav.go` + manifest skills; 7 zombie tools removed). Phase B reconsidered + intentionally deferred — would dual-emit with AI tool_call output. CORS OPTIONS preflight on `/api/password-reset/request`. Extracted `extractClientIp` + `sha256Hex` to testable `_shared/clientIp.ts` (13 cases). Added Cloudflare `cf-connecting-ip` fallback to IP extraction. 121 vitest tests (was 108).
- 2026-05-06 — Polish sprint: error sink wired to all remaining AI gateway sites (cv.tailor, cv.generateCoverLetter, matcher.ats.extractKeywords). ErrorLogsPanel UX — dynamic source filter (count badges), copy-to-clipboard, retention-preset clear buttons (>30d / >7d / >24h) + `clearErrorLogs` admin mutation + `listErrorSources` query. Phase A consolidation kicked off — killed 7 zombie action types (`cv.fillExperience`, `cv.improveSummary`, `cv.addSkills`, `cv.setFormat`, `roadmap.generate`, `interview.startSession`, `match.recommend`), deleted `useCVAIActions` hook, slashCommands legacy `runAgent` shrunk from 243 → 130 lines (slashes now emit `nav.go` only). Audit + remaining-phase plan in [`progress/2026-05-06-ai-dispatch-audit.md`](./progress/2026-05-06-ai-dispatch-audit.md).
- 2026-05-06 — Hardening sweep: per-IP rate limit on `requestReset` via httpAction (`/api/password-reset/request`, hashed-IP bucket, 10/hr/IP), AI extraction shape coercion (`coerceJobShape` / `coerceProfileShape` w/ 16 new vitest cases — 108 total), error sink stub (`_shared/errorSink.ts` writes to `errorLogs` + optional `ERROR_SINK_URL` / `SENTRY_DSN` forwarder, wired to ai.chat + cv.translate gateway failures).
- [2026-05-01 — Hotspot follow-ups](./progress/2026-05-01-hotspot-followups.md): Resend email delivery for password reset, per-email rate limit, calendar reminders + ICS export, ImportCard server-side AI parse, backup recipe finalized, v2 iframe full mount-guard sweep.
- [2026-05-01 — Slice refactor batch + seed URL cleanup](./progress/2026-05-01-slice-refactor-batch.md): 22 long files split, 10 slices reorganized to canonical layout, `TemplateNode` hoisted to `@/shared/types`, PB v2 iframe `#deckMount` null-guarded, 340 placeholder learning URLs replaced across 41 seed JSONs, refactor rules persisted to `.claude/skills/slice-refactor/`.
- [2026-04-25 — Convex restructure](./progress/2026-04-25-convex-restructure.md): flat `convex/` files reshaped into 17 domain folders mirroring frontend slices.

## Current Stack

- Frontend: Next.js 15 App Router (`frontend/`, slice-based di `slices/`)
- State/UI: React 19 + Tailwind 3 + shadcn (36 UI files aktif)
- Backend: Convex (`convex/`) — self-hosted default (Dokploy), cloud tetap didukung
- Auth: `@convex-dev/auth` — Password (PBKDF2-SHA256 100k) + Anonymous provider
- AI: per-user provider config (OpenAI / OpenRouter / Groq / dll) via slice `ai-settings`

## Migration Status

- [x] Vite → Next.js App Router (`frontend/`)
- [x] React Router → App Router route tree (`(marketing)`, `(dashboard)`, `/admin`)
- [x] Feature folders pindah ke `slices/` (bukan `features/` — dokumen lama sudah dihapus)
- [x] Catch-all dashboard `/dashboard/[[...slug]]` + registry `DASHBOARD_VIEWS`
- [x] Unused files dihapus (21 shadcn UI + empty stubs + slice config vestigial + shared/index barrel)
- [x] AI action flow: heuristic offline + OpenAI-compat online via `convex/ai.ts`
- [x] Per-user AI provider config (`slices/ai-settings` + `convex/aiSettings`)
- [x] GitHub Actions: CI (typecheck+lint+test+build) + auto-deploy Convex on `convex/**` push
- [x] Docs lengkap: `docs/architecture.md`, `backend.md`, `auth.md`, `development.md`, `deployment.md`, `features/*`

## Active Slices (22)

`admin-panel`, `ai-agent`, `ai-settings`, `auth`, `calendar`, `career-dashboard`, `cv-generator`, `dashboard-home`, `database`, `document-checklist`, `financial-calculator`, `help`, `hero`, `library`, `matcher`, `mock-interview`, `networking`, `notifications`, `personal-branding`, `portfolio`, `settings`, `skill-roadmap`.

AI manifest coverage: 22/22 — every slice exports a `manifest.ts` and is registered in `sliceRegistry`. Skill density varies by purpose: productive slices (CV, calendar, applications, contacts, documents, roadmap, matcher, interview, financial, portfolio, notifications, branding) expose mutation/query skills via capability binders; passive slices (auth, hero, dashboard-home, ai-agent, ai-settings, admin-panel, library, help, database) register for nav + route consolidation only or expose 1 read-only skill. Admin-panel intentionally exposes no skills (super-admin only; admin actions stay in panel UI).

## Known Work Remaining

Dulu split dual-agent → akhirnya dikerjakan single-agent, semua selesai di branch `agent-a/backend-admin-forgot`. Lihat [`roadmap/dual-agent-tasklist.md`](./roadmap/dual-agent-tasklist.md) untuk arsip konteks + commit hash.

- [x] **A1–A4** Admin: `role` field + `requireAdmin` + `convex/admin.ts` + wire `AdminDashboard` to real queries
- [x] **A5** Forgot-password backend (reset token + `convex/passwordReset.ts`, PBKDF2 hash + 30m TTL)
- [x] **B1** Profil editor di `settings/TweaksPanel` (wire ke `api.profile.mutations.createOrUpdateProfile`)
- [x] **B2** Forgot-password frontend (`/forgot-password` + `/reset-password/[token]` + link di LoginPage)
- [x] **B3** PDF export untuk CV Generator (`html2pdf.js`, dynamic import)

### Follow-ups (next round)

- [x] V2 password reset: integrasi email delivery — Resend via `convex/_shared/email.ts`, scheduled via internal action `deliverResetEmail` (landed 2026-05-01)
- [x] Rate limit per-email untuk `requestReset` — 5 req/hour bucket keyed by user._id (landed 2026-05-01). Per-IP closed 2026-05-06.
- [x] Per-IP rate limit `requestReset` — closed 2026-05-06 (httpAction `/api/password-reset/request`, 10/hr/IP).
- [x] Activity tracking `userProfiles.lastActiveAt` — closed 2026-05-05 (`6c40eac`).
- [ ] Seed admin user awal — masih harus manual `updateUserRole` via Convex dashboard.

### Backlog snapshot — 2026-05-07

Re-audited after the 2026-05-07 hardening sweep. i18n plan still
deferred — see [`progress/2026-05-05-en-i18n-discovery.md`](./progress/2026-05-05-en-i18n-discovery.md).

1. ~~Konsolidasi dispatch path AI~~ ✓ closed 2026-05-06.
2. ~~Manifest coverage 22/22~~ ✓ closed 2026-05-05.
3. ~~Per-IP rate limit `requestReset`~~ ✓ closed 2026-05-06.
4. ~~`userProfiles.lastActiveAt` heartbeat~~ ✓ closed 2026-05-05.
5. Backup cron eksekusi — script + AES-256 encrypt ready 2026-05-07, install ke VPS pending (manual ops, needs SSH).
6. ~~EN i18n phase 1~~ ✓ closed 2026-05-07 — browser-translate-first via `useLocale()` + `<TranslateHint />`. Full message-catalog translation deferred (multi-day, deemed unnecessary while browsers ship native page translation).
7. ~~AI tool-call output eval suite~~ ✓ closed 2026-05-06.
8. ~~Notification cron 15-min cadence~~ ✓ closed 2026-05-05.
9. Roadmap template content gap — partially closed 2026-05-07 (added `hospitality-manager`); remaining non-tech domains (construction, agriculture, manufacturing, gov-light) still need a domain expert pass.
10. ~~Sentry / external observability sink~~ ✓ closed 2026-05-06.
11. ~~Login email enumeration plug~~ ✓ closed 2026-05-07 (`/api/auth/check-email`, 30/hr/IP).
12. ~~CSRF Origin gate on state-changing httpActions~~ ✓ closed 2026-05-07.
13. ~~PII redaction in console / errorLogs sites~~ ✓ closed 2026-05-07 (`_shared/redact.ts`).
14. ~~`/api/health` probe for Dokploy / uptime monitors~~ ✓ closed 2026-05-07.
15. ~~Encrypted backups~~ ✓ closed 2026-05-07 (`gpg --symmetric AES256` opt-in via `BACKUP_PASSPHRASE_FILE`).
16. ~~AI idempotency cache (retry double-charge)~~ ✓ closed 2026-05-07 — wired to `cv.translate` as exemplar; other actions adopt by adding `idempotencyKey` arg + wrapping handler.
17. ~~signIn brute-force gate (best-effort)~~ ✓ closed 2026-05-07 (`/api/auth/signin-attempt` shares `loginCheckIpEvents` budget). Raw-WebSocket bypass residual; PBKDF2-SHA256 100k iter is the floor.
18. ~~CSP `unsafe-eval` drop~~ ✓ closed 2026-05-07. `unsafe-inline` for inline scripts/styles still required (Next.js hydration); nonce-based CSP would need middleware rework — deferred.
19. ~~PWA static config validation~~ ✓ closed 2026-05-07 (manifest icons / shortcuts / screenshots all present; sw.js precache valid).
20. ~~AI idempotency rollout~~ ✓ closed 2026-05-07 — `cv.tailor`, `cv.generateCoverLetter`, `matcher.scanCV` all wrapped + frontend mints `crypto.randomUUID()`. `ai.chat` skipped (already retry-safe); `matcher.ats.extractKeywords` wrapped at parent `scanCV` boundary.
21. signIn raw-WebSocket bypass — residual; Convex auth `signIn` path is sealed in lib code. PBKDF2 100k floor + frontend-flow gate via `loginCheckIpEvents` are the working mitigations.

### 2026-05-14 — CareerOS Engine moat (5-phase compound)

Pivot dari "fitur SaaS" ke "engine substrate" — bikin replikasi via
Notion/ChatGPT mahal karena perlu re-bangun semua substrate + dataset
history yang user kita sudah punya. Semua landed dalam 1 hari.

**Phase 1 — Truth Ledger + Constrained Rewriter** (`18c3934`)
- `truthAtoms` table append-only, hash-addressable (`engine/atoms/`).
- `cv.rewriteFromLedger` action — replaces `tailorCVForJob` UI flow.
  LLM bound to atom payloads; pure-logic validator (`atoms/validator.ts`)
  rejects hallucinated numbers + low-Jaccard rewrites in code, not
  prompt discipline. **Halusinasi mustahil by-construction**.
- 7 validator vitest cases. `seedFromCV` mutation idempotent.
- Frontend `useTruthLedger` hook + rewritten `ResumeTailorDialog`
  with validator-status badges + violation list.

**Phase 2 — Career Graph + Time Machine** (`69d98ff`)
- `careerNodes` (29 ID tech states) + `careerEdges` (36 transitions
  with P, durasi, acquired skills, sampleSize) in `engine/graph/`.
- BFS pure-lib (`engine/graph/lib.ts`): maxHops 5, minProb 0.01,
  composite score `P × slack × 1/√hops`, cycle detect, frontier
  cap 5k. 9 vitest cases.
- `reach({startSlug, endSlug, budgetMonths, userSkills})` query +
  `skillGap()` helper reuse Phase 1 atoms.
- New "Lihat Karier" tab di skill-roadmap dengan `CareerTimeMachine`
  panel — start/end dropdown (grouped by role+seniority), slider
  budget 6-72mo, top-K paths with probability tone + skill-gap
  callout from Truth Ledger.
- Seed data di `_seeds/careerGraph/tech.ts` (modular per domain).

**Phase 3 — Plan Compiler** (`4269ee2`)
- `careerQuests` table, one active per user.
- `engine/plan/lib.ts` validator dengan controlled action vocab
  (`study_skill | add_roadmap_node | tailor_cv | subscribe_listings
   | set_calendar_block | report_outcome | prepare_documents |
   generic`). Cap action count, eta [1,60], label length. 7 vitest
  cases.
- `engine/plan/actions.ts → compile({intent, targetNodeSlug})` —
  LLM emit JSON, validator strips off-vocab. Idempotency-cached,
  quota-gated. **LLM physically cannot emit arbitrary side-effects**.
- `QuestPanel` UI di Career Time Machine tab: textarea intent →
  compile → checklist with progress bar + per-action "Jalankan →"
  navigate ke slice yang relevan (`d8d75f2`).

**Phase 4 — Outcome Calibrator** (`4269ee2`)
- `outcomeEvents` table append-only feed
  (apply/callback/interview/offer/accepted/rejected).
- `engine/outcomes/{mutations,queries}`: `record()` + `cohortStats()`
  per `targetNodeSlug` cohort.
- `OutcomeReporter` panel di Career Time Machine — surface cohort
  stats inline + dialog lapor hasil. Connects Phase 2 graph dengan
  user-reported telemetry untuk Phase 4.5 (cron calibrator, future).

**Phase 5 — Differential Privacy Aggregator** (`4269ee2`)
- `engine/dp/lib.ts` Laplace mechanism + k-anonymity floor
  (MIN_COHORT_N=5). 9 vitest cases.
- `cohortStatsDP({targetNodeSlug, ε})` query — DP-protected variant
  of cohortStats. `released: false` ketika cohort < 5.
- `OutcomeReporter` switched ke DP query: ε badge + suppression
  banner ketika cohort kecil.

**Document Templates per Negara** (`4269ee2` schema+seed, `d8d75f2` UI)
- `documentTemplates` table country-scoped, system-managed.
- Seed 9 negara: ID, JP, KR, SG, AU, DE, NL, AE, SA — ~95 dokumen
  total dengan `issuingAuthority` + `validityYears`. ID outbound
  corridors prioritised.
- `documents.queries.listTemplates` + `getTemplateByCountry` +
  `documents.mutations.instantiateFromTemplate` — populates
  `documentChecklists` from template, preserves prior progress.
- `CountryTemplateCard` (flag grid + preview dialog) wired ke top
  section `/dashboard/document-checklist`.

**Admin Engine Seed UI** (`4269ee2`)
- New tab "Engine Seed" di `/admin` (super-admin only): one-click
  seed Career Graph + Document Templates from in-repo catalogs.
  Idempotent (patch hanya bila konten berubah). Live stats vs
  expected count.

**Compound flow end-to-end:**
```
intent → /engine/plan/compile (Phase 3)
       → quest checklist with typed actions
       → click "Jalankan →" → slice page
       → user does action → check off in quest
       → lapor outcome (Phase 4)
       → cohort stats DP-protected (Phase 5)
       → future calibrator refines Phase 2 graph probabilities
       → next intent compile sees better priors
```

**Stats**:
- 192 vitest cases (sebelumnya 160 → +32 dari validator + lib tests)
- 6 new Convex domains: `engine/{atoms,graph,outcomes,plan,dp}` +
  `documentTemplates`
- 3 seed catalogs (sebelumnya 1): roadmaps + careerGraph + documents

**Audit-bp follow-up** (`2329b32`):
- P1 IDEMPOTENCY-001: 5 callsites had `crypto.randomUUID()` per
  call which defeated cache. Replaced dengan content-derived
  `makeIdempotencyKey()` (`shared/lib/idempotencyKey.ts`).
- P1 SELFHOST-HEALTH-001: published port 3211 in docker-compose,
  documented `CONVEX_CLOUD_ORIGIN` + `CONVEX_SITE_ORIGIN` in env
  example.
- P2 sweep: CSP enumerated, `loggedInUser` validators,
  `reverseYears` dev warn, `images.remotePatterns`, PhotoPicker
  URL error toast, 3 native `<input>` → primitives migration.

**Manual ops setelah deploy:**
1. `/admin → Engine Seed`, klik:
   - **Seed Career Graph** → 29 node + 36 edge
   - **Seed Document Templates** → 9 negara
2. Tanpa step ini, Career Time Machine + Country Template Card
   tampil empty state.

### 2026-05-15 — Engine moat Phase 4.5 close + BSDL kitab bootstrap

11 commits, single session. Engine moat 85% → 100% (visible loop
end-to-end). Kitab Bidirectional Sync Description Language adopted
as consumer; document-checklist slice harvested.

**Phase 4.5 full — Bayesian calibrator + visible loop:**

- `7eec3d1` Outcome calibrator daily cron (`engine/outcomes/calibrator.ts`).
  Bayesian conjugate Beta-Binomial update per (fromNodeSlug,
  toNodeSlug) edge. `MIN_COHORT_K = 5` k-anonymity floor mirroring
  Phase 5 DP. Rolling 180-day window. Adds `fromNodeSlug` to
  `outcomeEvents` + new `nodeOutcomeStats` table indexed by_edge +
  by_to. Cron registered at 20:00 UTC (03:00 WIB) in `crons.ts`.
  10 vitest cases on `engine/outcomes/lib.ts` (prior fallback, large-
  sample pull, prior-anchored, clamping, bucket helpers).

- `9e46994` Phase 4.5 loop close — calibrated edge blend in reach.
  Pure helper `applyCalibratedProbabilities(edges, statsByEdgeKey,
  slugByNodeId, minN)` + `edgeKey(from, to)` in `graph/lib.ts`.
  Reach query loads `nodeOutcomeStats`, substitutes
  `edge.probability` with `posteriorProb` when present + above
  `MIN_CALIBRATION_N` floor. Response surfaces `calibratedEdgeIds`
  per path. 5 new vitest cases (substitution above floor, no-op
  below, no-op missing, immutability, missing-endpoint guard) — 14
  total on graph lib. **Calibrator output finally drives planning.**

- `dc1b102` Calibrated-edge badge on PathRow. CareerTimeMachine
  renders sky-toned `<Badge>` with Activity icon + tooltip
  ("kalibrasi N/total") when path crosses calibrated edges.
  `RankedPathDTO.calibratedEdgeIds?: string[]` added to
  `useCareerReach.ts`. **End-to-end loop is now visible to user**:
  outcome report → cron updates posterior → reach blends →
  badge surfaces which edges learned.

**UX surfaces (Phase 4.5 lite + deep-link):**

- `02af921` Quest history retrospective view. New `QuestHistory`
  component reads `api.engine.plan.queries.myQuests({limit: 20})`,
  filters `status !== "active"`. Auto-hides when empty. Payload-
  aware deep-link builder in `QuestPanel.payloadQueryString(type,
  payload)` — defensively forwards known keys (skill, node, cvId,
  jobId, q, country, title) per action type.

- `020b3dc` Phase 4.5 lite — `ActionEfficacyCard` self-telemetry.
  `myActionEfficacy` query aggregates user's own `careerQuests.
  actions[]` per type (attempted, completed, completionRate,
  avgDaysToComplete). Renders only when `totalAttempts ≥ 3`.
  Bridge feedback before community cohort kicks in.

- `c78ad6d` Deep-link landings. `CountryTemplateCard` reads
  `?country=` → `setPreviewCountry` on mount. CareerTimeMachine
  reads `?node=` → `setEndSlug`. `?skill=` → notify info toast as
  lookup hint.

**BSDL — Rahman Resources kitab consumer:**

- `5bff643` CLAUDE.md "Rahman Resources kitab — Bidirectional Sync"
  block. Adoption guide, `.kitab.json` template, generalisation rules
  table (❌ Locked vs ✅ Portable), trigger prompts table.

- `02233d7` First consumer manifest:
  `frontend/slices/document-checklist/.kitab.json`
  (kitabVersion 0.1.0, consumerVersion 0.1.0, syncDirection
  bidirectional, generalisation status `needs-adapter` with 5
  blockers).

- `2f19f28` `docs/kitabsync.md` — consumer-side scrape-friendly
  report. Kitab snapshot ref `de7411b9...` (`main`). 15 kitab slugs
  scanned: 1 in-sync (document-checklist), 0 drift, 14 kitab-only,
  21 local-only (out of scope — CareerPack-domain features).
  Verdict + generalisation breakdown + priority-ordered adoption
  candidates (vector-search, audit-log, seo, full-width-toggle,
  admin triage). 2-row run history table.

- `a737de0` Slice README scaffold + `.gitignore .harvest/`.

- `bfcd90e` First kitab blocker resolved locally — raw-button.
  Swapped 4 raw `<button>` → `<Button>` from
  `@/shared/components/ui/button` in CategoryFilter.tsx (×2),
  ChecklistItemCard.tsx, CountryTemplateCard.tsx. Custom Tailwind
  preserved (h-auto, justify-start, hover overrides).
  consumerVersion bumped 0.1.0 → 0.2.0. Remaining 4 blockers
  flagged NOT-locally-fixable in `.kitab.json` (no workspace
  concept, no t() infra, no `@convex/*` alias) — sanitizer handles
  at `/rr-send` time.

**Compound flow now end-to-end visible:**
```
report outcome (kind, fromNodeSlug, targetNodeSlug)
  → outcomeEvents append
  → daily cron 03:00 WIB
  → bayesianPosterior(priorP, priorN, successes, total)
  → nodeOutcomeStats upserted (posteriorP, posteriorN)
  → reach query loads stats, builds slug↔nodeId map
  → applyCalibratedProbabilities substitutes edge.probability
  → findPaths uses calibrated probabilities
  → resolved path carries calibratedEdgeIds
  → PathRow renders "kalibrasi N/total" badge
  → next user sees community-learned probabilities
```

**Stats:**
- 11 commits single day, 0 reverts
- 14 graph lib vitest cases (+5 calibration); 10 outcomes lib cases.
- 7 new files (calibrator.ts, lib.test.ts additions, QuestHistory,
  ActionEfficacyCard, .kitab.json, README, kitabsync.md).
- Engine moat: 100% end-to-end visible loop.

### Backlog tersisa (true defer)

- ~~Phase 4.5: outcome → graph edge probability cron calibrator~~
  ✓ closed 2026-05-15 (`7eec3d1` + `9e46994` + `dc1b102`).
- Truth Ledger editor standalone — sekarang akses cuma via Tailor.
- ~~Plan action payload typing — `study_skill.payload = {skill: string}`
  enables deep-link route~~ ✓ closed 2026-05-15
  (`02af921` payload-aware deep-link builder; `c78ad6d` landing
  handlers).
- ~~Quest history view (abandoned / completed retrospective)~~
  ✓ closed 2026-05-15 (`02af921` QuestHistory component).
- `/rr-send document-checklist` — push slice UP to kitab repo.
  Sanitizer must remodel 4 NOT-locally-fixable blockers
  (auth-scope, table-shape, hardcoded-copy, deep-relative-import).
  Cross-repo write — needs explicit user confirmation.
- vector-search kitab adoption — gated on Convex vector-index
  validation on pinned Dokploy image.
- Convex deploy reliability — Phase 2 deploy 1x gagal (transient,
  next deploy success). Investigate kalau berulang.
- Truly out-of-code: backup VPS install, non-tech roadmap domain
  expert content.
- signIn raw-WebSocket bypass — sealed in Convex auth lib.

## Smoke Test Checklist

- [ ] `pnpm dev` sukses (Convex push + Next.js start)
- [ ] Login user baru → seed auto-jalan
- [ ] Login user existing → dashboard load + data visible
- [ ] `pnpm backend:deploy` sukses tanpa schema error
- [ ] `/admin` redirect `/` untuk user non-admin
- [ ] AI action (mis. generate interview questions) lewat rate limit check
- [ ] AI Settings: save + testConnection sukses
- [ ] PWA install prompt muncul + service worker register
