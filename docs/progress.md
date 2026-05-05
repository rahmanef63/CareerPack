# Progress Tracker

Last updated: 2026-05-01.

## Recent batches

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

1. Konsolidasi 3 dispatch path AI (legacy `useCVAIActions` + `slashCommands` + manifest binder) → satu jalur manifest
2. ~~Manifest coverage 4 slice produktif tersisa~~ ✓ landed 2026-05-05 (`6c40eac`); 22/22 coverage achieved 2026-05-05
3. Per-IP rate limit `requestReset` (migrate ke `httpAction`)
4. `userProfiles.lastActiveAt` heartbeat tracking
5. Backup cron eksekusi (script ready 2026-05-01, install ke VPS pending)
6. EN i18n phase 1 (next-intl + `[locale]` segment)
7. AI tool-call output eval suite (vitest snapshot untuk `parseJobFromText` + `parseImportText` JSON shape)
8. Notification cron cadence: bump dari hourly ke 15-min untuk akurasi reminder
9. Roadmap template content gap — tambah seed untuk domain non-tech (business, health, government, hospitality)
10. Sentry / observability — surface `errorLogs` ke admin UI atau wire external sink

## Smoke Test Checklist

- [ ] `pnpm dev` sukses (Convex push + Next.js start)
- [ ] Login user baru → seed auto-jalan
- [ ] Login user existing → dashboard load + data visible
- [ ] `pnpm backend:deploy` sukses tanpa schema error
- [ ] `/admin` redirect `/` untuk user non-admin
- [ ] AI action (mis. generate interview questions) lewat rate limit check
- [ ] AI Settings: save + testConnection sukses
- [ ] PWA install prompt muncul + service worker register
