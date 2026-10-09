#!/usr/bin/env bash
# Pushing checks code; only the main-only production workflow deploys it.

set -euo pipefail

# --- Quality gate: typecheck + lint + tests + build (stdin redirected so
# --- subprocesses cannot consume Git's input).
if [[ "${SKIP_PUSH_CHECKS:-0}" == "1" ]]; then
  echo "[pre-push] SKIP_PUSH_CHECKS=1 — typecheck+lint+test+build gate skipped." >&2
else
  echo "[pre-push] Quality gate: pnpm typecheck…" >&2
  if ! pnpm typecheck < /dev/null; then
    echo "[pre-push] Typecheck FAILED — aborting push. Fix and retry, or 'SKIP_PUSH_CHECKS=1 git push' to bypass." >&2
    exit 1
  fi
  echo "[pre-push] Quality gate: pnpm lint…" >&2
  if ! pnpm lint < /dev/null; then
    echo "[pre-push] Lint FAILED — aborting push. Fix and retry, or 'SKIP_PUSH_CHECKS=1 git push' to bypass." >&2
    exit 1
  fi
  echo "[pre-push] Quality gate: vitest run (with coverage thresholds)…" >&2
  if ! pnpm test:coverage < /dev/null; then
    echo "[pre-push] Tests/coverage FAILED — aborting push. Fix and retry, or 'SKIP_PUSH_CHECKS=1 git push' to bypass." >&2
    exit 1
  fi
  # Shares frontend/.next with a running `pnpm dev`. If they race, next build
  # can die on a spurious ENOENT rename inside .next — that is the dev server,
  # not your diff: stop dev (or rm -rf frontend/.next) and push again.
  # MSO's operator shell may export TURBOPACK=1 globally; Next 15 treats that
  # as an implicit `next build --turbopack`, whose prerender path currently
  # breaks /404 in this app. Production does not request Turbopack, so make the
  # quality gate deterministic instead of inheriting an unrelated host flag.
  echo "[pre-push] Quality gate: pnpm build (TURBOPACK unset)…" >&2
  if ! env -u TURBOPACK pnpm build < /dev/null; then
    echo "[pre-push] Build FAILED — aborting push. Fix and retry, or 'SKIP_PUSH_CHECKS=1 git push' to bypass." >&2
    exit 1
  fi
  echo "[pre-push] Quality gate OK." >&2
fi

echo "[pre-push] Quality gate complete; production deploy uses the main-only workflow." >&2
