# Database Backup — Recipe Final

> ## ⚠️ Cloud gap — read this first (2026-07-30)
>
> **Everything below protects the self-hosted Docker volume. Production data is
> not in that volume.**
>
> Production's frontend talks to Convex **Cloud** `proficient-dove-151`
> (hardcoded as `NEXT_PUBLIC_CONVEX_URL` in `Dockerfile`). The nightly cron tar,
> the 121 MB archives, and the PASSED restore drill all target
> `careerpack-convex-8gdbpk_data` — the self-hosted volume, which serves nothing
> user-facing since the Cloud cutover. Until 2026-07-30 the honest status of
> production data was **no backup at all**, and the green checkmarks below made
> that easy to miss.
>
> ### Cloud backup — status
>
> - ✅ **Snapshot export exists and is automated, on the VPS.**
>   [`scripts/backup-prod.sh`](../scripts/backup-prod.sh) runs
>   `convex export --prod --include-file-storage`, verifies the archive, and
>   prunes to `KEEP` (14). Installed in the `rahman` crontab **on the VPS**
>   (`srv614914.hstgr.cloud` — the same box that runs Dokploy) at `0 4 * * *`,
>   logging to `~/.local/state/careerpack-backup.log`; archives land in
>   `~/backups/careerpack/` — outside the repo, because they contain user PII.
>   First verified archive: `careerpack-prod-20260730-113142.zip` (4.2 MB,
>   52 tables, file storage included).
> - ✅ **Archive integrity is checked, not assumed.** The script fails and deletes
>   the archive if `_tables/documents.jsonl` is missing or if any row in any
>   table fails to parse as JSON — so "downloaded" and "readable" are separate
>   claims and both get proven on every run.
> - ⚠️ **Same box as production.** The archives sit on the machine that also runs
>   the frontend container, so this is Layer 2 (on-host), not disaster recovery.
>   Off-host copies are still the Hostinger VPS snapshot (Layer 1).
> - ✅ **Encryption is now possible** (2026-08-17). Set `BACKUP_PASSPHRASE_FILE`
>   and `scripts/backup-prod.sh` encrypts the VERIFIED archive with
>   `gpg --symmetric --cipher-algo AES256`, deletes the plaintext zip, and keeps
>   pruning both extensions. Same knob and same cipher as the self-hosted
>   `backup.sh` — one convention, not two. Restore with
>   `gpg --decrypt -o restored.zip <archive>.zip.gpg`. **Not enabled by default**:
>   it is a knob, so an archive is only encrypted once someone sets the file.
>   Until then the archives remain plaintext PII and must not leave the box.
> - ✅ **Import drill PASSED 2026-07-30.** A throwaway project
>   (`careerpack-restore-drill`, dev deployment `effervescent-hedgehog-352`) was
>   created for the purpose, the current `convex/` schema pushed to it, and
>   `careerpack-prod-20260730-114423.zip` imported with `--replace-all`. Then
>   exported straight back out and compared table by table against the source
>   archive: **54 tables, 6519 documents, zero mismatches**, file storage
>   included. That is the difference between an archive that downloads and an
>   archive that restores.
>
>   The drill deployment was then wiped (`--replace-all` with an empty archive)
>   and verified empty — 0 documents, 0 storage blobs, only the 52 table names
>   left.
>
>   ⛔ **`careerpack-restore-drill` IS PRODUCTION as of 2026-08-07 — do not delete
>   it.** An earlier version of this paragraph told you to delete the project from
>   the dashboard once the drill was done. That advice is now the single most
>   destructive thing in this repo: production was migrated INTO this project, and
>   `proficient-dove-151` is its prod deployment. The name is misleading and the
>   project should be renamed in the dashboard; until it is, read this warning as
>   load-bearing. Its `effervescent-hedgehog-352` dev deployment is what local
>   `pnpm dev` binds to and holds no production data.
>
>   Future drills need a NEW throwaway project, not this one.
>
>   Repeat the drill with:
>   ```bash
>   npx convex dev --once --configure new --team <team> --project <name>   # in a temp dir with convex/ copied in
>   npx convex import --replace-all -y ~/backups/careerpack/<archive>.zip
>   npx convex export --include-file-storage --path roundtrip.zip          # then diff the two
>   ```
> - Convex Cloud keeps its own platform-level backups; treat those as Layer 1
>   (provider snapshot), not as a substitute for an export you hold.
>
> The self-hosted archives below still exist but hold **pre-cutover** data.

