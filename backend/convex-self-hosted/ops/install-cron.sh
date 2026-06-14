#!/usr/bin/env bash
# CareerPack — host cron installer (backup + health-watch).
#
# Idempotently installs BOTH operational crontab lines into the current
# user's crontab (run as root on the Dokploy host):
#
#   1. Daily volume backup        0 3 * * *      -> backup.sh
#   2. Health watch + self-heal   */3 * * * *    -> health-watch.sh
#
# Re-running is safe: existing CareerPack lines (matched by script path)
# are dropped and rewritten, so there is never a duplicate. Other crontab
# entries are preserved untouched.
#
#   Install once:  sudo /opt/careerpack/install-cron.sh
#   Re-run any time to refresh the lines or pick up new env knobs.
#
# Pairs with:
#   backup.sh        docs/db-backup.md
#   health-watch.sh  docs/progress/2026-06-11-vps-incident-and-hardening.md
#
# Env knobs (override at the top or via the invoking env):
#   OPS_DIR        Dir the scripts are deployed to (default /opt/careerpack)
#   VOLUME_NAME    Pinned Convex volume for backup.sh — STRONGLY recommended
#                  on multi-project hosts (auto-detect refuses to guess).
#                  Injected into the backup cron line when set.
#   BACKUP_LOG     Backup log path (default /var/log/careerpack-backup.log)
#   HEALTH_LOG     Health-watch log path (default /var/log/careerpack-health.log)
#
# Health: exits non-zero if a target script is missing or `crontab` fails.

set -euo pipefail

OPS_DIR="${OPS_DIR:-/opt/careerpack}"
VOLUME_NAME="${VOLUME_NAME:-}"
BACKUP_LOG="${BACKUP_LOG:-/var/log/careerpack-backup.log}"
HEALTH_LOG="${HEALTH_LOG:-/var/log/careerpack-health.log}"

BACKUP_SH="$OPS_DIR/backup.sh"
HEALTH_SH="$OPS_DIR/health-watch.sh"

for f in "$BACKUP_SH" "$HEALTH_SH"; do
  if [[ ! -f "$f" ]]; then
    echo "[install-cron] FAIL: missing $f — copy the ops scripts to $OPS_DIR first." >&2
    exit 2
  fi
  chmod +x "$f"
done

# Compose the two managed lines. VOLUME_NAME is inlined only when given
# so the cron stays explicit on multi-project hosts.
if [[ -n "$VOLUME_NAME" ]]; then
  BACKUP_LINE="0 3 * * * VOLUME_NAME=$VOLUME_NAME $BACKUP_SH >> $BACKUP_LOG 2>&1"
else
  BACKUP_LINE="0 3 * * * $BACKUP_SH >> $BACKUP_LOG 2>&1"
fi
HEALTH_LINE="*/3 * * * * $HEALTH_SH >> $HEALTH_LOG 2>&1"

# Read the existing crontab (empty if none), strip ANY prior lines that
# reference our two scripts (idempotent — kills stale/duplicate forms),
# then append the fresh canonical lines. `crontab -l` exits non-zero when
# no crontab exists; tolerate that.
EXISTING="$(crontab -l 2>/dev/null || true)"

NEW="$(printf '%s\n' "$EXISTING" \
  | grep -v -F "$BACKUP_SH" \
  | grep -v -F "$HEALTH_SH" \
  || true)"

# Drop leading/trailing blank lines that accumulate from the filtering,
# then append our managed block.
NEW="$(printf '%s\n' "$NEW" | sed '/^[[:space:]]*$/d')"

{
  [[ -n "$NEW" ]] && printf '%s\n' "$NEW"
  printf '%s\n' "$BACKUP_LINE"
  printf '%s\n' "$HEALTH_LINE"
} | crontab -

echo "[install-cron] OK installed 2 lines into crontab:"
echo "  $BACKUP_LINE"
echo "  $HEALTH_LINE"
