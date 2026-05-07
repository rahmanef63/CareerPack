# Progress Tracker

Last updated: 2026-05-07.

## Recent batches

- 2026-05-07 — Roadmap content gap (partial): added `business/hospitality-manager.json` — 8-node Hospitality & Hotel Management track (Front Office → Housekeeping → F&B → Revenue → Guest Experience → MICE Sales → GM Leadership) with Indonesia-specific resources (PHRI, Kemenparekraf, BPOM HACCP). Marks the start of clearing the "non-tech domain" gap; remaining domains (construction, agriculture, manufacturing) still need a domain expert pass.
- 2026-05-07 — i18n phase 1 — browser-translate-first locale primitive. New `useLocale()` hook + `LocaleProvider` (id ↔ en, persisted to localStorage, auto-detects from `navigator.language`). Bound `Intl.*` formatters pivot date / number / currency between `id-ID`+IDR and `en-US`+USD. `<TranslateHint />` shows a one-time dismissible banner to non-id browsers pointing to right-click → Translate. Settings → Appearance → "Bahasa & Format" surfaces the toggle with a live sample. Existing `formatDate.ts` (50+ callsites, hard-coded id-ID) untouched this round — that refactor is the obvious next step. Aligns with the user's directive: "as dynamic as possible, lean on browser auto-translate."
- 2026-05-07 — Idempotency rollout to remaining 3 retry-prone actions: `cv.tailor`, `cv.generateCoverLetter`, `matcher.scanCV` each take optional `idempotencyKey` + wrap their handler body via `withIdempotency(ctx, userId, key, () => impl(...))`. Frontend mints `crypto.randomUUID()` per click in the four call sites (CoverLetterDialog, ResumeTailorDialog, useATSScan, MatcherCapabilities). Skipped: `ai.chat` (streaming reconnect already retry-safe via chatConversations history merge); `matcher.ats.extractKeywords` is wrapped at the parent `scanCV` boundary instead.
- 2026-05-07 — si-coder audit follow-up: build-time `NEXT_PUBLIC_CONVEX_URL` placeholder guard. Dockerfile uses `ARG NEXT_PUBLIC_CONVEX_URL=https://example.convex.cloud` as build default (Dokploy is expected to override via build-arg). If the override is missing, the dummy URL gets inlined into the JS bundle — every Convex call silently fails. `frontend/src/shared/lib/env.ts` now throws on read when the placeholder is detected, failing loud at first access instead of silently. 1 new vitest case = 160 total. Aligned with si-coder mandate: NEXT_PUBLIC vars must be real at build time, not placeholders.
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

- Frontend: Next.js 15 App Router (`frontend/`, slice-based di `src/slices/`)
- State/UI: React 19 + Tailwind 3 + shadcn (36 UI files aktif)
- Backend: Convex (`convex/`) — self-hosted default (Dokploy), cloud tetap didukung
- Auth: `@convex-dev/auth` — Password (PBKDF2-SHA256 100k) + Anonymous provider
- AI: per-user provider config (OpenAI / OpenRouter / Groq / dll) via slice `ai-settings`

## Migration Status

- [x] Vite → Next.js App Router (`frontend/`)
- [x] React Router → App Router route tree (`(marketing)`, `(dashboard)`, `/admin`)
- [x] Feature folders pindah ke `src/slices/` (bukan `features/` — dokumen lama sudah dihapus)
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

## Smoke Test Checklist

- [ ] `pnpm dev` sukses (Convex push + Next.js start)
- [ ] Login user baru → seed auto-jalan
- [ ] Login user existing → dashboard load + data visible
- [ ] `pnpm backend:deploy` sukses tanpa schema error
- [ ] `/admin` redirect `/` untuk user non-admin
- [ ] AI action (mis. generate interview questions) lewat rate limit check
- [ ] AI Settings: save + testConnection sukses
- [ ] PWA install prompt muncul + service worker register
