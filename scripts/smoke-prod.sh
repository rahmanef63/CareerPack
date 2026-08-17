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
# In --watch mode this also TRIGGERS the rebuild itself. Dokploy connects via a
# GitHub App, not a repo webhook, so a missed delivery leaves nothing to inspect
# or replay (`gh api …/hooks` returns zero) — and the old build keeps serving
# while every other signal reports success. Waiting TRIGGER_AFTER seconds and
# then poking the API is the only thing that closes that gap without a human
# watching the terminal.
#
# Exit codes: 0 all good · 1 a route or query failed · 2 --watch timed out with
# the build id unchanged (Dokploy neither rebuilt nor accepted the trigger).
#
# Env overrides: BASE_URL, WATCH_TIMEOUT (seconds, default 900), POLL (default 30),
# TRIGGER_AFTER (default 300 — 0 disables the auto-trigger),
# DOKPLOY_API_URL + DOKPLOY_API_KEY + DOKPLOY_APP_ID (credentials for it).

set -uo pipefail

BASE_URL="${BASE_URL:-https://careerpack.org}"
WATCH_TIMEOUT="${WATCH_TIMEOUT:-900}"
POLL="${POLL:-30}"
TRIGGER_AFTER="${TRIGGER_AFTER:-300}"
# Not a secret — it is the application id visible in the Dokploy URL. The key is
# read from the environment and never echoed.
DOKPLOY_APP_ID="${DOKPLOY_APP_ID:-9UFO92wvF0mQjEydEvhrP}"
DOKPLOY_API_URL="${DOKPLOY_API_URL:-}"
DOKPLOY_API_KEY="${DOKPLOY_API_KEY:-}"
# The app id above names ONE application. Watching some other origin — a
# staging URL, a local server, a fixture — while poking that application would
# deploy production because of a test. Both machines this runs on already carry
# DOKPLOY_API_KEY in the environment, so "the credentials are probably not set"
# is not a safety margin. Trigger only when the URL being watched is the one
# the id belongs to.
TRIGGER_ALLOWED_BASE="${TRIGGER_ALLOWED_BASE:-https://careerpack.org}"

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

# Ask Dokploy to build. Returns non-zero when it cannot even be attempted, so
# the caller can say WHY rather than leaving the operator to guess whether the
# trigger was skipped or refused.
trigger_deploy() {
  if [[ "${BASE_URL}" != "${TRIGGER_ALLOWED_BASE}" ]]; then
    echo "" >&2
    echo "  refusing to trigger: watching ${BASE_URL}, but DOKPLOY_APP_ID belongs to" >&2
    echo "  ${TRIGGER_ALLOWED_BASE}. Set TRIGGER_ALLOWED_BASE if that is really intended." >&2
    return 1
  fi
  if [[ -z "${DOKPLOY_API_URL}" || -z "${DOKPLOY_API_KEY}" ]]; then
    echo "" >&2
    echo "  set DOKPLOY_API_URL + DOKPLOY_API_KEY to have this triggered for you." >&2
    echo "  manual: curl -X POST -H \"x-api-key: \$DOKPLOY_API_KEY\" -H 'Content-Type: application/json' \\" >&2
    echo "            -d '{\"applicationId\":\"${DOKPLOY_APP_ID}\"}' \"\$DOKPLOY_API_URL/application.deploy\"" >&2
    return 1
  fi
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 -X POST \
    -H "x-api-key: ${DOKPLOY_API_KEY}" -H 'Content-Type: application/json' \
    -d "{\"applicationId\":\"${DOKPLOY_APP_ID}\"}" \
    "${DOKPLOY_API_URL}/application.deploy" 2>/dev/null)"
  if [[ "${code}" == "200" || "${code}" == "201" ]]; then
    echo "" >&2
    echo "→ triggered Dokploy deploy (HTTP ${code}); still watching for a new build id…" >&2
    return 0
  fi
  echo "" >&2
  echo "✖ Dokploy deploy trigger returned HTTP ${code:-000}." >&2
  return 1
}

if [[ "${1:-}" == "--watch" ]]; then
  before="$(build_id)"
  if [[ -z "${before}" ]]; then
    echo "✖ cannot read ${BASE_URL}/api/build-id — is the site up?" >&2
    exit 1
  fi
  echo "watching build id ${before} (timeout ${WATCH_TIMEOUT}s)…"
  waited=0
  attempted=0   # jangan mencoba dua kali
  trigger_ok=0  # benar-benar diterima Dokploy
  while (( waited < WATCH_TIMEOUT )); do
    sleep "${POLL}"
    waited=$(( waited + POLL ))
    now="$(build_id)"
    if [[ -n "${now}" && "${now}" != "${before}" ]]; then
      echo "✔ rebuilt after ${waited}s: ${before} → ${now}"
      break
    fi
    # One attempt, not one per poll: a build that is genuinely queued would
    # otherwise be re-queued every ${POLL} seconds.
    if (( attempted == 0 && TRIGGER_AFTER > 0 && waited >= TRIGGER_AFTER )); then
      echo "" >&2
      echo "  no rebuild after ${waited}s — the GitHub App delivery looks missed." >&2
      if trigger_deploy; then trigger_ok=1; fi
      attempted=1
    fi
    printf '  %ss…\r' "${waited}"
  done
  if [[ "${now:-${before}}" == "${before}" ]]; then
    echo "" >&2
    echo "✖ build id still ${before} after ${WATCH_TIMEOUT}s." >&2
    if (( trigger_ok )); then
      echo "  A deploy WAS accepted and still produced no new build id — check the" >&2
      echo "  Dokploy build log; this is the shape of a FAILED build, not a missed one." >&2
    elif (( attempted )); then
      echo "  The trigger could not be sent (see above), so this is still an" >&2
      echo "  un-deployed push, not a failed build." >&2
    else
      echo "  Dokploy did not rebuild and no trigger was attempted." >&2
    fi
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
