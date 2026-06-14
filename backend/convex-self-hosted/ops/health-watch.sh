#!/usr/bin/env bash
# CareerPack — host health watch + Convex self-heal.
#
# Runs four black-box probes against the prod stack, self-heals the
# Convex backend when its container has VANISHED (not merely crashed),
# and warns when the daily volume backup has gone stale. Designed to be
# fired every few minutes from cron; it is idempotent and quiet on the
# happy path (one OK summary line, no alert).
#
#   crontab entry:  */3 * * * * /opt/careerpack/health-watch.sh >> /var/log/careerpack-health.log 2>&1
#
# Background: 2026-06-11 the Convex backend container disappeared from
# Docker (pinned image pruned, ghcr.io 502 on re-pull). `restart:
# unless-stopped` does NOT help when a container is DELETED, so the cure
# is `compose up -d`, which re-creates it against the existing volume +
# network. Dokploy's UI status only records the last deploy, never
# runtime — so an out-of-band probe is the only real detection signal.
# Full postmortem: docs/progress/2026-06-11-vps-incident-and-hardening.md
#
# Env knobs (override at the top or via cron env):
#   FRONTEND_URL     Frontend root, expect HTTP 200
#                    (default https://careerpack.org)
#   CONVEX_API_URL   Convex API origin; /version must return 200
#                    (default https://api.careerpack.org)
#   CONVEX_SITE_URL  Convex site origin; /api/health must return ok:true
#                    (default https://site.careerpack.org)
#   BACKEND_CONTAINER  Docker container name of the Convex backend
#                    (default careerpack-convex-backend)
#   COMPOSE_PROJECT  Compose project to `up -d` on self-heal
#                    (default careerpack-convex-8gdbpk)
#   COMPOSE_DIR      Dir holding the compose file used for self-heal
#                    (default /etc/dokploy/compose/careerpack-convex-8gdbpk/code)
#   BACKUP_DIR       Where backup.sh writes archives
#                    (default /var/backups/careerpack)
#   BACKUP_MAX_AGE_H Warn if newest backup is older than N hours
#                    (default 25)
#   ALERT_HOOK       Executable invoked as `ALERT_HOOK "<message>"` on any
#                    failure / heal / stale-backup. No-op if absent.
#                    (default $HOME/.config/health-watch.alert)
#
# Health: never exits non-zero on a probe failure (cron should keep
# running); failures are surfaced via the alert hook + log line. Exits
# non-zero only on its own misuse (e.g. missing docker).

set -euo pipefail

FRONTEND_URL="${FRONTEND_URL:-https://careerpack.org}"
CONVEX_API_URL="${CONVEX_API_URL:-https://api.careerpack.org}"
CONVEX_SITE_URL="${CONVEX_SITE_URL:-https://site.careerpack.org}"
BACKEND_CONTAINER="${BACKEND_CONTAINER:-careerpack-convex-backend}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-careerpack-convex-8gdbpk}"
COMPOSE_DIR="${COMPOSE_DIR:-/etc/dokploy/compose/careerpack-convex-8gdbpk/code}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/careerpack}"
BACKUP_MAX_AGE_H="${BACKUP_MAX_AGE_H:-25}"
ALERT_HOOK="${ALERT_HOOK:-$HOME/.config/health-watch.alert}"

PROBLEMS=()

note_problem() {
  # Records a failure for the summary line + fires the alert hook once
  # per problem. The hook is the SAME contract the host already used
  # (health-watch.alert) so push delivery keeps working unchanged.
  local msg="$1"
  PROBLEMS+=("$msg")
  echo "[health] ALERT $msg" >&2
  if [[ -n "$ALERT_HOOK" && -x "$ALERT_HOOK" ]]; then
    "$ALERT_HOOK" "CareerPack: $msg" || true
  fi
}

# --- Probe 1: careerpack-frontend — root must return 200 ---------------
FE_CODE="$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 10 "$FRONTEND_URL" 2>/dev/null || true)"
if [[ "$FE_CODE" != "200" ]]; then
  note_problem "careerpack-frontend not 200 ($FRONTEND_URL -> ${FE_CODE:-no-response})"
