# Deployment

Default stack = **Dokploy + self-hosted Convex**. Placeholder `<your-convex-backend>` di doc ini = domain Convex kamu (mis. `api.example.com`).

**Gating otomatis = pre-push hook lokal, BUKAN GitHub Actions.** Sejak
2026-05-14 semua workflow (`ci.yml`, `convex-deploy.yml`) `workflow_dispatch`-only
(manual) untuk hemat biaya — tidak ada lagi trigger push/PR. Gerbang otomatis
nyata adalah `scripts/pre-push.sh` (via `simple-git-hooks`): jalankan
`pnpm typecheck` + `pnpm exec vitest run` tiap push, lalu kalau push range
menyentuh `convex/**` ia menjalankan `pnpm backend:deploy` SEBELUM push landing.
Detail bypass + fast-path ada di [CLAUDE.md](../CLAUDE.md) bagian Commands.

## 1. Arsitektur Prod

```
GitHub main
  ├─ push convex/**  ─→ pre-push hook (typecheck+vitest) ─→ `convex deploy` ke <your-convex-backend>
  └─ push frontend/  ─→ Dokploy rebuild (webhook) ─→ Next.js standalone container
```

- Frontend: Next.js `output: "standalone"` — Dokploy bangun pakai `Dockerfile` di root
- Backend: Convex self-hosted container di Dokploy. **Image WAJIB pinned ke
  digest tetap** (jangan `:latest`) — override `CONVEX_SELF_HOSTED_IMAGE` di
  env Dokploy. Pin prod CareerPack saat ini `ghcr.io/get-convex/convex-backend:db5c4247…`
  (lihat komentar SECURITY di `backend/convex-self-hosted/docker-compose.yml`).
  Image tak-terpin adalah akar insiden 2026-06-11 (ter-prune lalu gagal re-pull).
- DB: satu Docker volume bernama `convex_data` (`careerpack-convex-8gdbpk_data`
  di prod) menampung SELURUH data + file upload — aset durable satu-satunya.
  Backup/restore: [docs/db-backup.md](./db-backup.md).
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

## 3. GitHub Secrets untuk Manual Deploy (`workflow_dispatch`)

Hanya dipakai kalau kamu menjalankan `convex-deploy.yml` lewat **Actions →
Run workflow** (manual). Push otomatis TIDAK memakai secret ini — deploy
otomatis lewat pre-push hook membaca `backend/convex-self-hosted/convex.env`
di lokal (lihat §5).

| Secret | Value |
|---|---|
| `CONVEX_SELF_HOSTED_URL` | `https://<your-convex-backend>` |
| `CONVEX_SELF_HOSTED_ADMIN_KEY` | Output dari `generate_admin_key.sh` |

Tanpa secret ini, dispatch manual `convex-deploy.yml` gagal.

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

## 5b. Monitoring & Self-Heal (host cron)

Dokploy `composeStatus` ≠ runtime — pada insiden 2026-06-11 container Convex
**hilang dari Docker** (image pinned ter-prune + ghcr.io 502 saat re-pull)
tapi status Dokploy tetap `done` → zero detection. Sinyal runtime nyata =
probe out-of-band di host. Dua script ops menutup gap ini (keduanya
idempotent, **tanpa secret**):

| Script | Fungsi |
|---|---|
| [`backend/convex-self-hosted/ops/health-watch.sh`](../backend/convex-self-hosted/ops/health-watch.sh) | 4 probe + self-heal + cek kesegaran backup, jalan tiap 3 menit |
| [`backend/convex-self-hosted/ops/install-cron.sh`](../backend/convex-self-hosted/ops/install-cron.sh) | Installer crontab idempotent (backup + health-watch) |

**Empat probe `health-watch.sh`:**

1. `careerpack-frontend` — root frontend HTTP 200 (`FRONTEND_URL`)
2. `careerpack-convex-api` — `/version` HTTP 200 (`CONVEX_API_URL`)
3. `careerpack-site-health` — `/api/health` body `ok:true` (`CONVEX_SITE_URL`)
4. `careerpack-convex-container` — Docker health container `careerpack-convex-backend`

**Self-heal:** kalau container backend **hilang** (kelas insiden 2026-06-11 —
`restart: unless-stopped` tidak menolong saat container DIHAPUS), script
menjalankan `docker compose -p careerpack-convex-8gdbpk up -d` dari
`COMPOSE_DIR` (re-create terhadap volume + network lama; no-op saat sehat).

**Backup freshness:** memperingatkan kalau arsip terbaru di
`/var/backups/careerpack` lebih tua dari ~25 jam (`BACKUP_MAX_AGE_H`) —
menangkap cron backup yang mati diam-diam.

**Alert wiring:** setiap kegagalan / heal / backup basi memanggil hook
`ALERT_HOOK "<pesan>"` (default `$HOME/.config/health-watch.alert` — hook
push yang sudah ada di host). No-op kalau hook tidak ada/tidak executable;
script tidak pernah exit non-zero karena probe gagal (cron tetap jalan).

**Pasang via SSH ke host:**

```bash
# 1. Copy ops scripts ke host
scp backend/convex-self-hosted/ops/health-watch.sh root@<host>:/opt/careerpack/health-watch.sh
scp backend/convex-self-hosted/ops/install-cron.sh  root@<host>:/opt/careerpack/install-cron.sh
# (backup.sh sudah ada di /opt/careerpack/backup.sh sejak 2026-06-11)

# 2. Smoke test sekali
ssh root@<host> '/opt/careerpack/health-watch.sh'
#   [health] OK frontend=200 api=200 site=ok container=healthy backup<25h

# 3. Install KEDUA baris crontab (idempotent — pin VOLUME_NAME di host multi-project)
ssh root@<host> 'VOLUME_NAME=careerpack-convex-8gdbpk_data /opt/careerpack/install-cron.sh'
```

Crontab yang dipasang (root):

```cron
0 3 * * * VOLUME_NAME=careerpack-convex-8gdbpk_data /opt/careerpack/backup.sh >> /var/log/careerpack-backup.log 2>&1
*/3 * * * * /opt/careerpack/health-watch.sh >> /var/log/careerpack-health.log 2>&1
```

Override URL/path lewat env di baris cron kalau domain non-default (lihat
header tiap script). Detail insiden + rasional: [`docs/progress/2026-06-11-vps-incident-and-hardening.md`](./progress/2026-06-11-vps-incident-and-hardening.md).

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
