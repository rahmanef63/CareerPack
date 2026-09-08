#!/usr/bin/env bash
# Snapshot the ACTIVE CareerPack production Convex deployment to a ZIP.
#
# Production recovered to the self-hosted fallback on 2026-09-09 after the
# previous Convex Cloud prod deployment became inaccessible. Do not rely on the
# ambient Convex CLI project selection for backups: it is exactly what caused the
# nightly Cloud backup to start failing silently after the project disappeared.
#
# The target is explicit and value-blind:
#   PROD_ENV_FILE=backend/convex-self-hosted/convex.env   # current default
#   PROD_ENV_FILE=backend/convex-cloud/prod.env          # future Cloud cutover
#
# Both env files are gitignored credentials. This script never prints them.
# Output goes OUTSIDE the repo because archives contain real user data.
#
#   ./scripts/backup-prod.sh                 # -> ~/backups/careerpack
#   BACKUP_DIR=/var/backups/careerpack ./scripts/backup-prod.sh
#
# BACKUP_PASSPHRASE_FILE: if set and readable, the verified archive is encrypted
# with `gpg --symmetric --cipher-algo AES256` and the plaintext zip is removed.
# Restore remains deliberately manual because `convex import --replace-all` is
# destructive and must always be preceded by a fresh rollback backup.

set -euo pipefail

# Resolve to repo root regardless of cron's working directory.
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

PROD_ENV_FILE="${PROD_ENV_FILE:-backend/convex-self-hosted/convex.env}"
BACKUP_DIR="${BACKUP_DIR:-${HOME}/backups/careerpack}"
KEEP="${KEEP:-14}"
BACKUP_PASSPHRASE_FILE="${BACKUP_PASSPHRASE_FILE:-}"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
OUT="${BACKUP_DIR}/careerpack-prod-${STAMP}.zip"

if [[ ! -r "${PROD_ENV_FILE}" ]]; then
  echo "[backup] target env file is not readable: ${PROD_ENV_FILE}" >&2
  exit 2
fi

# Every archive here is the full production dataset in plaintext. Keep it owner
# only from the instant the CLI creates it, not as an after-the-fact chmod.
umask 077
mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

# Include file storage: rows in the files table otherwise restore references to
# missing blobs. The env file explicitly selects the intended deployment.
pnpm exec convex export \
  --env-file "${PROD_ENV_FILE}" \
  --include-file-storage \
  --path "${OUT}"

# A zip without the table manifest is a truncated export. Never let a broken new
# snapshot prune a valid old one.
LISTING="$(unzip -Z1 "${OUT}")"
case "${LISTING}" in
  *_tables/documents.jsonl*) ;;
  *)
    echo "[backup] ${OUT} has no _tables manifest — treating as corrupt, removing." >&2
    rm -f "${OUT}"
    exit 1
    ;;
esac

# Validate every documents.jsonl line before accepting the archive.
BAD=0
while read -r entry; do
  case "${entry}" in
    */documents.jsonl)
      if ! unzip -p "${OUT}" "${entry}" | node -e '
        let d = "";
        process.stdin.on("data", (c) => (d += c)).on("end", () => {
          for (const line of d.split("\n")) {
            if (line.trim() === "") continue;
            try { JSON.parse(line); } catch { process.exit(1); }
          }
        });
      '; then
        echo "[backup] unparseable rows in ${entry}" >&2
        BAD=1
      fi
      ;;
  esac
done <<< "${LISTING}"
if [[ "${BAD}" -ne 0 ]]; then
  echo "[backup] ${OUT} failed JSON validation — treating as corrupt, removing." >&2
  rm -f "${OUT}"
  exit 1
fi

TABLES=$(unzip -p "${OUT}" _tables/documents.jsonl | wc -l)
echo "[backup] OK ${OUT} ($(du -h "${OUT}" | cut -f1), ${TABLES} tables, all rows parse)"

# Encrypt only after validation so a failed gpg operation cannot destroy the
# last readable new snapshot.
ENCRYPT_FAILED=0
if [[ -n "${BACKUP_PASSPHRASE_FILE}" ]]; then
  if [[ ! -r "${BACKUP_PASSPHRASE_FILE}" ]]; then
    echo "[backup] WARN: BACKUP_PASSPHRASE_FILE is not readable — archive left UNENCRYPTED." >&2
    ENCRYPT_FAILED=1
  elif ! command -v gpg >/dev/null 2>&1; then
    echo "[backup] WARN: gpg is not installed — archive left UNENCRYPTED." >&2
    ENCRYPT_FAILED=1
  elif gpg --batch --yes --symmetric --cipher-algo AES256 \
        --passphrase-file "${BACKUP_PASSPHRASE_FILE}" \
        --output "${OUT}.gpg" "${OUT}"; then
    rm -f "${OUT}"
    OUT="${OUT}.gpg"
    echo "[backup] encrypted -> ${OUT} ($(du -h "${OUT}" | cut -f1))"
  else
    echo "[backup] WARN: gpg failed — archive left UNENCRYPTED at ${OUT}." >&2
    rm -f "${OUT}.gpg"
    ENCRYPT_FAILED=1
  fi
fi

# Prune only after the new archive has been validated. `ls` with two globs is
# deliberately avoided: if one extension has zero matches it exits 2 under
# `set -euo pipefail`, falsely marking a successful backup as failed.
find "${BACKUP_DIR}" -maxdepth 1 -type f \
  \( -name 'careerpack-prod-*.zip' -o -name 'careerpack-prod-*.zip.gpg' \) \
  -printf '%T@ %p\n' \
  | sort -nr \
  | tail -n +"$((KEEP + 1))" \
  | cut -d' ' -f2- \
  | while IFS= read -r old; do
      [[ -z "$old" ]] && continue
      echo "[backup] pruning ${old}"
      rm -f "$old"
    done

if [[ "${ENCRYPT_FAILED}" -ne 0 ]]; then
  echo "[backup] encryption was requested and did not happen." >&2
  exit 1
fi
