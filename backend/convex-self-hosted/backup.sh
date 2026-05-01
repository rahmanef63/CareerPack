#!/usr/bin/env bash
# CareerPack — Convex self-hosted volume backup.
#
# Snapshots the Docker named volume that holds all Convex data into a
# tar.gz under $BACKUP_DIR, prunes archives older than $RETENTION_DAYS,
# and prints a one-line summary suitable for cron mail.
#
# Designed to be idempotent + runnable from any cron without context:
#   crontab entry:  0 3 * * * /opt/careerpack/backup.sh >> /var/log/careerpack-backup.log 2>&1
#
# Env knobs (override at the top or via cron env):
#   VOLUME_NAME      Docker volume to snapshot (auto-detected if unset)
#   BACKUP_DIR       Destination directory (default /var/backups/careerpack)
#   RETENTION_DAYS   Days to keep archives (default 14)
#
# Health: exits non-zero on tar error; prune is best-effort.

set -euo pipefail

VOLUME_NAME="${VOLUME_NAME:-}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/careerpack}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

if [[ -z "$VOLUME_NAME" ]]; then
  # Auto-detect: first volume whose name contains "convex" or "data".
  VOLUME_NAME="$(docker volume ls --format '{{.Name}}' | grep -iE 'convex|careerpack.*data' | head -1 || true)"
fi

if [[ -z "$VOLUME_NAME" ]]; then
  echo "[backup] FAIL: no Convex volume detected. Set VOLUME_NAME explicitly." >&2
  exit 2
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

STAMP="$(date -u +%Y%m%d-%H%M)"
OUT="$BACKUP_DIR/convex-$STAMP.tar.gz"

# Read-only mount keeps the running container untouched.
docker run --rm \
  -v "$VOLUME_NAME:/source:ro" \
  -v "$BACKUP_DIR:/dest" \
  alpine \
  sh -c "tar czf /dest/convex-$STAMP.tar.gz -C /source ."

SIZE="$(du -h "$OUT" | cut -f1)"

# Prune older archives. Best-effort (don't fail backup if prune hiccups).
PRUNED="$(find "$BACKUP_DIR" -maxdepth 1 -name 'convex-*.tar.gz' -mtime "+$RETENTION_DAYS" -print -delete | wc -l || true)"

echo "[backup] OK volume=$VOLUME_NAME archive=$OUT size=$SIZE pruned=$PRUNED retention=${RETENTION_DAYS}d"
