#!/usr/bin/env bash
set -euo pipefail
SCRIPT="$(cd "$(dirname "$0")/../backend/convex-self-hosted" && pwd)/backup.sh"
TEMP_BASE="$(cd "${TMPDIR:-/tmp}" && pwd -P)"
TEMP="$(mktemp -d "$TEMP_BASE/careerpack-backup-test.XXXXXX")"
[[ "$TEMP" == "$TEMP_BASE"/careerpack-backup-test.* ]] || exit 1
trap 'rm -rf -- "$TEMP"' EXIT
export GNUPGHOME="$TEMP/gpg"
mkdir "$GNUPGHOME"
# Git Bash cannot enforce POSIX modes on every Windows volume.
chmod() { command chmod "$@" || [[ "$OSTYPE" == msys* ]]; }
export -f chmod
export VOLUME_NAME="test-only" BACKUP_DIR="$TEMP/archives"
export BACKUP_IMAGE="alpine@sha256:$(printf 'a%.0s' {1..64})"
docker() { printf 'test-private-volume-data'; }
export -f docker

export BACKUP_PASSPHRASE_FILE="$TEMP/missing"
if bash "$SCRIPT" >/dev/null 2>&1; then echo "missing key accepted"; exit 1; fi
test ! -e "$BACKUP_DIR"
printf 'test-only-passphrase' > "$TEMP/key"
export BACKUP_PASSPHRASE_FILE="$TEMP/key"
gpg() { return 1; }
export -f gpg
if bash "$SCRIPT" >/dev/null 2>&1; then echo "failed encryption accepted"; exit 1; fi
test -z "$(find "$BACKUP_DIR" -type f -print)"
unset -f gpg

bash "$SCRIPT" >/dev/null
test "$(find "$BACKUP_DIR" -type f | wc -l)" -eq 1
ARCHIVE="$(find "$BACKUP_DIR" -name '*.gpg')"
test -n "$ARCHIVE"
test "$(gpg --batch --pinentry-mode loopback --passphrase-file "$TEMP/key" --decrypt "$ARCHIVE" 2>/dev/null)" = 'test-private-volume-data'
export BACKUP_IMAGE="alpine:latest"
if bash "$SCRIPT" >/dev/null 2>&1; then echo "mutable image accepted"; exit 1; fi
echo "backup security checks passed"