**Status (self-hosted volume):** ✅ **Layer 2 (cron tar) DEPLOYED 2026-06-11.** Script terpasang di
`/opt/careerpack/backup.sh` (VPS), root crontab `0 3 * * *` dengan
`VOLUME_NAME=careerpack-convex-8gdbpk_data` di-pin eksplisit, log di
`/var/log/careerpack-backup.log`. Arsip pertama terverifikasi:
`convex-20260611-0946.tar.gz` (121 MB, berisi `db.sqlite3` + `storage/files/*.blob`).
Sisa action items: provider snapshot toggle + 1× recovery test.

> **Update 2026-06-15 (keputusan owner):**
> - **Off-VPS DR via shared hosting (`153.92.9.241`) → DITOLAK.** Sebagian TOS shared
>   hosting larang dipakai murni sebagai remote backup (risiko suspend) + kuota/inode
>   terbatas. Off-disk DR dialihkan ke **provider auto-snapshot VPS Hostinger (built-in,
>   = Layer 1)**. Kalau nanti perlu off-site tahan-bencana: Cloudflare R2 — **WAJIB
>   enkripsi GPG dulu** (arsip berisi data user + secret).
> - **Recovery test (restore drill): ✅ PASS 2026-06-15.** Arsip `convex-20260615-0300.tar.gz`
>   (120.7MB, fresh dari cron) di-restore ke volume throwaway via `ssh vpsku`: (1) ukuran
>   restored = live PERSIS (229.3M = 229.3M), struktur lengkap (`db.sqlite3` 136MB +
>   `credentials/` + `storage/`); (2) boot test — instance Convex temporer (image pinned
>   sama, `--network none`, tanpa port, di volume restored) **BOOT BERSIH**: log "db metadata
>   version up to date at 124 → Migration complete → backend listening on 0.0.0.0:3210 (+3211)".
>   Backup TERBUKTI restorable + bootable. Throwaway container+volume dibongkar; live
>   `careerpack-convex-8gdbpk_data` tak pernah disentuh.
> - Arsip on-disk saat ini **belum terenkripsi** — OK untuk on-VPS; kalau dikirim
>   off-site, set `BACKUP_PASSPHRASE_FILE` (backup.sh sudah support GPG AES-256).

> ⚠️ **VOLUME_NAME wajib di-pin di cron.** Auto-detect versi lama
> (`grep 'convex|...' | head -1`) terbukti berbahaya di host multi-project
> (30+ volume convex) — akan mem-backup volume project lain. Script sudah
> diperbaiki untuk fail-loud kecuali match tepat satu, tapi tetap pin
> eksplisit di crontab.

Convex self-hosted di Dokploy menyimpan **semua data user + uploaded files** di satu Docker named volume (`data` di prod, `convex_data` di dev parity). Tanpa backup, single Dokploy redeploy dengan volume rename / corruption / accidental delete = total data loss.

## Threat Model

| Risk | Mitigation |
|---|---|
| `docker volume rm` accidental | Local snapshot |
| Container corruption / failed schema migration | Restore-from-snapshot |
| Disk fail di VPS | Provider snapshot (off-disk) |
| VPS provider outage / total loss | Off-VPS backup (out of scope until needed) |

## Decision: Two-Layer On-VPS Backup

Pilih pendekatan **on-VPS** (zero external services) untuk fase pertama. Off-VPS DR ditambahkan kalau user-base tumbuh atau compliance menuntut.

