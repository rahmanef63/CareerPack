#!/usr/bin/env bash
#
# Post-deploy smoke check.
#
# Dokploy watches git push and rebuilds. That webhook is not reliable — a green
# push has more than once left the old frontend serving, and the only way we
# noticed was checking /api/build-id by hand. This does that for you.
#
# Two modes:
#
#   ./scripts/smoke-prod.sh              → probe once, report, exit
#   ./scripts/smoke-prod.sh --watch      → record the build id, poll until it
#                                          changes, then probe. Run right after
#                                          a push.
#
# Exit codes: 0 all good · 1 a route or query failed · 2 --watch timed out with
# the build id unchanged (Dokploy did not rebuild — trigger it manually).
#
# Env overrides: BASE_URL, WATCH_TIMEOUT (seconds, default 900), POLL (default 30).

set -uo pipefail

BASE_URL="${BASE_URL:-https://careerpack.org}"
WATCH_TIMEOUT="${WATCH_TIMEOUT:-900}"
POLL="${POLL:-30}"

# Routes that must render for the app to be usable at all. Kept short on
# purpose: this is a smoke test, not a crawl.
ROUTES=(
  /
  /login
  /dashboard
  /dashboard/cv
  /dashboard/checklist
  /dashboard/calculator
  /dashboard/matcher
)

# Public Convex queries that prove the deployed backend answers. Each must
# return valid JSON — a deploy that half-landed usually shows up here first.
QUERIES=(
  "documents/queries:listTemplates"
)

fail=0

build_id() {
  curl -sS --max-time 15 "${BASE_URL}/api/build-id" 2>/dev/null \
    | sed -n 's/.*"buildId":"\([^"]*\)".*/\1/p'
}

if [[ "${1:-}" == "--watch" ]]; then
  before="$(build_id)"
  if [[ -z "${before}" ]]; then
    echo "✖ cannot read ${BASE_URL}/api/build-id — is the site up?" >&2
    exit 1
  fi
  echo "watching build id ${before} (timeout ${WATCH_TIMEOUT}s)…"
  waited=0
  while (( waited < WATCH_TIMEOUT )); do
    sleep "${POLL}"
    waited=$(( waited + POLL ))
    now="$(build_id)"
    if [[ -n "${now}" && "${now}" != "${before}" ]]; then
      echo "✔ rebuilt after ${waited}s: ${before} → ${now}"
      break
    fi
    printf '  %ss…\r' "${waited}"
  done
  if [[ "${now:-${before}}" == "${before}" ]]; then
    echo "" >&2
    echo "✖ build id still ${before} after ${WATCH_TIMEOUT}s." >&2
    echo "  Dokploy did not rebuild. Trigger the deploy manually." >&2
    exit 2
  fi
fi

echo "— routes"
for r in "${ROUTES[@]}"; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "${BASE_URL}${r}" 2>/dev/null)"
  if [[ "${code}" == "200" ]]; then
    printf '  ✔ %s  %s\n' "${code}" "${r}"
  else
    printf '  ✖ %s  %s\n' "${code:-000}" "${r}"
    fail=1
  fi
done

echo "— convex prod queries"
for q in "${QUERIES[@]}"; do
  # `convex run` resolves the target the same way the pre-push hook does, so a
  # missing CONVEX_DEPLOYMENT surfaces here as a failure rather than silently
  # probing the wrong backend.
  if out="$(pnpm exec convex run --prod "${q}" '{}' 2>&1)" && printf '%s' "${out}" | head -c1 | grep -q '[[{]'; then
    printf '  ✔ %s\n' "${q}"
  else
    printf '  ✖ %s — %s\n' "${q}" "$(printf '%s' "${out}" | tail -1)"
    fail=1
  fi
done

echo "— build id: $(build_id)"

if (( fail )); then
  echo "✖ smoke FAILED" >&2
  exit 1
fi
echo "✔ smoke OK"
