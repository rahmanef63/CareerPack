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
# RECOVERED 2026-09-09. The Convex Cloud production deployment
# `proficient-dove-151` became inaccessible after the 2026-09-05 backup.
# Production is temporarily back on the restored self-hosted fallback at
# `api.careerpack.org` / `site.careerpack.org`, so container self-heal and
# backup freshness are again part of the production health contract.
#
# When a replacement Cloud production deployment is cut over, set
# SELF_HOSTED=0 and override CONVEX_API_URL / CONVEX_SITE_URL explicitly.
#
# Env knobs (override at the top or via cron env):
#   FRONTEND_URL     Frontend root, expect HTTP 200
#                    (default https://careerpack.org)
#   CONVEX_API_URL   Convex API origin; /version must return 200
#                    (default https://api.careerpack.org)
#   CONVEX_SITE_URL  Convex site origin; /api/health must return ok:true
#                    (default https://site.careerpack.org)
#   SELF_HOSTED      1 = also run the container probe, self-heal and volume
#                    backup-freshness check. 1 is the current default; 0 = Cloud, so
#                    there is no container to inspect and no volume tar to age
#                    out; checking either would alert forever on a healthy
#                    deployment.
#   BACKEND_CONTAINER  Optional exact Docker container name. Empty (default)
#                    auto-discovers the backend by Compose project + service.
#   COMPOSE_SERVICE  Compose backend service name (default backend)
#   COMPOSE_PROJECT  Compose project to `up -d` on self-heal
#                    (default careerpack-convex-8gdbpk)
#   COMPOSE_DIR      Dir holding the compose file used for self-heal
#                    (default /etc/dokploy/compose/careerpack-convex-8gdbpk/code)
#   BACKUP_DIR       Where backup.sh writes archives
#                    (default $HOME/backups/careerpack)
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
SELF_HOSTED="${SELF_HOSTED:-1}"
BACKEND_CONTAINER="${BACKEND_CONTAINER:-}"
COMPOSE_SERVICE="${COMPOSE_SERVICE:-backend}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-careerpack-convex-8gdbpk}"
COMPOSE_DIR="${COMPOSE_DIR:-/etc/dokploy/compose/careerpack-convex-8gdbpk/code}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/careerpack}"
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
# Self-hosted only. Against a Cloud backend there is no container, so the
# "gone" branch would fire every tick and try to bring the retired stack back.
CONTAINER_STATE=""
if [[ "$SELF_HOSTED" == "1" ]]; then
  # Dokploy/Compose owns the concrete container name, so discover it from stable
  # Compose labels instead of pinning a name that drifts across redeploys.
  if [[ -z "$BACKEND_CONTAINER" ]]; then
    BACKEND_CONTAINER="$(docker ps -a \
      --filter "label=com.docker.compose.project=$COMPOSE_PROJECT" \
      --filter "label=com.docker.compose.service=$COMPOSE_SERVICE" \
      --format '{{.Names}}' | head -1 || true)"
  fi
  if [[ -n "$BACKEND_CONTAINER" ]]; then
    CONTAINER_STATE="$(docker inspect -f '{{.State.Health.Status}}' "$BACKEND_CONTAINER" 2>/dev/null || true)"
  fi
  if [[ -z "$CONTAINER_STATE" ]]; then
    # Container missing entirely — the exact 2026-06-11 incident class.
    note_problem "careerpack-convex-container GONE — running compose up -d $COMPOSE_SERVICE (project=$COMPOSE_PROJECT)"
    if [[ -d "$COMPOSE_DIR" ]]; then
      # Start ONLY the backend service. The compose project also contains a
      # dashboard image whose registry access can fail; pulling that unrelated
      # service must never block recovery of the API users actually need.
      if (cd "$COMPOSE_DIR" && docker compose -p "$COMPOSE_PROJECT" up -d "$COMPOSE_SERVICE") >&2; then
        echo "[health] HEAL compose up -d $COMPOSE_SERVICE ok (project=$COMPOSE_PROJECT)"
        BACKEND_CONTAINER="$(docker ps -a \
          --filter "label=com.docker.compose.project=$COMPOSE_PROJECT" \
          --filter "label=com.docker.compose.service=$COMPOSE_SERVICE" \
          --format '{{.Names}}' | head -1 || true)"
        if [[ -n "$BACKEND_CONTAINER" ]]; then
          CONTAINER_STATE="$(docker inspect -f '{{.State.Health.Status}}' "$BACKEND_CONTAINER" 2>/dev/null || true)"
        fi
        if [[ -n "$ALERT_HOOK" && -x "$ALERT_HOOK" ]]; then
          "$ALERT_HOOK" "CareerPack: self-heal backend service ok (project=$COMPOSE_PROJECT)" || true
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
fi

# --- Backup freshness: newest archive must be < BACKUP_MAX_AGE_H old ---
# Catches a silently-dead backup cron (the worst kind: looks fine until
# you need to restore). Accepts verified Convex snapshot ZIPs as well as
# lower-level volume tarballs, plain or gpg-encrypted.
if [[ "$SELF_HOSTED" == "1" ]]; then
NEWEST_BACKUP="$(find "$BACKUP_DIR" -maxdepth 1 \( -name 'careerpack-prod-*.zip' -o -name 'careerpack-prod-*.zip.gpg' -o -name 'convex-*.tar.gz' -o -name 'convex-*.tar.gz.gpg' \) -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -1 || true)"
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
fi

# --- Summary ----------------------------------------------------------
if [[ "$SELF_HOSTED" == "1" ]]; then
  EXTRA="container=${CONTAINER_STATE:-recreated} backup<${BACKUP_MAX_AGE_H}h"
else
  EXTRA="backend=cloud"
fi
if [[ "${#PROBLEMS[@]}" -eq 0 ]]; then
  echo "[health] OK frontend=$FE_CODE api=$API_CODE site=ok $EXTRA"
else
  echo "[health] PROBLEMS=${#PROBLEMS[@]}: ${PROBLEMS[*]}"
fi
