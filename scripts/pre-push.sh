#!/usr/bin/env bash
# pre-push hook — auto-deploy Convex when convex/** changed in the push range.
#
# Wired via simple-git-hooks. Reads the standard pre-push stdin format
# ("<local_ref> <local_sha> <remote_ref> <remote_sha>" per ref).
#
# Also runs the quality gate (typecheck + lint + vitest with coverage thresholds
# + production build) before anything else: GitHub Actions CI is
# workflow_dispatch-only since 2026-05-14, so this hook is the last automated
# gate before code (and a possible Convex deploy) reaches main. Coverage
# thresholds live in vitest.config.ts and only trip under --coverage, hence
# `pnpm test:coverage`. `pnpm build` is the ONLY step that catches build-only
# breakage (top-level native imports, missing serverExternalPackages, route
# exports incompatible with the current Next config) — typecheck and vitest are
# blind to all three, and Dokploy builds straight off a push to main.
#
# DEPLOY TARGET. Production's frontend talks to Convex CLOUD
# (proficient-dove-151 — hardcoded in Dockerfile), NOT to the self-hosted Dokploy
# backend. So the deploy target is resolved in that order:
#
#   1. backend/convex-cloud/prod.env       → CONVEX_DEPLOY_KEY, Cloud PROD  ✅
#   2. logged-in Convex CLI session        → Cloud PROD of the project named
#                                            by .env.local's CONVEX_DEPLOYMENT ✅
#   3. backend/convex-self-hosted/convex.env → self-hosted (legacy, NOT prod) ⚠️
#
# Until 2026-07-30 only (3) existed, so every push with convex/** changes ran a
# deploy, printed "Convex deploy OK", and left production's functions untouched
# — the worst possible outcome, because it looked like a working pipeline. If it
# still falls through to (3) the hook now says so in as many words instead of
# reporting a success that isn't one.
#
# (2) exists because (1) needs a dashboard-minted key that a solo dev pushing
# from their own machine already has a working substitute for: `convex deploy`
# with no key deploys to the PROD deployment of the project that
# CONVEX_DEPLOYMENT belongs to. Note the asymmetry — CONVEX_DEPLOYMENT names the
# *dev* deployment, the deploy still goes to *prod*; that is the CLI's documented
# behaviour, not a bug here. Wire (1) anyway for CI, or for any machine without
# an interactive `convex login`.
#
# To wire (1): Convex dashboard → proficient-dove-151 → Settings → Deploy keys →
# "Generate production deploy key", then
#   mkdir -p backend/convex-cloud
#   printf 'CONVEX_DEPLOY_KEY=prod:…\n' > backend/convex-cloud/prod.env
# The path is gitignored. Never commit it.
#
# Skips:
#   - $SKIP_PUSH_CHECKS=1              (typecheck+lint+test+build gate bypass, emergency)
#   - $SKIP_CONVEX_DEPLOY=1            (explicit bypass, e.g. emergency push)
#   - no deploy-target env file at all (teammate without keys)
#   - no convex/** changes in the push range (fast path for the deploy step)
#
# Fails loud on deploy failure so the push aborts — the goal is "git push
# main is the deploy trigger".

set -euo pipefail

ZERO_SHA="0000000000000000000000000000000000000000"
PROD_ENV_FILE="backend/convex-cloud/prod.env"
SELFHOSTED_ENV_FILE="backend/convex-self-hosted/convex.env"

# --- Quality gate: typecheck + lint + tests + build (stdin redirected so
# --- subprocesses can't eat the ref list this hook reads below).
if [[ "${SKIP_PUSH_CHECKS:-0}" == "1" ]]; then
  echo "[pre-push] SKIP_PUSH_CHECKS=1 — typecheck+lint+test+build gate skipped." >&2
else
  echo "[pre-push] Quality gate: pnpm typecheck…" >&2
  if ! pnpm typecheck < /dev/null; then
    echo "[pre-push] Typecheck FAILED — aborting push. Fix and retry, or 'SKIP_PUSH_CHECKS=1 git push' to bypass." >&2
    exit 1
  fi
  echo "[pre-push] Quality gate: pnpm lint…" >&2
  if ! pnpm lint < /dev/null; then
    echo "[pre-push] Lint FAILED — aborting push. Fix and retry, or 'SKIP_PUSH_CHECKS=1 git push' to bypass." >&2
    exit 1
  fi
  echo "[pre-push] Quality gate: vitest run (with coverage thresholds)…" >&2
  if ! pnpm test:coverage < /dev/null; then
    echo "[pre-push] Tests/coverage FAILED — aborting push. Fix and retry, or 'SKIP_PUSH_CHECKS=1 git push' to bypass." >&2
    exit 1
  fi
  # Shares frontend/.next with a running `pnpm dev`. If they race, next build
  # can die on a spurious ENOENT rename inside .next — that is the dev server,
  # not your diff: stop dev (or rm -rf frontend/.next) and push again.
  echo "[pre-push] Quality gate: pnpm build…" >&2
  if ! pnpm build < /dev/null; then
    echo "[pre-push] Build FAILED — aborting push. Fix and retry, or 'SKIP_PUSH_CHECKS=1 git push' to bypass." >&2
    exit 1
  fi
  echo "[pre-push] Quality gate OK." >&2
