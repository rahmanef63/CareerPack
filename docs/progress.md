# Progress Tracker

Last updated: 2026-05-06.

## Recent batches

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
- [x] Rate limit per-email untuk `requestReset` — 5 req/hour bucket keyed by user._id (landed 2026-05-01). Per-IP masih open (butuh migrate `requestReset` → `httpAction`).
- [ ] Seed admin user awal — masih harus manual `updateUserRole` via Convex dashboard
- [ ] Per-IP rate limit `requestReset` (saat ini hanya per-email)
- [ ] Activity tracking → `userProfiles.lastActiveAt` supaya `admin.listAllUsers` bisa nyajikan kolom itu

### Backlog snapshot — 2026-05-05

Per audit ulang setelah manifest expansion. See [`progress/2026-05-05-en-i18n-discovery.md`](./progress/2026-05-05-en-i18n-discovery.md) for the i18n plan; entries below cover the rest.

1. ~~Konsolidasi dispatch path AI~~ ✓ closed 2026-05-06. Phase A (zombie types) + Phase C (seed cleanup) landed; Phase B intentionally deferred (would duplicate AI tool_call) — rationale di [`progress/2026-05-06-ai-dispatch-audit.md`](./progress/2026-05-06-ai-dispatch-audit.md).
2. ~~Manifest coverage 4 slice produktif tersisa~~ ✓ landed 2026-05-05 (`6c40eac`); 22/22 coverage achieved 2026-05-05
3. ~~Per-IP rate limit `requestReset`~~ ✓ landed 2026-05-06 (httpAction `/api/password-reset/request`, hashed-IP bucket 10/hr)
4. ~~`userProfiles.lastActiveAt` heartbeat tracking~~ ✓ landed 2026-05-05 (`6c40eac`)
5. Backup cron eksekusi (script ready 2026-05-01, install ke VPS pending — manual ops)
6. EN i18n phase 1 (next-intl + `[locale]` segment) — multi-day, 4 decisions pending di discovery doc
7. ~~AI tool-call output eval suite~~ ✓ landed 2026-05-06 (`coerceJobShape` + `coerceProfileShape` + 16 cases)
8. ~~Notification cron cadence: bump dari hourly ke 15-min~~ ✓ landed 2026-05-05 (`6c40eac`)
9. Roadmap template content gap — tambah seed untuk domain non-tech (butuh domain expert)
10. ~~Sentry / observability — wire external sink~~ ✓ landed 2026-05-06 (`_shared/errorSink.ts` + `ERROR_SINK_URL`/`SENTRY_DSN` env)

## Smoke Test Checklist

- [ ] `pnpm dev` sukses (Convex push + Next.js start)
- [ ] Login user baru → seed auto-jalan
- [ ] Login user existing → dashboard load + data visible
- [ ] `pnpm backend:deploy` sukses tanpa schema error
- [ ] `/admin` redirect `/` untuk user non-admin
- [ ] AI action (mis. generate interview questions) lewat rate limit check
- [ ] AI Settings: save + testConnection sukses
- [ ] PWA install prompt muncul + service worker register