fi

# --- Probe 2: careerpack-convex-api — /version must return 200 ---------
API_CODE="$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 10 "$CONVEX_API_URL/version" 2>/dev/null || true)"
if [[ "$API_CODE" != "200" ]]; then
  note_problem "careerpack-convex-api /version not 200 ($CONVEX_API_URL/version -> ${API_CODE:-no-response})"
fi

# --- Probe 3: careerpack-site-health — /api/health must be ok:true -----
HEALTH_BODY="$(curl -fsS --max-time 10 "$CONVEX_SITE_URL/api/health" 2>/dev/null || true)"
if ! printf '%s' "$HEALTH_BODY" | grep -q '"ok"[[:space:]]*:[[:space:]]*true'; then
  note_problem "careerpack-site-health /api/health not ok:true ($CONVEX_SITE_URL/api/health)"
fi

# --- Probe 4 + self-heal: careerpack-convex-container ------------------
# Inspect the backend container's Docker health. Three cases:
#   gone      -> container was DELETED: self-heal via `compose up -d`.
#   unhealthy -> exists but failing: restart-policy handles it; alert.
#   healthy   -> no-op.
CONTAINER_STATE="$(docker inspect -f '{{.State.Health.Status}}' "$BACKEND_CONTAINER" 2>/dev/null || true)"
if [[ -z "$CONTAINER_STATE" ]]; then
  # Container missing entirely — the exact 2026-06-11 incident class.
  note_problem "careerpack-convex-container GONE — running compose up -d (project=$COMPOSE_PROJECT)"
  if [[ -d "$COMPOSE_DIR" ]]; then
    # Idempotent: a no-op when the stack is already up; re-creates the
    # backend against the existing volume + network when it vanished.
    if (cd "$COMPOSE_DIR" && docker compose -p "$COMPOSE_PROJECT" up -d) >&2; then
      echo "[health] HEAL compose up -d ok (project=$COMPOSE_PROJECT)"
      if [[ -n "$ALERT_HOOK" && -x "$ALERT_HOOK" ]]; then
        "$ALERT_HOOK" "CareerPack: self-heal compose up -d ok (project=$COMPOSE_PROJECT)" || true
      fi
    else
      note_problem "careerpack-convex-container self-heal FAILED (project=$COMPOSE_PROJECT) — manual intervention needed"
    fi
  else
    note_problem "careerpack-convex-container self-heal skipped: compose dir missing ($COMPOSE_DIR)"
  fi
elif [[ "$CONTAINER_STATE" != "healthy" ]]; then
  note_problem "careerpack-convex-container unhealthy (state=$CONTAINER_STATE)"
fi

# --- Backup freshness: newest archive must be < BACKUP_MAX_AGE_H old ---
# Catches a silently-dead backup cron (the worst kind: looks fine until
# you need to restore). Matches both plain + gpg-encrypted shapes.
NEWEST_BACKUP="$(find "$BACKUP_DIR" -maxdepth 1 \( -name 'convex-*.tar.gz' -o -name 'convex-*.tar.gz.gpg' \) -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -1 || true)"
if [[ -z "$NEWEST_BACKUP" ]]; then
  note_problem "backup freshness: no archive found in $BACKUP_DIR"
else
  NEWEST_TS="${NEWEST_BACKUP%% *}"
  NEWEST_TS="${NEWEST_TS%.*}"
  AGE_H=$(( ( $(date +%s) - NEWEST_TS ) / 3600 ))
  if (( AGE_H >= BACKUP_MAX_AGE_H )); then
    note_problem "backup freshness: newest archive ${AGE_H}h old (>= ${BACKUP_MAX_AGE_H}h) in $BACKUP_DIR"
  fi
fi

# --- Summary ----------------------------------------------------------
if [[ "${#PROBLEMS[@]}" -eq 0 ]]; then
  echo "[health] OK frontend=$FE_CODE api=$API_CODE site=ok container=${CONTAINER_STATE:-recreated} backup<${BACKUP_MAX_AGE_H}h"
else
  echo "[health] PROBLEMS=${#PROBLEMS[@]}: ${PROBLEMS[*]}"
fi