fi

if [[ "${SKIP_CONVEX_DEPLOY:-0}" == "1" ]]; then
  echo "[pre-push] SKIP_CONVEX_DEPLOY=1 — Convex deploy skipped." >&2
  exit 0
fi

if [[ -f "${PROD_ENV_FILE}" ]]; then
  DEPLOY_CMD=(pnpm backend:deploy-prod)
  DEPLOY_TARGET="Convex Cloud PROD (deploy key)"
  TARGET_IS_PROD=1
elif [[ -f "${HOME}/.convex/config.json" ]] && grep -qs '^CONVEX_DEPLOYMENT=' .env.local; then
  DEPLOY_CMD=(pnpm exec convex deploy -y)
  DEPLOY_TARGET="Convex Cloud PROD (logged-in CLI session)"
  TARGET_IS_PROD=1
elif [[ -f "${SELFHOSTED_ENV_FILE}" ]]; then
  DEPLOY_CMD=(pnpm backend:deploy)
  DEPLOY_TARGET="self-hosted Dokploy backend (NOT production)"
  TARGET_IS_PROD=0
else
  echo "[pre-push] No Convex deploy target configured — deploy skipped." >&2
  echo "[pre-push] (No ${PROD_ENV_FILE}, no Convex CLI login, no ${SELFHOSTED_ENV_FILE}.)" >&2
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

echo "[pre-push] convex/** changed — deploying to ${DEPLOY_TARGET} via '${DEPLOY_CMD[*]}'…" >&2
if ! "${DEPLOY_CMD[@]}"; then
  echo "[pre-push] Convex deploy FAILED — aborting push. Fix and retry, or 'SKIP_CONVEX_DEPLOY=1 git push' to bypass." >&2
  exit 1
fi

if [[ "${TARGET_IS_PROD}" -eq 1 ]]; then
  echo "[pre-push] Convex deploy OK → ${DEPLOY_TARGET}. Proceeding with git push." >&2
  exit 0
fi

# The deploy genuinely succeeded — but it hit a backend no user reaches, so
# production still runs the OLD functions while the push about to happen makes
# Dokploy rebuild the frontend against them. That mismatch is how convex/**
# changes (including security fixes) silently failed to reach production for
# weeks while every push reported success.
#
# This used to warn and proceed. It now ABORTS, because a warning printed in
# the middle of a build log is not a control.
#
# Most common cause: `pnpm backend:dev-sync` rewrote .env.local and dropped the
# CONVEX_DEPLOYMENT line, so the tier-2 check above stopped matching and this
# fell through to the legacy self-hosted backend.
echo "" >&2
echo "[pre-push] ✖  Deployed to ${DEPLOY_TARGET} — PUSH ABORTED." >&2
echo "[pre-push] ✖  Production Convex functions are UNCHANGED. The live app talks to" >&2
echo "[pre-push] ✖  Convex Cloud (see Dockerfile NEXT_PUBLIC_CONVEX_URL), so pushing now" >&2
echo "[pre-push] ✖  would ship a frontend built against backend code that is not deployed." >&2
echo "" >&2
echo "[pre-push]    Fix, cheapest first:" >&2
echo "[pre-push]      1. Check .env.local still has a CONVEX_DEPLOYMENT line." >&2
echo "[pre-push]         'pnpm backend:dev-sync' removes it. Restore it and push again." >&2
echo "[pre-push]      2. Or wire ${PROD_ENV_FILE} with a CONVEX_DEPLOY_KEY" >&2
echo "[pre-push]         from the Convex dashboard — that is tier 1 and cannot be clobbered." >&2
echo "" >&2
echo "[pre-push]    Deliberately targeting the self-hosted backend? Re-run with" >&2
echo "[pre-push]    ALLOW_NONPROD_CONVEX_DEPLOY=1 git push" >&2
echo "" >&2

if [[ "${ALLOW_NONPROD_CONVEX_DEPLOY:-0}" == "1" ]]; then
  echo "[pre-push] ALLOW_NONPROD_CONVEX_DEPLOY=1 — proceeding anyway." >&2
  exit 0
fi
exit 1
