# Deployment

> ## ⚠️ Apa yang benar-benar jalan di produksi (audit 2026-07-30)
>
> Doc ini menjelaskan stack **Dokploy + self-hosted Convex**. Frontend memang
> masih di Dokploy — tapi **backend produksi sudah pindah ke Convex Cloud**:
> `Dockerfile` men-hardcode `NEXT_PUBLIC_CONVEX_URL=https://proficient-dove-151.convex.cloud`.
>
> Konsekuensi yang harus diingat waktu baca sisa doc ini:
>
> - **Deploy fungsi ke produksi = `pnpm backend:deploy-prod`** (butuh
>   `backend/convex-cloud/prod.env` berisi `CONVEX_DEPLOY_KEY`). `backend:deploy`
>   dan `convex-deploy.yml` menyasar backend self-hosted — **bukan** produksi.
> - **Backup + health-watch + restore drill di §5b semuanya soal volume
>   self-hosted.** Data produksi ada di Cloud, backup-nya terpisah:
>   [`scripts/backup-prod.sh`](../scripts/backup-prod.sh) (`convex export --prod`,
>   crontab `rahman` `0 4 * * *`, import drill PASSED 2026-07-30) — lihat
>   [db-backup.md](./db-backup.md) bagian "Cloud gap".
> - §6 "Alternatif: Convex Cloud" bukan alternatif lagi; itu setengah kenyataan
>   sekarang (Cloud backend + Dokploy frontend, bukan Vercel).
>
> Stack self-hosted tetap didokumentasikan di bawah: masih dipakai untuk kerja
> lokal/offline dan jadi jalur balik kalau Cloud dilepas.

Default stack = **Dokploy + self-hosted Convex**. Placeholder `<your-convex-backend>` di doc ini = domain Convex kamu (mis. `api.example.com`).

**Gating otomatis = pre-push hook lokal, BUKAN GitHub Actions.** Sejak
2026-05-14 semua workflow (`ci.yml`, `convex-deploy.yml`) `workflow_dispatch`-only
(manual) untuk hemat biaya — tidak ada lagi trigger push/PR. Gerbang otomatis
nyata adalah `scripts/pre-push.sh` (via `simple-git-hooks`): jalankan
`pnpm typecheck` + `pnpm lint` + `pnpm test:coverage` + `pnpm build` tiap push,
lalu kalau push range menyentuh `convex/**` ia deploy SEBELUM push landing —
target di-resolve `backend/convex-cloud/prod.env` → sesi CLI Convex → self-hosted.
Detail bypass + fast-path ada di [CLAUDE.md](../CLAUDE.md) bagian Commands.

## 1. Arsitektur Prod

```
GitHub main
  ├─ push convex/**  ─→ pre-push hook (typecheck+lint+test+build) ─→ `convex deploy` ke Cloud PROD
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
# PRODUKSI (Convex Cloud proficient-dove-151)
pnpm backend:deploy-prod
# Script: pnpm exec convex deploy --yes --env-file backend/convex-cloud/prod.env

# Stack self-hosted legacy — TIDAK menyentuh produksi
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

**Probe `health-watch.sh` (retargeted 2026-07-30 — defaults now Convex Cloud):**

1. `careerpack-frontend` — root frontend HTTP 200 (`FRONTEND_URL`)
2. `careerpack-convex-api` — `/version` HTTP 200 (`CONVEX_API_URL`, default
   `https://proficient-dove-151.convex.cloud`)
3. `careerpack-site-health` — `/api/health` body `ok:true` (`CONVEX_SITE_URL`,
   default `https://proficient-dove-151.convex.site`)
4. `careerpack-convex-container` — Docker health of `careerpack-convex-backend`.
   **Only when `SELF_HOSTED=1`.** Against Cloud there is no container, so this
   probe would fire "GONE" every tick and `compose up -d` would keep trying to
   resurrect the retired stack.
5. Volume backup freshness — also `SELF_HOSTED=1` only. Cloud data is covered by
   [`scripts/backup-prod.sh`](../scripts/backup-prod.sh), whose cron does not
   necessarily live on this host.

⚠️ **The script in this repo is NOT the one that runs.** The live watchdog is
`~/bin/health-watch.sh` on the VPS — a multi-project registry (tech, kongloos,
careerpack) installed 2026-06-11, fired by the `rahman` crontab every 3 minutes,
logging to `~/health-watch.log` with per-check state in
`~/.local/state/health-watch/`. `/opt/careerpack/health-watch.sh` does not exist;
only `backup.sh` is there. The repo copy under `backend/convex-self-hosted/ops/`
is the single-project variant kept for reference.

Both were retargeted on 2026-07-30. Until then every CareerPack backend probe
pointed at `api./site.careerpack.org` — the self-hosted stack — so a Convex
**Cloud** outage would have left the registry entirely green. The live registry
now checks `careerpack.org`, `careerpack.org/api/health`,
`proficient-dove-151.convex.cloud/version` and
`proficient-dove-151.convex.site/api/health`, with the self-hosted pair demoted to
`careerpack-legacy-*`.

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

## 5c. Legacy self-hosted stack — status + lockdown (2026-07-30)

Dokploy melaporkan compose `careerpack-db` sebagai `idle`, tapi **itu status
deploy terakhir, bukan runtime** — pelajaran yang sama dengan insiden
2026-06-11. Kenyataannya `careerpack-convex-8gdbpk-backend-1` `Up (healthy)` dan
`https://api.careerpack.org/version` balas 200. Jadi stack lama **masih hidup**,
masih memegang data pre-cutover, dan tetap jadi jalur balik kalau Cloud dilepas.

