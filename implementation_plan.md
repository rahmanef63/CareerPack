# Implementation Plan (Current)

Dokumen ini menggantikan rencana migrasi lama yang sudah tidak relevan.

## Objective

Menjaga codebase stabil dengan baseline:
- Next.js frontend di `frontend/`
- Convex backend di `convex/`
- Convex cloud dev sebagai mode default
- Self-hosted backend sebagai opsi lanjutan

## Completed

- Migrasi dari root Vite app ke `frontend/` Next.js App Router
- Workspace `pnpm` di root
- Integrasi Convex auth/client di frontend
- Struktur feature slices distandarkan
- Script root disederhanakan (`dev`, `backend:dev`, `backend:push`)

## In Progress

- Hardening auth flow agar tidak menghasilkan error transien pada first login
- Penyederhanaan dokumen operasional developer

## Next Tasks

1. Tambah smoke test manual checklist (`login`, `register`, `seed`, `core navigation`)
2. Rapikan fitur yang masih memakai pola legacy React Router internal
3. Tambah guide deploy production (frontend + convex)

## Definition of Done

- `pnpm run dev` dapat dipakai sebagai jalur default tanpa setup tambahan selain `.env.local`.
- Auth flow stabil untuk user baru maupun user existing.
- Semua dokumentasi sinkron dengan struktur saat ini.
