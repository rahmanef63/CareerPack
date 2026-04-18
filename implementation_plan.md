# Implementation Plan

Last sync: 2026-04-18. Dokumen ringkas — detail ada di [`docs/`](./docs/README.md).

## Objective

Jaga baseline stabil:

- Next.js 15 frontend di `frontend/` (slice-based, App Router)
- Convex backend di `convex/` (schema 16 tables, auth + AI actions)
- Self-hosted Convex (Dokploy) sebagai mode prod default
- Convex cloud sebagai alternatif

## Completed

- Migrasi Vite → Next.js selesai
- Semua slice self-contained di `src/slices/` (13 slice)
- Convex auth stable (PBKDF2-SHA256 100k, backward-compat hash)
- Per-user AI provider (slice `ai-settings` + `convex/aiSettings.ts`)
- CI: typecheck, lint, test, build (GH Actions)
- Auto-deploy Convex saat `convex/**` berubah di main
- Cleanup unused file: 21 shadcn UI + vestigial configs + empty stubs + unused shared barrel
- Dokumentasi lengkap: architecture / backend / auth / development / deployment / per-feature

## In Progress

- (user-driven) polishing beberapa slice UI

## Next Targets

1. Admin module backend — `convex/admin.ts` + `requireAdmin` guard → replace mockDataGenerator di AdminDashboard
2. Forgot-password flow — token reset + email provider
3. Profile editor di settings
4. PDF export CV (html2pdf atau server-side Puppeteer action)
5. Tambah Convex scheduled function untuk reminder notification (agenda + document expiry)

## Definition of Done

- `pnpm dev` jalan dengan hanya `.env.local` + `frontend/.env.local` di-set
- Auth flow stabil (user baru + existing)
- Dokumentasi sinkron struktur codebase (run `pnpm typecheck && pnpm lint && pnpm test` hijau)
- Docs entry-points lengkap: `README.md` → `docs/README.md` → topic-specific doc
