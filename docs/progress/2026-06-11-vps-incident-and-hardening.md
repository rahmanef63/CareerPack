# 2026-06-11 — Insiden Backend Convex Down + Hardening VPS

## Insiden

**Gejala:** `wss://api.careerpack.org/.../sync` gagal di browser; `api.` dan
`site.careerpack.org` mengembalikan `404 page not found` (default Traefik).
Frontend (`careerpack.org`) tetap 200.

**Root cause (dipastikan via SSH ke host):** container compose
`careerpack-convex-8gdbpk-{backend,dashboard}` **hilang dari Docker** —
bukan crash. Image pinned `ghcr.io/get-convex/convex-backend:db5c4247…`
ter-prune dari host, dan saat stack mencoba start ulang, re-pull gagal
karena **ghcr.io 502 Bad Gateway** (outage registry sementara). Tanpa
container, Traefik tidak punya route → 404. Status Dokploy tetap `done`
(composeStatus hanya merekam deploy terakhir, bukan runtime) → **zero
detection**; monitor `health-watch.sh` di host saat itu hanya mengawasi
tech.rahmanef.com + kongloos, CareerPack tidak terdaftar.

**Data:** volume `careerpack-convex-8gdbpk_data` (227 MB: `db.sqlite3`,
`storage/`, `credentials`) **utuh sepanjang insiden**.

## Pemulihan

1. Re-pull image pinned (ghcr pulih saat retry).
2. `docker compose -p careerpack-convex-8gdbpk up -d` dari
   `/etc/dokploy/compose/careerpack-convex-8gdbpk/code` — reattach volume +
   network lama (tanpa `down`, tanpa `-v`). Backend → healthy; routing
   Traefik balik otomatis (Traefik sudah ter-attach ke network project).
3. `pnpm backend:deploy` dari lokal — fungsi Convex ternyata tertinggal dari
   HEAD (deploy menambah index `outcomeEvents.by_from_to`,
   `nodeOutcomeStats.by_edge/by_to`, `adminStats.by_key` yang hilang).

## Hardening yang dipasang (di host, 2026-06-11)

| # | Tindakan | Detail |
|---|---|---|
| 1 | **`restart: unless-stopped`** | Ditambahkan ke compose **di-disk** DAN ke `composeFile` yang tersimpan di **DB Dokploy** (tabel `compose`, appName `careerpack-convex-8gdbpk`) — Dokploy menyimpan compose buatan-user di DB lalu meng-inject label Traefik saat deploy, jadi edit disk saja akan hilang saat redeploy. Containers di-recreate terkontrol; verified `RestartPolicy.Name=unless-stopped` + healthy. |
| 2 | **Monitoring** | CareerPack didaftarkan ke `~/bin/health-watch.sh` (cron `*/3` menit): `careerpack-frontend` (200), `careerpack-convex-api` (`/version` 200), `careerpack-site-health` (`/api/health` ok:true), `careerpack-convex-container` (docker health). Alert push via hook `~/.config/health-watch.alert` yang sudah ada — deteksi ≤6 menit. |
| 3 | **Self-heal** | Blok di health-watch: kalau container backend **hilang** (kelas insiden ini — restart-policy tidak menolong saat container DIHAPUS), jalankan `docker compose -p careerpack-convex-8gdbpk up -d` (idempotent; no-op saat sehat) + log HEAL. |
| 4 | **Backup cron** | `/opt/careerpack/backup.sh` + root crontab `0 3 * * *` dengan `VOLUME_NAME=careerpack-convex-8gdbpk_data` **di-pin** (auto-detect lama berbahaya di host multi-project — lihat db-backup.md). Arsip pertama diverifikasi: 121 MB, `db.sqlite3` + blobs. Retensi 14 hari, log `/var/log/careerpack-backup.log`. |

## Catatan operasional

- **Jangan `docker image prune -a`** di host selagi ada stack yang down —
  itulah yang membuat image pinned hilang dan stack tak bisa start saat
  registry error.
- Pin image CareerPack (`db5c4247…`) berbeda dari project convex lain di
  host (`5cdea511…`). Penyamaan versi = keputusan upgrade terjadwal,
  bukan tindakan darurat.
- Tombol **Redeploy** Dokploy melakukan down+up + re-pull — hindari saat
  registry bermasalah; gunakan `compose up -d` manual seperti di atas.
- Status UI Dokploy (`composeStatus`) ≠ runtime. Sinyal runtime = health-watch.

## Sisa pekerjaan (lihat juga db-backup.md Action Items)

- [ ] Provider auto-snapshot (Layer 1) — toggle di dashboard VPS.
- [ ] 1× recovery test dari arsip tar ke volume staging.
- [ ] Re-evaluasi off-VPS backup sebelum public launch.
