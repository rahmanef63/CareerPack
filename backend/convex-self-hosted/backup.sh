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
#   VOLUME_NAME             Docker volume to snapshot (auto-detected if unset)
#   BACKUP_DIR              Destination directory (default /var/backups/careerpack)
#   RETENTION_DAYS          Days to keep archives (default 14)
#   BACKUP_PASSPHRASE_FILE  If set + readable, archives are AES-256
#                           encrypted via gpg --symmetric before write.
#                           Output extension becomes .tar.gz.gpg.
#                           Restore: gpg --decrypt -o out.tar.gz file.tar.gz.gpg
#
# Encryption rationale: a plain tarball on the VPS disk = full data
# leak (auth secrets, AI keys, all user content) on host compromise.
# Passphrase-only symmetric is the lightest viable mitigation; key
# escrow is the operator's responsibility.
#
# Health: exits non-zero on tar/gpg error; prune is best-effort.

set -euo pipefail

VOLUME_NAME="${VOLUME_NAME:-}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/careerpack}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
BACKUP_PASSPHRASE_FILE="${BACKUP_PASSPHRASE_FILE:-}"

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
TAR_NAME="convex-$STAMP.tar.gz"
TAR_PATH="$BACKUP_DIR/$TAR_NAME"

# Read-only mount keeps the running container untouched.
docker run --rm \
  -v "$VOLUME_NAME:/source:ro" \
  -v "$BACKUP_DIR:/dest" \
  alpine \
  sh -c "tar czf /dest/$TAR_NAME -C /source ."

OUT="$TAR_PATH"
ENCRYPTED="no"

if [[ -n "$BACKUP_PASSPHRASE_FILE" && -r "$BACKUP_PASSPHRASE_FILE" ]]; then
  if ! command -v gpg >/dev/null 2>&1; then
    echo "[backup] WARN: BACKUP_PASSPHRASE_FILE set but gpg not installed. Leaving archive unencrypted." >&2
  else
    GPG_OUT="$TAR_PATH.gpg"
    gpg --batch --yes --symmetric --cipher-algo AES256 \
      --passphrase-file "$BACKUP_PASSPHRASE_FILE" \
      --output "$GPG_OUT" "$TAR_PATH"
    chmod 600 "$GPG_OUT"
    rm -f "$TAR_PATH"
    OUT="$GPG_OUT"
    ENCRYPTED="yes"
  fi
elif [[ -n "$BACKUP_PASSPHRASE_FILE" ]]; then
  echo "[backup] WARN: BACKUP_PASSPHRASE_FILE='$BACKUP_PASSPHRASE_FILE' not readable. Leaving archive unencrypted." >&2
fi

SIZE="$(du -h "$OUT" | cut -f1)"

# Prune older archives. Best-effort (don't fail backup if prune hiccups).
# Match both encrypted + unencrypted shapes so the prune sweeps mixed
# generations cleanly.
PRUNED="$(find "$BACKUP_DIR" -maxdepth 1 \( -name 'convex-*.tar.gz' -o -name 'convex-*.tar.gz.gpg' \) -mtime "+$RETENTION_DAYS" -print -delete | wc -l || true)"

echo "[backup] OK volume=$VOLUME_NAME archive=$OUT size=$SIZE encrypted=$ENCRYPTED pruned=$PRUNED retention=${RETENTION_DAYS}d"
