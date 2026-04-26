# Convex Self-Hosted (Per Project)

Folder ini adalah stack backend Convex self-hosted khusus untuk project ini.
Mode ini opsional. Default development project tetap Convex cloud dev.

## Quick Start

1. Salin env:
   - PowerShell: `Copy-Item .env.example .env`
   - Bash: `cp .env.example .env`

2. Pull image official (opsional, untuk cek akses):
   docker pull ghcr.io/get-convex/convex-backend:latest

3. Jalankan backend:
   `pnpm run backend:selfhosted:up`

4. Lihat logs:
   `pnpm run backend:selfhosted:logs`

   Jika muncul error auth seperti `Missing environment variable JWT_PRIVATE_KEY`,
   pastikan file `.env` memuat:
   - `JWT_PRIVATE_KEY=...`
   - `CONVEX_SITE_URL=http://localhost:3210`

5. Push Convex functions ke self-hosted:
   - Generate admin key terlebih dulu:
     pnpm run backend:selfhosted:admin-key
   - Copy hasil key ke `backend/convex-self-hosted/convex.env` pada `CONVEX_SELF_HOSTED_ADMIN_KEY=...`
   pnpm run backend:selfhosted:push

6. Seed data contoh (setelah user berhasil login/daftar):
   pnpm run backend:selfhosted:seed

7. Set frontend env (`frontend/.env.local`):
   NEXT_PUBLIC_CONVEX_URL=http://localhost:3210

## Catatan

- Jika `docker pull` dari `ghcr.io` gagal, login harus pakai GitHub PAT dengan scope `read:packages` (bukan password akun).
- Stack ini dipisah per project, jadi tidak berbagi database dengan project lain.
- Jika auth masih error `InvalidAccountId`, lakukan reset data lokal:
  - `docker compose -f backend/convex-self-hosted/docker-compose.yml down -v`
  - `pnpm run backend:selfhosted:up`
  - `pnpm run backend:selfhosted:push`
