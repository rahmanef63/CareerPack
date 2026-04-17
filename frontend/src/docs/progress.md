# Progress Tracker

## Current Stack
- Frontend: Next.js App Router (`frontend/`)
- State/UI: React + Tailwind + shadcn components
- Backend: Convex (`convex/`)
- Default dev mode: Convex cloud dev (`pnpm run backend:dev`)

## Migration Status
- [x] Migrated from root Vite app to `frontend/` Next.js app
- [x] Replaced react-router with Next.js App Router pages (`/`, `/login`, `/admin`)
- [x] Moved feature slices to `frontend/src/features`
- [x] Enforced feature contract:
  - `components/`, `lib/`, `hooks/`, `constants/`, `types/`
  - `config.ts`, `manifest.ts`, `index.ts`
- [x] Preserved Convex backend functions in `convex/`
- [x] Added optional self-hosted Convex setup under `backend/convex-self-hosted`

## Auth and Data Notes
- [x] Convex auth flow connected in frontend
- [x] Added seed mutation (`convex/seed.ts`) for starter data
- [ ] Keep using Convex cloud/dev as default until self-hosted flow is fully stabilized

## Next Cleanup Targets
- [x] Remove/refresh old planning notes that are no longer relevant
- [x] Add smoke test checklist for login, seed, and core dashboard flow
- [ ] Add production deployment notes for Next.js + Convex

## Smoke Test Checklist
- [ ] `pnpm run dev` sukses (Convex push + Next.js start)
- [ ] Login existing user berhasil
- [ ] Login user baru (auto sign-up flow) berhasil
- [ ] `pnpm run backend:push` sukses tanpa error schema/function
- [ ] Admin page guard bekerja (`/admin` hanya untuk role admin)
