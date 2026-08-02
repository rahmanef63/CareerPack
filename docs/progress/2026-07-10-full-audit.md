# Full Audit + Hardening — 2026-07-10

Autonomous multi-agent session. Scope: root-cause the "self-refresh" bug, verify
all functions + UI/UX, propose 10 features + 10–20 fixes, run tests, cleanup dead
files, produce 20 investor/market FAQs (fix weak answers). Portfolio project —
target is "maximal", not "100% perfect".

Modes active: caveman (terse), ponytail (lazy/minimal), ultracode (multi-agent workflows).

## Activity log

| time | phase | action | result |
|------|-------|--------|--------|
| start | scout | read SW/PWA/auth suspects, ran test suite | 472 tests pass |
| +1 | verify | inspected `.next/standalone` output + `server.js` chdir | build-id loop DISPROVEN |
| +1 | verify | read `sw.js` + `pwa.ts` | SW-reinstall loop DISPROVEN; found stale CACHE string bug |
| +1 | orchestrate | launched audit workflow (6 investigators) + FAQ workflow (3 phases) | running background |
| +7min | FAQ | 20 FAQs generated + scored + weak ones rewritten | done → `docs/faq-market-investor.md`; only #14 market-size was weak (3→revised), rest 4–5 |
| ship | fixes | applied + verified 11 fixes, cleanup, shipped `d0bba38` | typecheck+472 tests+lint pass; BUILD_ID fix verified |
| loop 1 | feature | deterministic CV PDF export (rAF-gated, no 50ms race) | typecheck+test+lint pass; `CVGenerator.tsx` |
| loop 2 | feature | unread-notification bell + live badge (header + sidebar nav + mobile MoreDrawer tile) | gate pass; new `useUnreadNotifications` hook; not visually verified |
| cv/pb | investigate | 4-agent trace of CV preview + personal-branding "weirdness" | root causes found (see below) |
| cv/pb | fix | PB preview flicker (debounce + stable key + reset-on-template-only), portfolio order, CV export quality | gate pass; frontend-only shipped |
| loop 3 | feature | offline banner — ALREADY EXISTS (`OfflineBanner` + `useOnlineStatus`, mounted) | skipped, no duplicate |
| loop 4 | feature | graceful "Versi baru tersedia" toast w/ Muat-ulang action (UpdateChecker no longer silently reloads) | gate pass; `UpdateChecker.tsx` |

## CV preview + Personal-branding "weirdness" (multi-agent trace)

**CV preview — root:** what you see in the live preview isn't what survives save/export.
**Personal branding — root:** the in-app preview and the published `/[slug]` page run two
different code paths that disagree, and the preview iframe rebuilt its whole `srcDoc` on
every keystroke.

### Fixed + shipped (frontend-only)
- **PB preview iframe flicker (HIGH)** — `TemplateLayout.tsx`: (1) debounce the branding fed
  to the iframe `srcDoc` (~300ms) so it rebuilds on typing pause, not per keystroke; (2) reset
  iframe height only on an actual template swap (was keyed on the per-keystroke `branding`
  object → collapse/jump); (3) drop `identity.name` from the iframe React `key` (was forcing a
  full remount while typing the name).
- **PB portfolio card order** — `usePreviewBranding.ts`: sort visible portfolio featured-first
  then date-desc to match the published page (preview kept raw creation order).
- **CV export quality** — `exportPDF.ts`: JPEG 0.92→0.96 (less glyph ringing); `long` layout
  now paginates instead of silently clipping content past the 5000 mm clamp.

### Flagged — NOT auto-applied (need backend deploy or visual QA)
- **CV accent color reverts on reload (HIGH)** — `convex/cv/schema.ts` displayPrefs omits
  `accentColor` so it's stripped on save. Fix is a coupled frontend+backend change (schema +
  mutation validator + `useCV` merge/payload); shipping the frontend half alone would make
  Convex's strict validator **reject every CV save**. Apply + `pnpm backend:deploy` TOGETHER
  after the admin-key rotation.
- **CV export blur tracks window width (MED)** — capture node sits inside the preview's
  `transform:scale()`; effective DPI is 3×scale. Fix: html2canvas `onclone` clears ancestor
  transforms, or render an off-screen 794px node. Needs a real export eyeballed.
