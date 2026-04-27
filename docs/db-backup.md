# Database Backup — Planned

**Status:** Belum diimplementasikan. Dokumen ini = decision record + recipe untuk eksekusi nanti.

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

Eksekusi via SSH ke Dokploy host:

```bash
# 1. Verify volume name (Docker prefix biasanya = compose project name)
docker volume ls | grep -i convex

# 2. Bikin destination directory
sudo mkdir -p /var/backups/careerpack
sudo chmod 700 /var/backups/careerpack

# 3. Tambah cron (root crontab)
sudo crontab -e
```

Tambah line:

```cron
0 3 * * * docker run --rm -v <VOLUME_NAME>:/source:ro -v /var/backups/careerpack:/dest alpine sh -c 'tar czf /dest/convex-$(date +\%Y\%m\%d-\%H\%M).tar.gz -C /source . && find /dest -name "convex-*.tar.gz" -mtime +14 -delete'
```

Replace `<VOLUME_NAME>` dengan output step 1 (mis. `careerpack-db_data`).

**Yang dilakukan:**
- 03:00 setiap hari, tar volume read-only (container tetap jalan, gak ada downtime)
- Output `/var/backups/careerpack/convex-YYYYMMDD-HHMM.tar.gz`
- Auto-delete archive lebih dari 14 hari (rolling window)

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

- [ ] Aktifkan Provider auto-snapshot (Layer 1) — 1 click di dashboard
- [ ] Setup local cron tar (Layer 2) — SSH ke host, 5 menit
- [ ] Test recovery procedure sekali — restore ke staging volume + verify Convex jalan
- [ ] Document path-to-restore di `docs/launch-runbook.md`
- [ ] Schedule re-evaluation untuk off-VPS backup sebelum public launch

## See Also

- [docs/deployment.md](./deployment.md) — Dokploy compose + Convex backend setup
- [docs/launch-runbook.md](./launch-runbook.md) — production launch checklist
- `backend/convex-self-hosted/docker-compose.yml` — compose file (dev parity); prod compose embedded di Dokploy
