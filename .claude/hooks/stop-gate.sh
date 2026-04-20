#!/usr/bin/env bash
# Stop hook: lightweight gate after Claude finishes a turn.
# Only runs when frontend/ or convex/ files changed in working tree.
# Fails with exit 2 (feeds stderr back to Claude) if lint/typecheck broken.
set -u
cd "$(dirname "$0")/../.." || exit 0

# No changes at all → skip (don't slow down conversational turns).
if [[ -z $(git status --porcelain 2>/dev/null) ]]; then exit 0; fi

# Only gate when code surfaces change. Docs/config/.claude edits skip gate.
if ! git status --porcelain | grep -qE '^.{2} (frontend/|convex/)'; then exit 0; fi

OUT=$(mktemp)
trap 'rm -f "$OUT"' EXIT

echo "▸ gate: lint + typecheck on dirty tree"
if ! pnpm -s lint >"$OUT" 2>&1; then
  echo "✖ lint failed:" >&2
  tail -40 "$OUT" >&2
  echo "--- fix lint errors before shipping ---" >&2
  exit 2
fi

if ! pnpm -s typecheck >"$OUT" 2>&1; then
  echo "✖ typecheck failed:" >&2
  tail -40 "$OUT" >&2
  echo "--- fix type errors before shipping ---" >&2
  exit 2
fi

echo "✓ lint + typecheck clean"
exit 0