- **CV export: cross-origin photos blank in PDF (MED)** — `useCORS` with no fallback; inline
  photos as data: URIs before capture. Needs visual QA (could regress working same-origin photos).
- **CV multi-page PDF slices text/photo across A4 breaks (MED, L)** — raster paginated with no
  break-avoidance; needs content-aware pagination. Bigger change, visual QA.
- **PB preview shows RICHEST CV, published shows NEWEST CV (HIGH)** — `getBySlug` vs
  `usePreviewBranding` pick different CVs. Fix: one shared `pickPrimaryCv()` (convex + frontend →
  needs deploy).
- **PB sparse profiles fall back to a legacy layout when published** (`app/[slug]/page.tsx`
  renders legacy `ProfileView` when `blocks` empty) — a product decision on which renderer wins.
- **PB "Tombol sosial" toggle is a no-op in Auto mode**, and the **Preview dialog's Mobile
  viewport is missing the floating bottom nav** — both MED, need coordinated changes + QA.

## Baseline

- Tests: **472 pass / 41 files** (`pnpm test`, 3.4s).
- Tracked files: 1021 (frontend 670, convex 256, docs 58).
- Git: branch `main`, working tree has `.env.local.premig`, `.env.local.selfhost` untracked.

## Self-refresh — verified analysis

Two leading hypotheses DISPROVEN by inspecting the real `.next/standalone` output:

1. **Build-id mismatch loop — DISPROVEN.** `server.js:6` does `process.chdir(__dirname)`
   → cwd = `/app/frontend`, so `/api/build-id` reads `/app/frontend/.next/BUILD_ID`
   correctly (returns real id `bmr55r4f8`, not "unknown"). Client-baked
   `NEXT_PUBLIC_BUILD_ID` == `.next/BUILD_ID` within one build. So `UpdateChecker`
   works as intended: reloads ONCE when a genuinely newer deploy lands. Only caveat:
   frequent deploys → mid-session users get one reload each (arguably intended). The
   `Date.now()` fallback is fragile but not the loop.

2. **SW re-install loop — DISPROVEN as primary.** `sw.js` CACHE = static string
   `careerpack-v23-2026-04-30-pwa-offline`, never bumped since Apr 30. Since sw.js
   bytes never change across deploys, the browser never detects a SW update →
   `SWUpdatePrompt` skip-waiting rarely fires. (This is itself a latent bug — the
   versioned-cache eviction the comment promises never runs — but it does not cause
   refreshes.)

**Leading remaining cause: auth bounce.** RouteGuard grace period (commit 7115272,
2500ms) narrows but doesn't eliminate: if Convex WebSocket reauth takes >2500ms on
flaky mobile, RouteGuard still `router.replace(/login)` then back = perceived refresh.
Audit workflow ranking the remaining candidates (Convex client re-instantiation,
provider churn, marketing→dashboard redirect fights).

## Self-refresh — CONFIRMED root cause

`next.config.ts:152` `BUILD_ID = GITHUB_SHA?.slice(0,12) || b<Date.now()>`. GitHub
Actions disabled → Dokploy Docker build sets no `GITHUB_SHA` → the `Date.now()` branch
runs. **Next re-evaluates `next.config.ts` once per compiler pass** (build orchestrator /
generateBuildId, server bundle, client DefinePlugin), so each freezes a DIFFERENT
millisecond. Proven from the local build output:
- `.next/BUILD_ID` (served by `/api/build-id`) = `bmr55r4f8`
- client `layout` chunk froze `NEXT_PUBLIC_BUILD_ID` = `bmr55rgky`
- `grep bmr55r4f8 .next/static` → **empty** (the served id is nowhere in the client bundle)

So `UpdateChecker`'s `localBuildId` (`bmr55rgky`) can NEVER equal `/api/build-id`
(`bmr55r4f8`) → `forceFreshReload()` (SW unregister + Cache purge + `location.replace`)
fired on mount, every 5 min, and on every focus (throttled to one per 90 s). That is the
"refresh sendiri". Confidence ~0.95 (empirically verified, not just reasoned).

