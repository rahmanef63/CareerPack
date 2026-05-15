#!/usr/bin/env bash
# pre-push hook — auto-deploy Convex when convex/** changed in the push range.
#
# Wired via simple-git-hooks. Reads the standard pre-push stdin format
# ("<local_ref> <local_sha> <remote_ref> <remote_sha>" per ref).
#
# Skips:
#   - $SKIP_CONVEX_DEPLOY=1            (explicit bypass, e.g. emergency push)
#   - missing backend/convex-self-hosted/convex.env (teammate without admin key)
#   - no convex/** changes in the push range (fast path, ~50ms)
#
# Fails loud on deploy failure so the push aborts — the goal is "git push
# main is the deploy trigger".

set -euo pipefail

ZERO_SHA="0000000000000000000000000000000000000000"
ENV_FILE="backend/convex-self-hosted/convex.env"

if [[ "${SKIP_CONVEX_DEPLOY:-0}" == "1" ]]; then
  echo "[pre-push] SKIP_CONVEX_DEPLOY=1 — Convex deploy skipped." >&2
  exit 0
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[pre-push] ${ENV_FILE} not present — Convex deploy skipped." >&2
  echo "[pre-push] (Local-only push from a machine without backend admin key.)" >&2
  exit 0
fi

touched_convex=0

# stdin format per `git help hooks` → "pre-push":
#   <local_ref> <local_sha> <remote_ref> <remote_sha>\n
while read -r local_ref local_sha remote_ref remote_sha; do
  # Branch deletion — nothing to deploy.
  if [[ "${local_sha}" == "${ZERO_SHA}" ]]; then
    continue
  fi

  if [[ "${remote_sha}" == "${ZERO_SHA}" ]]; then
    # New branch — list files in the most recent 50 commits as a proxy.
    range="${local_sha} --not --remotes"
    if git rev-parse --verify "${local_sha}" >/dev/null 2>&1; then
      if git log --name-only --pretty=format: ${range} -- 'convex/**' 2>/dev/null | grep -q .; then
        touched_convex=1
      fi
    fi
  else
    # Existing branch — diff between local + remote.
    if git diff --name-only "${remote_sha}".."${local_sha}" -- 'convex/**' 2>/dev/null | grep -q .; then
      touched_convex=1
    fi
  fi
done

if [[ "${touched_convex}" -eq 0 ]]; then
  echo "[pre-push] No convex/** changes in push range — Convex deploy skipped." >&2
  exit 0
fi

echo "[pre-push] convex/** changed — running 'pnpm backend:deploy' before push…" >&2
if ! pnpm backend:deploy; then
  echo "[pre-push] Convex deploy FAILED — aborting push. Fix and retry, or 'SKIP_CONVEX_DEPLOY=1 git push' to bypass." >&2
  exit 1
fi
echo "[pre-push] Convex deploy OK — proceeding with git push." >&2
