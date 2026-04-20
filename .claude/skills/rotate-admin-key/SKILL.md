---
name: rotate-admin-key
description: Rotate the Convex self-hosted admin key and sync it across the three places it must match (backend container, Dokploy Compose env, local .env.local). Use when user says "/rotate-admin-key", "rotate admin key", or reports "admin key leaked / rejected / out of sync".
---

# /rotate-admin-key — rotate + sync Convex admin key

The Convex admin key lives in **three places** that must stay identical. Drift = dashboard rejects key or deploys fail. This skill follows the si-coder §"Admin Key Sync Rule".

The three places:
1. **Backend container** (Dokploy host, `careerpack-convex` service) — source of truth.
2. **Dokploy Compose env** — used when the container restarts.
3. **Local repo env** — `/home/rahman/projects/CareerPack/backend/convex-self-hosted/convex.env` (gitignored) and the root `.env.local` if present.

## Pre-flight checks

1. Confirm env vars: `echo "$DOKPLOY_API_URL $DOKPLOY_API_KEY"`. Stop and ask the user if either is empty.
2. Confirm the user really wants to rotate. Rotation invalidates the current key — any running dashboard session with the old key loses access until refreshed.
3. Confirm scope: rotating prod key affects everyone currently using the prod dashboard.

## Plan (do not execute until the user approves step 2)

1. **Get current backend container name:** via Dokploy API, list services in the `careerpack` project and find the Convex backend service. Note its container name (e.g., `careerpack-convex-xxxxxx`).
2. **Generate new key in the container** — SSH onto the Dokploy host (or use Dokploy's exec-in-container API if available) and run `./generate_admin_key.sh` inside the backend container. The script prints the new key to stdout. Capture it — do not log it to anywhere persistent.
3. **Update Dokploy Compose env:** use the Dokploy REST API to set `CONVEX_SELF_HOSTED_ADMIN_KEY` on the compose service to the new key.
4. **Update local env files:** overwrite `CONVEX_SELF_HOSTED_ADMIN_KEY=<new>` in `backend/convex-self-hosted/convex.env` and the root `.env.local`. Both are gitignored — verify with `git check-ignore <path>` before writing.
5. **Verify:** `curl -H "Authorization: Convex <new-key>" $CONVEX_SELF_HOSTED_URL/version` should return 200. Also do one `pnpm backend:dev-sync` to confirm the CLI accepts the new key.
6. **Restart the container** only if the Compose env change does not propagate live — most self-hosted Convex builds re-read env on restart. Prefer not to restart if unnecessary.

## Refusals

- Never write the key into a tracked file. Double-check with `git check-ignore` before any write.
- Never print the full key in Claude's chat output — show first 12 chars + `…` only.
- Never commit env files.
- If the new key is rejected by the container after rotation, the backend holding the key has drifted — do not assume it is a key problem. Regenerate from the actually-running backend, per si-coder §"Admin Key Sync Rule".
