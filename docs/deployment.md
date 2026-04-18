# Deployment

Default stack = **Dokploy + self-hosted Convex**. Konfigurasi CI di `.github/workflows/convex-deploy.yml` otomatis push Convex function pada push ke `main`. Placeholder `<your-convex-backend>` di doc ini = domain Convex kamu (mis. `api.example.com`).

## 1. Arsitektur Prod

```
GitHub main
  ├─ push konvex/** ─→ GH Action (convex-deploy.yml) ─→ `convex deploy` ke <your-convex-backend>
  └─ push frontend/ ─→ Dokploy rebuild ─→ Next.js standalone container
```

- Frontend: Next.js `output: "standalone"` — Dokploy bangun pakai `Dockerfile` di root
- Backend: Convex self-hosted container (`ghcr.io/get-convex/convex-backend:latest`) di Dokploy
- DB: Convex built-in (SQLite persistent volume)
- Domain: set custom per deployment (frontend + Convex)

## 2. One-time Backend Setup (Dokploy)

1. Create docker-compose service pakai `backend/convex-self-hosted/docker-compose.yml`.
2. Env wajib:
   ```
   JWT_PRIVATE_KEY=<PEM RSA 2048>
   CONVEX_SITE_URL=https://<your-convex-backend>
   CONVEX_OPENAI_BASE_URL=<openai-compat url>
   CONVEX_OPENAI_API_KEY=<key>
   ```
   Generate JWT:
   ```bash
   openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out jwt.pem
   ```
3. Expose port 3210 ke domain `<your-convex-backend>` (reverse proxy Traefik/Dokploy).
4. Generate admin key:
   ```bash
   docker compose exec backend ./generate_admin_key.sh
   ```
   Simpan output ke GitHub secret `CONVEX_SELF_HOSTED_ADMIN_KEY`.

## 3. GitHub Secrets untuk Auto-Deploy

| Secret | Value |
|---|---|
| `CONVEX_SELF_HOSTED_URL` | `https://<your-convex-backend>` |
| `CONVEX_SELF_HOSTED_ADMIN_KEY` | Output dari `generate_admin_key.sh` |

Tanpa secret ini, workflow `convex-deploy.yml` gagal.

## 4. One-time Frontend Setup (Dokploy)

1. Tipe aplikasi: Docker Compose (pakai root `docker-compose.yml` + `Dockerfile`)
2. Env:
   ```
   NEXT_PUBLIC_CONVEX_URL=https://<your-convex-backend>
   ```
3. Domain: `<your-domain>`.

`NEXT_PUBLIC_*` di-inline time `next build`, jadi pastikan env tersedia sebelum build.

## 5. Manual Deploy

### Convex

```bash
# Dari lokal, target prod
pnpm backend:deploy
# Script: pnpm exec convex deploy --yes --env-file backend/convex-self-hosted/convex.env
```

File `backend/convex-self-hosted/convex.env` harus berisi:
```
CONVEX_SELF_HOSTED_URL=https://<your-convex-backend>
CONVEX_SELF_HOSTED_ADMIN_KEY=careerpack|...
```

### Frontend

Push ke `main` → Dokploy auto-rebuild via webhook. Manual trigger dari Dokploy UI kalau env berubah.

## 6. Alternatif: Convex Cloud + Vercel

Kalau mau migrasi balik ke managed stack:

1. Convex cloud:
   ```bash
   pnpm exec convex deploy
   ```
   Output: `CONVEX_DEPLOY_KEY`, `CONVEX_DEPLOYMENT` (prod:...), dan URL `https://<id>.convex.cloud`.

2. Vercel:
   - Root directory: `frontend`
   - Install: `pnpm install --frozen-lockfile` (butuh `corepack enable`)
   - Build: `pnpm run build`
   - Env: `NEXT_PUBLIC_CONVEX_URL=https://<id>.convex.cloud`

3. Convex env (dashboard):
   ```
   CONVEX_SITE_URL=https://<id>.convex.site
   JWT_PRIVATE_KEY=<PEM>
   CONVEX_OPENAI_BASE_URL=...
   CONVEX_OPENAI_API_KEY=...
   ```

## 7. Post-Deploy Checklist

- [ ] `/` load + redirect `/dashboard` kalau ter-login
- [ ] `/login` sign-up user baru → masuk dashboard + data seeded
- [ ] `/login` login existing → masuk dashboard
- [ ] Convex query/mutation berfungsi (cek Network tab → WebSocket `wss://<your-convex-backend>`)
- [ ] `/admin` redirect `/` untuk user non-admin
- [ ] Logout → redirect `/login`
- [ ] AI action (mis. "generate interview questions") tidak kena rate limit prematur
- [ ] PWA manifest + service worker ter-register (`chrome://inspect` → Service workers)

## 8. Rollback

Convex: deploy commit lama via GH Action manual dispatch.
Frontend: Dokploy rollback ke revision sebelumnya (UI).

## 9. Seed Prod

Untuk user admin baru:
```bash
CONVEX_SELF_HOSTED_URL=https://<your-convex-backend> \
CONVEX_SELF_HOSTED_ADMIN_KEY=<admin-key> \
pnpm exec convex run seed:seedForCurrentUser
```
Catatan: butuh userId context — seed otomatis dipanggil saat first login via `useAuth.login()`.
