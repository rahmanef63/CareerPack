# Deployment Guide (Next.js + Convex Cloud)

Dokumen ini untuk production deployment dengan:
- Frontend: Next.js (direkomendasikan ke Vercel)
- Backend: Convex Cloud deployment terpisah (production)

## 1. Prasyarat

- Node.js 20+ dan `pnpm`
- Akun Convex
- Project sudah bisa jalan lokal (`pnpm run dev`)

## 2. Siapkan Convex Production Deployment

1. Buat deployment production di Convex Dashboard.
2. Ambil:
   - `CONVEX_DEPLOY_KEY`
   - `CONVEX_DEPLOYMENT` (format: `prod:...`)
   - `CONVEX_SITE_URL` (domain `.convex.site`)
   - `NEXT_PUBLIC_CONVEX_URL` (domain `.convex.cloud`)
3. Di Convex environment variables (dashboard), set minimal:
   - `CONVEX_SITE_URL=<your convex site url>`
   - `JWT_PRIVATE_KEY=<secure random key>`

Jika fitur AI dipakai, tambahkan juga:
- `CONVEX_OPENAI_API_KEY`
- `CONVEX_OPENAI_BASE_URL` (contoh: `https://api.openai.com/v1`)

## 3. Deploy Backend (Convex)

### Opsi A: dari lokal

```bash
CONVEX_DEPLOY_KEY=<key> pnpm run backend:deploy
```

PowerShell:

```powershell
$env:CONVEX_DEPLOY_KEY="<key>"
pnpm run backend:deploy
```

### Opsi B: dari CI

- Simpan `CONVEX_DEPLOY_KEY` sebagai secret CI.
- Jalankan:

```bash
pnpm install --frozen-lockfile
pnpm run backend:deploy
```

## 4. Deploy Frontend (Vercel Recommended)

1. Import repository ke Vercel.
2. Set:
   - Root Directory: `frontend`
   - Install Command: `pnpm install`
   - Build Command: `pnpm run build`
   - Output: default Next.js
3. Tambahkan environment variable di Vercel:
   - `NEXT_PUBLIC_CONVEX_URL=<your convex cloud url>`
4. Deploy.

## 5. Post-Deploy Checklist

- Login berhasil.
- Data query/mutation ke Convex berhasil.
- Route `/admin` tetap terproteksi.
- Jika perlu seed data:

```bash
CONVEX_DEPLOY_KEY=<key> pnpm exec convex run seed:seedForCurrentUser
```

## 6. Local Dev vs Production

- Local dev default:
  - root `.env.local` untuk Convex CLI (`CONVEX_DEPLOY_KEY`, `CONVEX_DEPLOYMENT`, `CONVEX_SITE_URL`)
  - `frontend/.env.local` untuk frontend (`NEXT_PUBLIC_CONVEX_URL`)
- Production:
  - backend env dikelola di Convex Dashboard
  - frontend env dikelola di platform deploy frontend (mis. Vercel)
