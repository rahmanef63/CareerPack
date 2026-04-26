# Pre-launch runbook

Operational tasks that didn't fit in code commits but must be executed (or explicitly accepted as risk) before public launch.

## P1 — Backup / restore drill

**Why**: a `docker volume prune --force` or corrupted Postgres datadir on the Dokploy host wipes every account, every CV, every saved application. Backups exist only if they're tested.

**Drill** (do this within 7 days of launch, then monthly):

```bash
# 1. Export current state to a ZIP
pnpm exec convex export --path /tmp/cp-snapshot.zip \
  --env-file backend/convex-self-hosted/convex.env

# 2. Move snapshot off-host (S3, Backblaze B2, or even a sync to laptop)
rclone copy /tmp/cp-snapshot.zip <remote>:careerpack-backups/

# 3. Spin up a staging Convex instance with a fresh volume, then:
pnpm exec convex import --replace /tmp/cp-snapshot.zip \
  --env-file backend/convex-self-hosted/convex.env  # against staging URL

# 4. Verify by signing in as a known user on staging — every record present.
```

Record the timestamp + SHA256 of the snapshot in this file each drill so audits can confirm freshness:

| Date | SHA256 | Restored to | Verified by |
|---|---|---|---|
| _pending_ | _pending_ | _pending_ | _pending_ |

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
- [ ] Backup drill completed (table above)
- [ ] File storage either external OR risk explicitly accepted
- [ ] Service worker cache version bumped (`frontend/public/sw.js`)
- [ ] Lighthouse mobile score ≥ 85 on landing page
- [ ] Test the "Lihat Demo" flow end-to-end on a fresh anonymous browser
- [ ] Confirm CSP doesn't block any third-party asset you want to load (fonts, OG image fetcher, etc.)