| Layer | Source | Frequency | Retention | Setup |
|---|---|---|---|---|
| 1. **Provider auto-snapshot** | VPS provider dashboard | Weekly (built-in) | Provider default | Toggle ON di dashboard provider |
| 2. **Local cron tar** | Docker volume snapshot via cron di VPS host | Daily 03:00 | 14 hari (auto-pruned) | Cron + 1 baris docker run |

Path-path lain dipertimbangkan & ditunda — lihat *Alternatives Considered* di bawah.

## Recipe — Local Cron Tar (Layer 2)

Script siap pakai: [`backend/convex-self-hosted/backup.sh`](../backend/convex-self-hosted/backup.sh). Ini auto-detect volume name, snapshot read-only (zero downtime), dan prune arsip > retention. Idempotent — safe untuk re-run.

> ⚠️ **Repo ini ADA di host itu.** `/home/rahman/projects/CareerPack` berjalan di
> `srv614914.hstgr.cloud` — mesin yang sama dengan Dokploy, semua container, dan Convex
> self-hosted. Jadi `scp`/`ssh root@<host>` di bawah ini bukan cuma tidak perlu, tapi
> menyesatkan: perintahnya gagal verifikasi host-key dan menghabiskan waktu untuk
> masalah yang tidak ada. Dari checkout ini, **salin filenya langsung** dan jalankan
> `crontab -e` di tempat. Blok SSH dipertahankan untuk kasus deploy di host LAIN.

**Dari host itu sendiri (kasus repo ini):**

```bash
install -m 755 backend/convex-self-hosted/backup.sh /opt/careerpack/backup.sh
/opt/careerpack/backup.sh                 # smoke test sekali
sudo crontab -e                           # tambahkan baris di bawah
```

**Kalau host-nya berbeda dari mesin tempat kamu mengetik:**

```bash
# 1. Copy script ke host
scp backend/convex-self-hosted/backup.sh root@<host>:/opt/careerpack/backup.sh
ssh root@<host> 'chmod +x /opt/careerpack/backup.sh'

# 2. Smoke test sekali (dry verify volume detection)
ssh root@<host> '/opt/careerpack/backup.sh'
# Output yang diharapkan:
#   [backup] OK volume=<detected> archive=/var/backups/careerpack/convex-<stamp>.tar.gz size=<n>M pruned=0 retention=14d

# 3. Install cron (root crontab)
ssh root@<host>
sudo crontab -e
```

Tambah line:

```cron
0 3 * * * /opt/careerpack/backup.sh >> /var/log/careerpack-backup.log 2>&1
```

**Override env knobs** kalau auto-detect salah / lokasi non-default:

```cron
0 3 * * * VOLUME_NAME=careerpack-db_data BACKUP_DIR=/srv/backups RETENTION_DAYS=30 /opt/careerpack/backup.sh >> /var/log/careerpack-backup.log 2>&1
```

**Verify cron health (mingguan):**

```bash
# Jumlah arsip terbaru (>= 7 = sehat 1 minggu, mis. 14 jam-an)
ls -1 /var/backups/careerpack/convex-*.tar.gz | wc -l

# Arsip terakhir (harus < 25 jam lalu)
ls -lh /var/backups/careerpack/convex-*.tar.gz | tail -1

# Tail log
tail -20 /var/log/careerpack-backup.log
```

## Recipe — Provider Snapshot (Layer 1)

Generic langkah (UI per provider beda):

1. Login dashboard VPS provider
2. Buka panel VPS / Snapshots / Backups
3. Aktifkan **Automatic Backups** (kalau belum)
4. Catat retention policy default (biasanya 7 hari)
5. Bikin manual snapshot sekali sebagai baseline

## Recovery Procedure

### Dari local tar archive (Layer 2)