My first-pass disproof was WRONG: I compared `.next/BUILD_ID` to `server.js`'s inlined
`env` (both `bmr55r4f8`) and never checked the actual client chunk. The audit agent did.

**Fix applied:** `next.config.ts` now resolves a single stable id (injected env →
`GITHUB_SHA` → memoized temp file shared across passes); `Dockerfile` sets
`NEXT_PUBLIC_BUILD_ID` once for the whole build (`${BUILD_ID:-b$(date +%s)}`) so every
pass agrees, race-free. `/api/build-id/route.ts` gained the `frontend/.next/BUILD_ID`
path candidate (defensive). Result: client == `.next/BUILD_ID` → UpdateChecker fires
exactly once per *real* deploy.

**Secondary (also fixed):** RouteGuard swapped the whole dashboard for a spinner on every
Convex WS auth blip (the 2500 ms grace only wrapped the redirect, not the render). Added
`hasPassedRef` — once a protected route has rendered, transient auth drops keep the
content instead of flashing a spinner. And `logout()` now `await signOut()` BEFORE
navigating, killing the landing→dashboard→spinner→login bounce.

## Fixes applied (this session)

| # | severity | fix | files |
|---|----------|-----|-------|
| 1 | critical | self-refresh: stabilize BUILD_ID across compiler passes | `next.config.ts`, `Dockerfile`, `api/build-id/route.ts` |
| 2 | critical | gitignore `.env.local.*` so live self-hosted admin key can't be `git add`-ed | `.gitignore` |
| 3 | high | perceived self-refresh: RouteGuard `hasPassedRef` (no spinner swap on WS blip) | `RouteGuard.tsx` |
| 4 | high | SSRF: deny-list private/loopback/metadata hosts for custom AI `baseUrl` | `convex/ai/mutations.ts` |
| 5 | medium | logout bounce: `await signOut()` before nav | `useAuth.tsx` |
| 6 | medium | calendar filter chip: `text-white`→`text-brand-foreground` (illegible on light presets) | `CalendarView.tsx` |
| 7 | low | AI response shape guard (clean Indonesian error, not raw TypeError) | `convex/ai/actions.ts` |
| 8 | low | `prefers-reduced-motion` global honor | `App.css` |
| 9 | low | NotificationsView wrapped in `PageContainer` (column rhythm) | `NotificationsView.tsx` |
| 10 | low | document `REDACT_LOGS_TO_CLIENT=true` | `convex.env.example` |
| 11 | — | landing FAQ: +5 grounded items (ATS scanner, STAR, tracker, AI approval, quota) | `faqItems.ts` |

## Cleanup (applied)

- Deleted `implementation_plan.md` (stale, 0 refs).
- Deleted 5 unreferenced shadcn wrappers (~920 lines): `responsive-{combobox,context-menu,data-table,filter-bar,hover-card}.tsx` (grep-verified 0 external refs).
- Removed 3 unused deps: `zod`, `react-hook-form`, `@tanstack/react-table` (0 import sites; `-4` packages).
- Left `coverage/` (gitignored local artifact) and `.env.local.*` (see manual follow-ups).

## 10 suggested developments (perkembangan)

