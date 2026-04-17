# CareerPack Monorepo

Frontend memakai Next.js (`frontend/`), backend memakai Convex (`convex/`).
Default development mode: Convex cloud dev (bukan self-hosted).

## Quick Start

1. Install dependencies workspace:

```bash
pnpm install
```

2. Siapkan env Convex cloud di root `.env.local`:

```bash
# PowerShell
Copy-Item .env.example .env.local

# Bash
cp .env.example .env.local
```

3. Set env frontend di `frontend/.env.local`:

```bash
NEXT_PUBLIC_CONVEX_URL=<your convex cloud url>
```

4. Jalankan app (otomatis push Convex sekali lalu start Next.js):

```bash
pnpm run dev
```

5. Opsional, jika ingin Convex watch mode (sinkron setiap file change), jalankan di terminal lain:

```bash
pnpm run backend:dev
```

## Repository Structure

- `frontend/` Next.js app (App Router)
- `convex/` Convex functions/schema/auth
- `backend/convex-self-hosted/` optional self-hosted setup

## Frontend Feature Contract

Setiap feature di `frontend/src/features/*` memiliki:

- `components/`
- `lib/`
- `hooks/`
- `constants/`
- `types/`
- `config.ts`
- `manifest.ts`
- `index.ts`

Jika feature punya sub-feature, gunakan `shared/` di dalam feature.

## Root Scripts

- `pnpm run dev` push Convex (`--once`) lalu start frontend
- `pnpm run build` build frontend
- `pnpm run start` run frontend production
- `pnpm run lint` lint frontend (ESLint CLI)
- `pnpm run backend:dev` jalankan Convex cloud dev
- `pnpm run backend:push` push Convex sekali tanpa watch

## Optional Self-Hosted

Gunakan hanya jika perlu local backend containerized.
Panduan: `backend/convex-self-hosted/README.md`

## Production Deployment

Panduan lengkap: `DEPLOYMENT.md`
