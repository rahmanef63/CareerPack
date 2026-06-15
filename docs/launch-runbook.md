# Pre-launch runbook

Operational tasks that didn't fit in code commits but must be executed (or explicitly accepted as risk) before public launch.

## P1 — Backup / restore drill

**Why**: a `docker volume prune --force` or corrupted Convex data volume on the Dokploy host wipes every account, every CV, every saved application. Backups exist only if they're tested.

**Canonical restore = untar the volume snapshot.** The deployed Layer-2 cron (`backend/convex-self-hosted/backup.sh`, root crontab `0 3 * * *`) produces a `tar.gz` of the Convex Docker volume — **this is the only backup format that actually exists in prod.** The full restore steps live in **[db-backup.md → Recovery Procedure → Dari local tar archive](./db-backup.md#recovery-procedure)**; do not improvise a different format under pressure. Outline:

```bash
# 1. Stop the Convex backend container
docker compose -f /path/to/dokploy/compose stop backend

# 2. Wipe + restore the volume from the latest tar.gz (see db-backup.md for the
#    exact one-liner; archive name = convex-YYYYMMDD-HHMM.tar.gz under
#    /var/backups/careerpack, or .tar.gz.gpg if BACKUP_PASSPHRASE_FILE was set)
docker run --rm -v <VOLUME_NAME>:/dest -v /var/backups/careerpack:/src alpine sh -c \
  'rm -rf /dest/* && tar xzf /src/convex-YYYYMMDD-HHMM.tar.gz -C /dest'

# 3. Start container + verify
docker compose -f /path/to/dokploy/compose start backend
curl https://<your-convex-backend>/version
```

**Drill** (do this within 7 days of launch, then monthly): restore the latest tar.gz onto a fresh staging volume per the steps above, then sign in as a known user on staging and confirm every record is present.

> ✅ **Restore drill DONE 2026-06-15 (PASS).** Latest cron archive restored to a throwaway volume via `ssh vpsku` — restored size == live exactly (229.3M); a temp Convex backend booted clean from it (migration v124 up-to-date, listening 3210/3211); teardown verified, live volume untouched. Audit row below + [db-backup.md](./db-backup.md#action-items). Re-run monthly.

Record the timestamp + SHA256 of the restored archive in this file each drill so audits can confirm freshness:

| Date | SHA256 | Restored to | Verified by |
|---|---|---|---|
| 2026-06-15 | `327344b5c804a3b0c0061374180c5ecc11c3f3d99a178c48c057eb3d96ace92f` (convex-20260615-0300.tar.gz, 120.7M) | throwaway volume + temp backend (live untouched) | automated drill via `ssh vpsku` — restored == live (229.3M), backend booted clean (3210/3211) |

**Alternative (not the deployed path): `convex export` / `import`.** Convex CLI can emit a schema-aware snapshot ZIP (`convex export --path snapshot.zip`) and restore it with `convex import --replace`. This is more portable than the tar volume but is **not** what the cron produces, so it is **not** the primary restore route — it is listed as a deferred option in [db-backup.md → Alternatives Considered](./db-backup.md#alternatives-considered). Use it only if you have first taken an `export` snapshot in that same format; you cannot `convex import` the tar.gz the cron writes.

## P1 — File storage external (Backblaze B2 / Cloudflare R2)

**Risk**: every file uploaded via `convex/files.ts` (CV photos, portfolio covers) lives in the Convex backend's local volume. If the volume goes (Dokploy host wipe, image rebuild without volume mount), every uploaded image becomes a broken link in users' CVs and portfolio cards.

**Fix**: configure S3-compatible object storage. Backblaze B2 is the cheapest (~$6/TB/mo), Cloudflare R2 has zero egress fees.

Add to `backend/convex-self-hosted/convex.env`:

```env
S3_STORAGE_FILES_BUCKET=careerpack-files
S3_STORAGE_EXPORTS_BUCKET=careerpack-exports
S3_STORAGE_SNAPSHOT_IMPORTS_BUCKET=careerpack-snapshot-imports
S3_STORAGE_MODULES_BUCKET=careerpack-modules
S3_STORAGE_SEARCH_BUCKET=careerpack-search
S3_ENDPOINT_URL=https://s3.us-west-002.backblazeb2.com   # or R2 endpoint
S3_REGION=us-west-002
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

Restart the backend container so Convex picks up the new vars. Then run a smoke test by uploading a CV photo through the UI — verify the resulting `getUrl()` resolves to the bucket origin, not the local backend.

If accepting the risk for now (e.g. demo-only launch), explicitly note it here:

> **Accepted as known risk** until ___. File loss on volume prune means user CV photos + portfolio covers disappear; user data (jobs, CV text, etc.) stays intact.

## P1 — Observability

`frontend/instrumentation.ts` ships with stub `register()` + structured `onRequestError`. Wire to a real ingester pre-launch if traffic > 100 daily users:

- **Sentry** — add `@sentry/nextjs`, run `npx @sentry/wizard`, drop `dsn` into `register()`.
- **GlitchTip** (self-hosted alternative) — same `@sentry/nextjs` SDK, pointed at a self-hosted endpoint.
- **OTel + Grafana Cloud** — install `@vercel/otel`, configure exporters in `register()`.

## P2 — CSP nonce hardening

`next.config.ts` ships a permissive `'unsafe-inline'` for `script-src` + `style-src` because Next.js runtime + tweakcn theme presets need them. To tighten further:

1. Move CSP into `proxy.ts` so each request gets a fresh nonce.
2. Apply nonce to inline scripts via `<Script>` API.
3. Note: enabling nonce-CSP forces dynamic rendering — measure RPS impact before flipping.

## P2 — End-to-end smoke test

No Playwright suite yet. Minimum viable:

```bash
pnpm dlx playwright install chromium
# Then add a smoke test that visits / → "Lihat Demo" → /dashboard
# and asserts the dashboard cards render. Wire into CI.
```

## Pre-launch sanity checklist

- [ ] DNS A record pointed at Dokploy host
- [ ] TLS cert auto-renewing (Dokploy / certbot)
- [ ] `CONVEX_SELF_HOSTED_ADMIN_KEY` rotated post-handover
- [ ] `ADMIN_BOOTSTRAP_EMAILS` set to your real email so first-login auto-promotes
- [x] Backup drill completed (table above) — 2026-06-15 PASS
- [ ] File storage either external OR risk explicitly accepted
- [ ] Service worker cache version bumped (`frontend/public/sw.js`)
- [ ] Lighthouse mobile score ≥ 85 on landing page
- [ ] Test the "Lihat Demo" flow end-to-end on a fresh anonymous browser
- [ ] Confirm CSP doesn't block any third-party asset you want to load (fonts, OG image fetcher, etc.)
