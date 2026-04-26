# Progress Tracker

Last updated: 2026-04-20.

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

## Active Slices (18)

`hero`, `auth`, `dashboard-home`, `cv-generator`, `calendar`, `career-dashboard`, `skill-roadmap`, `document-checklist`, `mock-interview`, `financial-calculator`, `settings`, `ai-agent`, `ai-settings`, `admin`, `matcher`, `networking`, `portfolio`, `notifications`.

Placeholder (remaining): `help` — rendered via `DashboardPlaceholders`.

## Known Work Remaining

Dulu split dual-agent → akhirnya dikerjakan single-agent, semua selesai di branch `agent-a/backend-admin-forgot`. Lihat [`roadmap/dual-agent-tasklist.md`](./roadmap/dual-agent-tasklist.md) untuk arsip konteks + commit hash.

- [x] **A1–A4** Admin: `role` field + `requireAdmin` + `convex/admin.ts` + wire `AdminDashboard` to real queries
- [x] **A5** Forgot-password backend (reset token + `convex/passwordReset.ts`, PBKDF2 hash + 30m TTL)
- [x] **B1** Profil editor di `settings/TweaksPanel` (wire ke `api.profile.mutations.createOrUpdateProfile`)
- [x] **B2** Forgot-password frontend (`/forgot-password` + `/reset-password/[token]` + link di LoginPage)
- [x] **B3** PDF export untuk CV Generator (`html2pdf.js`, dynamic import)

### Follow-ups (next round)

- [ ] V2 password reset: integrasi email delivery (Resend/SMTP) — ganti `errorLogs` insert di `convex/passwordReset.ts`
- [ ] Seed admin user awal — sementara harus manual `updateUserRole` via Convex dashboard
- [ ] Rate limit per-IP untuk `requestReset` (saat ini hanya default Convex)
- [ ] Activity tracking → `userProfiles.lastActiveAt` supaya `admin.listAllUsers` bisa nyajikan kolom itu (sekarang optional dan selalu absent)

## Smoke Test Checklist

- [ ] `pnpm dev` sukses (Convex push + Next.js start)
- [ ] Login user baru → seed auto-jalan
- [ ] Login user existing → dashboard load + data visible
- [ ] `pnpm backend:deploy` sukses tanpa schema error
- [ ] `/admin` redirect `/` untuk user non-admin
- [ ] AI action (mis. generate interview questions) lewat rate limit check
- [ ] AI Settings: save + testConnection sukses
- [ ] PWA install prompt muncul + service worker register
