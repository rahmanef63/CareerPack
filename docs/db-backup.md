# Database Backup — Recipe Final

**Status:** Recipe finalized. Script tersedia di `backend/convex-self-hosted/backup.sh` — siap dideploy ke VPS host. Action items di bawah masih perlu dieksekusi manual (provider snapshot toggle + cron install + 1× recovery test) karena akses VPS bukan di repo.

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

Eksekusi via SSH ke Dokploy host:

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
- [ ] Deploy `backup.sh` + install cron — SSH ke host, 5 menit (langkah di atas)
- [ ] Test recovery procedure sekali — restore ke staging volume + verify Convex jalan
- [ ] Document path-to-restore di `docs/launch-runbook.md`
- [ ] Schedule re-evaluation untuk off-VPS backup sebelum public launch

## See Also

- [docs/deployment.md](./deployment.md) — Dokploy compose + Convex backend setup
- [docs/launch-runbook.md](./launch-runbook.md) — production launch checklist
- `backend/convex-self-hosted/docker-compose.yml` — compose file (dev parity); prod compose embedded di Dokploy
