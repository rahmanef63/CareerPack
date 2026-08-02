#!/usr/bin/env bash
# Snapshot the PRODUCTION Convex Cloud deployment (savory-oyster-802) to a ZIP.
#
# Why this exists: the nightly tar cron on the VPS and the PASSED restore drill
# in docs/db-backup.md both back up the *self-hosted* Docker volume, which has
# held nothing user-facing since the 2026-07-10 cutover. Production data lives in
# Convex Cloud and had no verified backup at all until 2026-07-30.
#
# Auth, in the order the CLI resolves it:
#   - CONVEX_DEPLOY_KEY in the environment (use this on the VPS / in cron), or
#   - an interactive `npx convex login` session in ~/.convex/config.json.
#
# Output goes OUTSIDE the repo — the archive contains real user PII.
#
#   ./scripts/backup-prod.sh                 # -> ~/backups/careerpack
#   BACKUP_DIR=/var/backups/careerpack ./scripts/backup-prod.sh
#
# Restore is deliberately NOT automated: `convex import --replace` against prod
# is a data-destroying operation and should be typed out by a human who has just
# read docs/db-backup.md.

set -euo pipefail

# Resolve to the repo root regardless of where this is invoked from. `pnpm exec
# convex` needs the workspace, and cron starts every job in $HOME.
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

BACKUP_DIR="${BACKUP_DIR:-${HOME}/backups/careerpack}"
KEEP="${KEEP:-14}"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
OUT="${BACKUP_DIR}/careerpack-prod-${STAMP}.zip"

# Every archive here is the full production dataset in plaintext — names,
# emails, CVs, salary figures. This box is shared: a second human account
# (`ubuntu`) exists and ~35 containers run on it. The CLI writes 0644 under the
# inherited umask, which made those archives world-readable. Set the umask
# before the export rather than chmod-ing after it, so the file is never
# readable even for the minute the download takes.
umask 077
mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

# --include-file-storage: the `files` table stores only storage IDs, so a export
# without the blobs restores rows that point at nothing.
pnpm exec convex export --prod --include-file-storage --path "${OUT}"

# A zip the CLI wrote but that has no _tables/documents.jsonl is a truncated
# download, and keeping it would let the prune below evict a good one.
# Listed into a variable rather than piped into `grep -q`: under `pipefail` the
# early exit of `grep -q` SIGPIPEs unzip, and the pipeline then reports failure
# for a perfectly good archive.
LISTING="$(unzip -Z1 "${OUT}")"
case "${LISTING}" in
  *_tables/documents.jsonl*) ;;
  *)
    echo "[backup] ${OUT} has no _tables manifest — treating as corrupt, removing." >&2
    rm -f "${OUT}"
    exit 1
    ;;
esac

# Parse every documents.jsonl line. A zip that unzips fine can still hold a
# half-written row, and the place you do not want to discover that is halfway
# through a restore. This is not a restore drill — see docs/db-backup.md — but
# it does mean "the archive downloaded" and "the archive is readable" stop being
# the same claim.
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

# Prune oldest first, keeping $KEEP. Runs only after the new archive verified,
# so a failing export can never erode the history.
ls -1t "${BACKUP_DIR}"/careerpack-prod-*.zip 2>/dev/null | tail -n +"$((KEEP + 1))" | while read -r old; do
  echo "[backup] pruning ${old}"
  rm -f "${old}"
done