```bash
# 1. Stop Convex backend container
docker compose -f /path/to/dokploy/compose stop backend

# 2. Wipe + restore volume
docker run --rm -v <VOLUME_NAME>:/dest -v /var/backups/careerpack:/src alpine sh -c \
  'rm -rf /dest/* && tar xzf /src/convex-YYYYMMDD-HHMM.tar.gz -C /dest'

# 3. Start container
docker compose -f /path/to/dokploy/compose start backend

# 4. Verify
curl https://<your-convex-backend>/version
```

### Dari provider snapshot (Layer 1)

Restore via UI provider — biasanya rollback whole VPS ke titik snapshot. **Akan rollback semua aplikasi di VPS, bukan cuma Convex.** Gunakan kalau corruption mempengaruhi banyak service.

## Alternatives Considered

### Convex S3 file storage (env vars)

Convex self-hosted support route `ctx.storage` files ke S3-compatible bucket via env vars (`S3_STORAGE_FILES_BUCKET`, `S3_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`). Memisahkan file dari volume Convex.

**Ditunda:** Butuh S3-compatible bucket. Untuk on-VPS, ini berarti deploy MinIO sebagai service Dokploy terpisah → tambah moving parts. Worth-it kalau file storage tumbuh > 1 GB atau lo migrate ke external bucket.

### Convex `export` / `import` CLI

Convex CLI punya `convex export --path snapshot.zip` yang generate semantic snapshot ZIP, restore via `convex import`. Lebih portable dari tar volume (versionable, schema-aware).

**Ditunda:** Butuh CLI auth + cron yang trigger CLI dari host (atau side-car container). Tar volume sudah cukup buat fase awal.

### Dokploy native Volume Backups

Dokploy punya REST endpoint `volumeBackups.create` untuk schedule daily volume backup ke S3 destination. Lebih clean dari side-car cron — terintegrasi UI Dokploy.

**Ditunda:** Butuh S3 destination (`destination.create` dengan accessKey/bucket/endpoint). Setara dengan setup MinIO atau external bucket. Cron tar local lebih simple buat fase awal.

### MinIO sebagai service Dokploy

Self-hosted S3-compatible storage di same VPS. Jadi destination buat Dokploy Volume Backups + tujuan Convex S3 file storage.

**Ditunda:** Tambah 1 container + storage volume. Belum justified di skala saat ini.

### Off-VPS backup (R2 / B2 / S3 cloud)

Backup ke external storage = tahan terhadap VPS provider outage / data center failure. Patokan terbaik untuk DR.

**Ditunda:** Constraint user — semua di VPS, no external services untuk fase pertama. Re-evaluate sebelum public launch atau saat user count > N (TBD).

## Action Items

- [x] Recipe finalized — script committed di `backend/convex-self-hosted/backup.sh`
- [ ] Aktifkan Provider auto-snapshot (Layer 1) — 1 click di dashboard VPS
- [x] Deploy `backup.sh` + install cron — **done 2026-06-11** (root crontab,
      `VOLUME_NAME=careerpack-convex-8gdbpk_data`, arsip pertama 121 MB terverifikasi)
- [x] Test recovery procedure sekali — **✅ done 2026-06-15 (PASS)**. Restore
      `convex-20260615-0300.tar.gz` ke volume throwaway via `ssh vpsku`: ukuran =
      live persis (229.3M), + instance Convex temporer boot bersih dari volume
      restored (migration v124 up-to-date, listening 3210/3211). Live tak disentuh.
      Detail di blok "Update 2026-06-15" di atas.
- [x] Document path-to-restore di `docs/launch-runbook.md` — **done.** Runbook
      P1 sekarang memakai jalur tar-volume ini sebagai prosedur kanonik (bukan
      lagi `convex export/import`, yang tinggal jadi alternatif yang ditandai).
- [ ] Schedule re-evaluation untuk off-VPS backup sebelum public launch

## See Also

- [docs/deployment.md](./deployment.md) — Dokploy compose + Convex backend setup
- [docs/launch-runbook.md](./launch-runbook.md) — production launch checklist
- `backend/convex-self-hosted/docker-compose.yml` — compose file (dev parity); prod compose embedded di Dokploy