Yang **tidak** boleh tetap hidup adalah dashboard admin-nya.
`dash.careerpack.org` menyajikan UI admin Convex ke internet terbuka untuk
deployment yang tidak melayani user. Dikunci lewat dua lapis, karena satu lapis
saja tidak cukup:

1. Domain `dash.careerpack.org` dihapus dari service compose di Dokploy
   (`domain.delete`). Ini hanya mengubah apa yang **deploy berikutnya**
   generate — route yang sedang jalan berasal dari label Docker pada container
   yang sudah berjalan, jadi ini saja tidak menutup apa pun.
2. `traefik.enable` pada service `dashboard` di
   `/etc/dokploy/compose/careerpack-convex-8gdbpk/code/docker-compose.yml`
   diubah `true` → `false` (backup: `docker-compose.yml.bak-20260730`), lalu
   container-nya di-`docker stop`. Label baru itu yang bikin lockdown bertahan
   kalau self-heal `compose up -d` pernah jalan.

Hasil: `dash` → 404, `api` → 200 (fallback utuh), backend container tetap
`healthy`, Convex Cloud tak tersentuh.

Menghidupkan lagi kalau perlu: balikkan `traefik.enable=true`, `docker start
careerpack-convex-8gdbpk-dashboard-1`, dan buat ulang domainnya di Dokploy.
Lebih baik lagi: jangan — akses lewat SSH port-forward ke `127.0.0.1:6791`.

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

Convex: checkout commit lama lalu `pnpm backend:deploy-prod`. (GH Action `convex-deploy.yml` menyasar self-hosted — tidak me-rollback produksi.)
Frontend: Dokploy rollback ke revision sebelumnya (UI).

## 9. Seed Prod

`seedForCurrentUser` mulai dengan `requireUser`, jadi **tidak bisa** dipanggil lewat
`convex run` (tidak ada konteks user — selalu `"Tidak terautentikasi"`). Seed jalan
otomatis tiap login lewat `useAuth.login()`.

Untuk admin baru: set env `ADMIN_BOOTSTRAP_EMAILS` (comma-separated) di deployment
produksi; email yang cocok naik jadi `role: "admin"` pada login berikutnya.

## 10. Kredensial AI terenkripsi (`AI_CRED_SECRET`)

`aiSettings.apiKey` + `globalAISettings.apiKey` bisa disimpan AES-256-GCM
(`convex/_shared/aiCrypto.ts`, prefix `encv1:`). Master secret-nya satu env:
**`AI_CRED_SECRET`**, env **deployment Convex** — bukan env Dokploy, bukan
`NEXT_PUBLIC_*`, jangan pernah ikut ter-inline ke build frontend.

```bash
# sudah ada belum? (list mencetak nama DAN nilai — jangan tempel outputnya ke mana pun)
pnpm exec convex env list --env-file backend/convex-cloud/prod.env

# set di PRODUKSI (Convex Cloud proficient-dove-151)
pnpm exec convex env set AI_CRED_SECRET "$(openssl rand -hex 32)" \
  --env-file backend/convex-cloud/prod.env
```

Self-hosted legacy: sama, `--env-file backend/convex-self-hosted/convex.env`.
Dev lokal: tanpa `--env-file` (kena deployment dev). Bisa juga lewat Convex
dashboard → Settings → Environment Variables.

Nilai bebas: env-nya di-SHA-256 dulu jadi kunci AES, jadi passphrase apa pun
jalan — `openssl rand -hex 32` cuma default yang aman.

**Kalau tidak diset** (keadaan yang valid: dev lokal, deployment baru):

- Simpan API key di Setelan → AI dan Admin Panel **tetap jalan**, key ditulis
  plaintext persis seperti sebelum fitur ini ada. Semua AI action jalan.
- Yang menolak cuma OAuth connect (`api.ai.oauth.startOAuthConnect`):
  *"Login provider belum aktif — admin perlu mengatur AI_CRED_SECRET dulu."*
  Sengaja — key hasil OAuth tidak pernah dilihat user, jadi user tidak bisa
  merotasi sesuatu yang bocor tanpa dia pernah tahu key itu ada.

**Tidak ada migrasi.** Baris yang sudah ada TIDAK ikut dienkripsi waktu env
di-set; ciphertext-nya self-describing (`encv1:`) dan read path (`decryptCred`
lewat `_shared/aiResolve.ts`) menerima dua-duanya. Enkripsi hanya kena baris
yang ditulis SETELAH env ada.

⚠️ **Ganti/hapus nilainya = kehilangan.** Baris `encv1:` yang sudah ada gagal
didekripsi, dan AI action-nya error *"Kredensial AI tidak bisa didekripsi —
AI_CRED_SECRET berubah atau salah."* Tidak ada script re-encrypt; pemulihannya
manual — user simpan ulang key-nya, admin simpan ulang global key.
`scripts/backup-prod.sh` menyimpan tabel + file storage, **bukan** env, jadi
nilai ini harus dicatat terpisah (password manager) — snapshot Convex tidak
akan mengembalikannya.

**`APP_URL` juga wajib** untuk connect yang redirect: `startOAuthConnect`
memanggil `requireEnv("APP_URL")` untuk merangkai callback
(`/oauth/openrouter/callback`). Env yang sama sudah dipakai gerbang Origin CSRF
(`_shared/origin.ts`). Salah origin = provider memantulkan user ke tempat yang
tidak bisa menyelesaikan exchange, dan itu baru ketahuan saat ada yang klik.