1. **Graceful "update available" toast** instead of silent `forceFreshReload` — preserve in-progress CV/form state on deploy. (high / M)
2. **Unread-notification bell + live badge** in header/BottomNav/sidebar — the count exists but is invisible. (high / M)
3. **Debounced/settled auth signal** in `useAuth` — kills the whole perceived-refresh class at the source. (high / M)
4. **Email verification for Password sign-up** — closes the admin-bootstrap-by-email escalation path. (high / M)
5. **App-wide reduced-motion** (partly shipped as fix #8; extend to the React motion layer). (medium / S)
6. **Live notification count on the sidebar nav badge**. (medium / S)
7. **Offline/reconnecting banner** from Convex connection state. (medium / M)
8. **Deterministic CV PDF export** — replace the 50 ms `setTimeout` race with an effect gated on the mounted ref. (medium / M)
9. **BYOK AI key encryption at rest** (`aiSettings.apiKey` is plaintext). (medium / L)
10. **Consistent `PageContainer` width rhythm** across all dashboard pages (started with #9). (low / S)

## Manual follow-ups — NOT auto-applied (need you / irreversible)

- **ROTATE the self-hosted Convex admin key** (`/rotate-admin-key`). `.env.local.selfhost`
  held a live 85-char `CONVEX_SELF_HOSTED_ADMIN_KEY` for `api.careerpack.org` in plaintext
  on disk. Now gitignored so it can't leak via `git add`, but since it sat unprotected,
  rotate it. Then delete `.env.local.selfhost` + `.env.local.premig` (I left them — they're
  your live local files; deleting a key file autonomously is destructive).
- **Admin/super-admin gate keys off unverified `user.email`** (`convex/_shared/auth.ts`) —
  on a fresh/wiped deploy whoever registers the super-admin email first becomes admin.
  Deferred (changing the gate could lock out your own admin access). Fix = gate on Google
  (verified) provider or a server-set flag.
- **Pin `CONVEX_SELF_HOSTED_IMAGE`** to a digest in Dokploy (compose default is `:latest`).
- **audit-bp score: 68 → ~85** once the key rotation + admin-gate land (SSRF already fixed).

## Ship result

- Commit `d0bba38` pushed to `main` (`6684704..d0bba38`).
- Pre-push quality gate (typecheck + 472 vitest) **PASSED**.
- BUILD_ID fix **verified end-to-end**: after a fresh build, `.next/BUILD_ID`,
  the client chunk, and the memo file all read the same id (`bmreiwep4`).
- Frontend ships via Dokploy webhook → self-refresh fix goes live.

### ⚠ Convex backend deploy BLOCKED (pre-existing, not from this change)

Pre-push `pnpm backend:deploy` failed: `BadAdminKey: admin key was invalid for
this instance` at `http://127.0.0.1:3210` (+ a `self-signed certificate` error).
The self-hosted admin key in `backend/convex-self-hosted/convex.env` is out of
sync with the running backend — the same desync the audit flagged. Pushed with
`SKIP_CONVEX_DEPLOY=1` (sanctioned bypass) since my convex changes (SSRF guard,
AI shape guard) are additive hardening with no frontend contract dependency.

**To deploy the backend hardening:** run `/rotate-admin-key` (syncs the key across
container + Dokploy + local env), then `pnpm backend:deploy`. Until then, the
SSRF deny-list and shape guard live in the repo but not on the running backend.

## Deliverables

- 20 market+investor FAQs → `docs/faq-market-investor.md` (only #14 market-size scored <4, rewritten).
- This activity log.
- Skills: `/ponytail:ponytail-audit` intent ran as the audit's cleanup dimension
  (found + removed 5 dead wrappers, 3 unused deps, 1 stale doc). `/goal` is not an
  available skill in this environment — skipped.

## Follow-up: CV preview clip + Personal Branding config (user report)

- **CV "Lihat CV" cut off**: sidebar mini-preview was clipped by the sticky
  container `max-h` for 2-page CVs (dialog fine — own scroll). Made the compact
  preview a self-bounded scrollable thumbnail (`maxHeight:60vh`, `overflowY:auto`).
  `ScaledCVPreview.tsx`.
- **Personal Branding misconfig** (subagent traced all 3 render paths; 3 safe
  frontend-only fixes applied):
  1. `usePBForm` sent `slug:""` on "Simpan Draft" → mutation `assertSlug("")` threw
     → nothing persisted for pre-publish users. Now `slug: slugTrimmed || undefined`.
  2. `usePreviewBranding` picked the *richest* CV while the live page picks the
     *newest* → preview ≠ published. Now both use newest (`_creationTime` desc).
  3. Saved custom-mode users landed on the Otomatis tab (lazy init ran pre-hydrate)
     → block builder hidden. Added one-shot `serverState.mode` sync.
- **Deferred (flagged, not applied)**: (4) hidden bio/skills/CV data still ship in
  the public `/[slug]` payload even when toggled off — real privacy leak, but the
  fix is in `convex/profile/brandingPayload.ts` (needs coordinated Convex deploy).
  (5) near-empty auto profiles render legacy `ProfileView` live vs template in
  preview — needs maintainer decision on dropping the legacy path.
