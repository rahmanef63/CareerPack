#!/usr/bin/env bash
# audit-bp KPI script — fast mechanical findings for Next.js + Convex projects.
#
# Usage:
#   audit-bp.sh                         # scope = --changed (default)
#   audit-bp.sh --changed               # same as default
#   audit-bp.sh --full                  # whole repo
#   audit-bp.sh --slice <path>          # one subtree
#   audit-bp.sh --json                  # machine-readable output only
#
# Exit codes:
#   0 — every metric zero
#   1 — one or more metrics nonzero (findings to triage)
#   2 — script error (not a git repo, bad args, etc)
#
# The script is safe to pipe into CI — `--json` prints just the KPI object,
# no human chrome. Without `--json` it prints both the object AND a short
# per-metric breakdown.

set -uo pipefail

# ---------- arg parsing ----------
SCOPE="changed"
SLICE_PATH=""
JSON_ONLY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --full) SCOPE="full"; shift ;;
    --changed) SCOPE="changed"; shift ;;
    --slice)
      SCOPE="slice"
      SLICE_PATH="${2:-}"
      if [[ -z "$SLICE_PATH" ]]; then
        echo "audit-bp: --slice requires a path" >&2
        exit 2
      fi
      shift 2
      ;;
    --json) JSON_ONLY=1; shift ;;
    -h|--help)
      sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "audit-bp: unknown arg: $1" >&2
      exit 2
      ;;
  esac
done

# ---------- repo sanity ----------
if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "audit-bp: not inside a git repository" >&2
  exit 2
fi
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# ---------- build file list ----------
case "$SCOPE" in
  full)
    mapfile -t FILES < <(git ls-files)
    ;;
  changed)
    {
      git diff --name-only HEAD~15 HEAD 2>/dev/null
      git status --porcelain | awk '{print $2}'
    } | sort -u > /tmp/audit-bp-files.$$
    mapfile -t FILES < /tmp/audit-bp-files.$$
    rm -f /tmp/audit-bp-files.$$
    ;;
  slice)
    if [[ ! -e "$SLICE_PATH" ]]; then
      echo "audit-bp: slice path does not exist: $SLICE_PATH" >&2
      exit 2
    fi
    mapfile -t FILES < <(git ls-files -- "$SLICE_PATH")
    ;;
esac

# Filter to source files under typical project dirs, exclude generated/test/
# docs noise. Only .ts/.tsx/.js/.jsx reach the grep pass — grep example
# snippets inside .md, commit messages, and JSDoc would otherwise count as
# false-positive violations.
KEEP=()
for f in "${FILES[@]:-}"; do
  [[ -z "$f" ]] && continue
  [[ ! -f "$f" ]] && continue
  case "$f" in
    */node_modules/*|*/_generated/*|*/.next/*|*/dist/*|*/build/*) continue ;;
    *.test.ts|*.test.tsx|*.test.js|*.test.jsx|*.spec.ts|*.spec.tsx) continue ;;
    *.md|*.mdx|*.txt|*.json|*.yml|*.yaml|*.css|*.scss|*.html) continue ;;
  esac
  case "$f" in
    *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs) KEEP+=("$f") ;;
    # else: skip unknown extensions to stay conservative
  esac
done

FILES_SCANNED=${#KEEP[@]}

# ---------- metric helpers ----------
# count_grep PATTERN — count lines matching PATTERN across KEEP files.
count_grep() {
  local pattern="$1"
  local count=0
  if [[ ${#KEEP[@]} -eq 0 ]]; then
    echo 0
    return
  fi
  # Batch grep — safe for a few thousand files.
  count=$(printf '%s\n' "${KEEP[@]}" | xargs -d '\n' grep -E "$pattern" 2>/dev/null | wc -l || true)
  echo "${count:-0}"
}

# count_grep_paths PATTERN PATH_GLOB — count within a path subset.
count_grep_paths() {
  local pattern="$1"
  local path_glob="$2"
  local count=0
  local matches=()
  for f in "${KEEP[@]:-}"; do
    case "$f" in
      $path_glob) matches+=("$f") ;;
    esac
  done
  if [[ ${#matches[@]} -eq 0 ]]; then
    echo 0
    return
  fi
  count=$(printf '%s\n' "${matches[@]}" | xargs -d '\n' grep -E "$pattern" 2>/dev/null | wc -l || true)
  echo "${count:-0}"
}

# ---------- metrics ----------
# Raw <a href=...> in source files — count only lines where the href is:
#  - not a protocol URL (mailto:/tel:/sms:/ftp:) — those MUST stay as <a>
#    for OS handoff
#  - not already properly attributed external (target="_blank") — those
#    are correct external-link usage; SmartLink also renders this shape
#    internally
# What's left = candidates for SmartLink / next/link migration.
#
# Uses a subshell + `true` so grep's "no match → exit 1" doesn't abort
# under `set -e` elsewhere. `head -1` guards against any multi-line count.
RAW_ANCHOR=0
for f in "${KEEP[@]:-}"; do
  case "$f" in frontend/*|components/*|app/*) ;; *) continue ;; esac
  total=$({ grep -cE '<a[[:space:]]+href=' "$f" 2>/dev/null; true; } | head -1)
  # Match protocol hrefs in three shapes JSX uses:
  #   <a href="mailto:…">                     (string literal)
  #   <a href='mailto:…'>                     (single-quoted)
  #   <a href={`mailto:${x}`}>                 (template literal)
  proto=$({ grep -cE '<a[[:space:]]+href=(["'\'']|\{`)(mailto|tel|sms|ftp):' "$f" 2>/dev/null; true; } | head -1)
  blank=$({ grep -cE '<a[[:space:]][^>]*target=["'\'']_blank' "$f" 2>/dev/null; true; } | head -1)
  total=${total:-0}
  proto=${proto:-0}
  blank=${blank:-0}
  hits=$(( total - proto - blank ))
  (( hits < 0 )) && hits=0
  RAW_ANCHOR=$(( RAW_ANCHOR + hits ))
done

# Raw <img > in source files.
RAW_IMG=$(count_grep_paths '<img[[:space:]]' 'frontend/*')
RAW_IMG_COMPONENTS=$(count_grep_paths '<img[[:space:]]' 'components/*')
RAW_IMG_APP=$(count_grep_paths '<img[[:space:]]' 'app/*')
RAW_IMG=$(( RAW_IMG + RAW_IMG_COMPONENTS + RAW_IMG_APP ))

# Unbounded .collect() inside write-path mutation files.
UNBOUNDED_COLLECT=$(count_grep_paths '\.collect\(\)' 'convex/features/*/mutations.ts')
UNBOUNDED_COLLECT_NESTED=$(count_grep_paths '\.collect\(\)' 'convex/features/*/api/mutations.ts')
UNBOUNDED_COLLECT=$(( UNBOUNDED_COLLECT + UNBOUNDED_COLLECT_NESTED ))

# Native <input type="date"> (should be a date-picker primitive).
NATIVE_DATE=$(count_grep 'type="date"')

# identity.email bypassing readIdentityEmail normalizer — excluding the helper itself.
IDENTITY_BYPASS=0
for f in "${KEEP[@]:-}"; do
  case "$f" in convex/*) ;; *) continue ;; esac
  case "$f" in */authIdentity.*) continue ;; esac
  if grep -Eq 'identity\?\.email|identity\.email' "$f" 2>/dev/null; then
    if ! grep -Eq 'readIdentityEmail|resolveIdentityEmail' "$f" 2>/dev/null; then
      hits=$({ grep -cE 'identity\?\.email|identity\.email' "$f" 2>/dev/null; true; } | head -1)
      hits=${hits:-0}
      IDENTITY_BYPASS=$(( IDENTITY_BYPASS + hits ))
    fi
  fi
done

# catch (err: any) — violates "no any outside escape hatches".
TYPED_CATCH_ANY=$(count_grep 'catch \(\w+: any\)')

# Hardcoded feature id conditionals — violates auto-discovery.
HARDCODED_FEATURE_ID=$(count_grep 'featureId === ')

# @ts-ignore / @ts-expect-error without a reason comment on the same line.
TS_IGNORE_UNREASONED=0
for f in "${KEEP[@]:-}"; do
  case "$f" in *.ts|*.tsx) ;; *) continue ;; esac
  # Match a line that is JUST @ts-ignore or @ts-expect-error with optional whitespace — no trailing reason.
  hits=$({ grep -cE '^[[:space:]]*//[[:space:]]*@ts-(ignore|expect-error)[[:space:]]*$' "$f" 2>/dev/null; true; } | head -1)
  hits=${hits:-0}
  TS_IGNORE_UNREASONED=$(( TS_IGNORE_UNREASONED + hits ))
done

# ---------- Next.js 16 + Convex self-hosted metrics ----------
# Repo-global probes (not gated by KEEP list) — these are repo-topology signals,
# not per-file grep hits. Checked once at the repo root.

# Legacy middleware.ts present without proxy.ts (Next 16 migration signal).
LEGACY_MIDDLEWARE=0
if [[ -f "middleware.ts" || -f "middleware.js" || -f "src/middleware.ts" || -f "src/middleware.js" ]]; then
  if [[ ! -f "proxy.ts" && ! -f "proxy.js" && ! -f "src/proxy.ts" && ! -f "src/proxy.js" ]]; then
    LEGACY_MIDDLEWARE=1
  fi
fi

# Pages with 2+ preloadQuery calls — consistency-sensitive without explicit design.
PRELOADQUERY_MULTI=0
for f in "${KEEP[@]:-}"; do
  case "$f" in app/*|src/app/*) ;; *) continue ;; esac
  hits=$({ grep -cE 'preloadQuery\s*\(' "$f" 2>/dev/null; true; } | head -1)
  hits=${hits:-0}
  (( hits >= 2 )) && PRELOADQUERY_MULTI=$(( PRELOADQUERY_MULTI + 1 ))
done

# Server Action files with "use server" but no auth/identity check in the same file.
# Heuristic: file contains 'use server' but none of: getUserIdentity, ensureUser,
# requirePermission, auth(), currentUser, getServerSession, getSession.
SERVER_ACTION_NO_AUTH=0
for f in "${KEEP[@]:-}"; do
  case "$f" in app/*|src/app/*|actions/*|src/actions/*) ;; *) continue ;; esac
  if grep -Eq "^['\"]use server['\"]" "$f" 2>/dev/null; then
    if ! grep -Eq 'getUserIdentity|ensureUser|requirePermission|currentUser|getServerSession|\bauth\(\)|getSession' "$f" 2>/dev/null; then
      SERVER_ACTION_NO_AUTH=$(( SERVER_ACTION_NO_AUTH + 1 ))
    fi
  fi
done

# Convex public functions without args validator. Best-effort:
# match `export const X = (query|mutation|action)(...)` then verify an `args:` key
# appears within ~40 lines. Ignores internalQuery/internalMutation/internalAction.
CONVEX_PUBLIC_NO_VALIDATOR=0
for f in "${KEEP[@]:-}"; do
  case "$f" in convex/*) ;; *) continue ;; esac
  case "$f" in convex/_generated/*) continue ;; esac
  # awk window: for each line that opens a public convex handler, look ahead 40 lines for `args:`.
  hits=$(awk '
    /export[[:space:]]+const[[:space:]]+[A-Za-z0-9_]+[[:space:]]*=[[:space:]]*(query|mutation|action)[[:space:]]*\(/ {
      found=0;
      for (i=0; i<40 && (getline line)>0; i++) {
        if (line ~ /args[[:space:]]*:/) { found=1; break }
        if (line ~ /^\}\)\s*;?\s*$/) break
      }
      if (!found) count++
    }
    END { print count+0 }
  ' "$f" 2>/dev/null)
  hits=${hits:-0}
  CONVEX_PUBLIC_NO_VALIDATOR=$(( CONVEX_PUBLIC_NO_VALIDATOR + hits ))
done

# Self-hosted Convex on default SQLite — docker-compose has convex-backend
# image but no POSTGRES_URL or MYSQL_URL env anywhere in the compose file(s).
SELFHOSTED_SQLITE_DEFAULT=0
for compose in docker-compose.yml docker-compose.yaml docker-compose.*.yml docker-compose.*.yaml; do
  [[ -f "$compose" ]] || continue
  if grep -Eq 'convex-backend|get-convex/convex-backend' "$compose" 2>/dev/null; then
    if ! grep -Eq 'POSTGRES_URL|MYSQL_URL' "$compose" 2>/dev/null; then
      SELFHOSTED_SQLITE_DEFAULT=$(( SELFHOSTED_SQLITE_DEFAULT + 1 ))
    fi
  fi
done

# Missing `deploymentId` in next.config.* — matters for multi-instance version-skew
# protection. Counts each next.config that lacks the setting.
MISSING_DEPLOYMENT_ID=0
for cfg in next.config.js next.config.ts next.config.mjs next.config.cjs; do
  [[ -f "$cfg" ]] || continue
  if ! grep -Eq 'deploymentId' "$cfg" 2>/dev/null; then
    MISSING_DEPLOYMENT_ID=$(( MISSING_DEPLOYMENT_ID + 1 ))
  fi
done

# Missing NEXT_SERVER_ACTIONS_ENCRYPTION_KEY — checked across env examples and
# known secret docs. Rolling multi-instance deploys break Server Actions without it.
MISSING_SERVER_ACTIONS_KEY=0
FOUND_KEY=0
for envf in .env .env.example .env.local.example .env.production .env.production.example; do
  [[ -f "$envf" ]] || continue
  if grep -Eq 'NEXT_SERVER_ACTIONS_ENCRYPTION_KEY' "$envf" 2>/dev/null; then
    FOUND_KEY=1
    break
  fi
done
# Only flag when the repo looks like a Next.js app (has next.config.*).
if [[ $FOUND_KEY -eq 0 ]]; then
  for cfg in next.config.js next.config.ts next.config.mjs next.config.cjs; do
    if [[ -f "$cfg" ]]; then
      MISSING_SERVER_ACTIONS_KEY=1
      break
    fi
  done
fi

# ---------- compute exit code ----------
TOTAL=$(( RAW_ANCHOR + RAW_IMG + UNBOUNDED_COLLECT + NATIVE_DATE + IDENTITY_BYPASS + TYPED_CATCH_ANY + HARDCODED_FEATURE_ID + TS_IGNORE_UNREASONED + LEGACY_MIDDLEWARE + PRELOADQUERY_MULTI + SERVER_ACTION_NO_AUTH + CONVEX_PUBLIC_NO_VALIDATOR + SELFHOSTED_SQLITE_DEFAULT + MISSING_DEPLOYMENT_ID + MISSING_SERVER_ACTIONS_KEY ))
if [[ $TOTAL -eq 0 ]]; then
  EXIT_CODE=0
else
  EXIT_CODE=1
fi

# ---------- emit ----------
print_kpi_json() {
  cat <<JSON
audit-bp.kpi {
  "scope": "$SCOPE",
  "slice": "${SLICE_PATH:-}",
  "files_scanned": $FILES_SCANNED,
  "raw_anchor_count": $RAW_ANCHOR,
  "raw_img_count": $RAW_IMG,
  "unbounded_collect_count": $UNBOUNDED_COLLECT,
  "native_date_input_count": $NATIVE_DATE,
  "identity_email_bypass_count": $IDENTITY_BYPASS,
  "typed_catch_any_count": $TYPED_CATCH_ANY,
  "hardcoded_feature_id_count": $HARDCODED_FEATURE_ID,
  "ts_ignore_unreasoned_count": $TS_IGNORE_UNREASONED,
  "legacy_middleware_count": $LEGACY_MIDDLEWARE,
  "preloadquery_multi_count": $PRELOADQUERY_MULTI,
  "server_action_no_auth_count": $SERVER_ACTION_NO_AUTH,
  "convex_public_no_validator_count": $CONVEX_PUBLIC_NO_VALIDATOR,
  "selfhosted_sqlite_default_count": $SELFHOSTED_SQLITE_DEFAULT,
  "missing_deployment_id_count": $MISSING_DEPLOYMENT_ID,
  "missing_server_actions_key_count": $MISSING_SERVER_ACTIONS_KEY,
  "total": $TOTAL,
  "exit": $EXIT_CODE
}
JSON
}

print_human() {
  echo "audit-bp — KPI scan"
  echo "==================="
  echo "  scope:           $SCOPE${SLICE_PATH:+ ($SLICE_PATH)}"
  echo "  files scanned:   $FILES_SCANNED"
  echo ""
  printf "  %-32s %4d\n" "raw <a href=...>"            "$RAW_ANCHOR"
  printf "  %-32s %4d\n" "raw <img ...>"                "$RAW_IMG"
  printf "  %-32s %4d\n" "unbounded .collect()"         "$UNBOUNDED_COLLECT"
  printf "  %-32s %4d\n" "native <input type=\"date\">" "$NATIVE_DATE"
  printf "  %-32s %4d\n" "identity.email bypass"        "$IDENTITY_BYPASS"
  printf "  %-32s %4d\n" "catch (err: any)"             "$TYPED_CATCH_ANY"
  printf "  %-32s %4d\n" "hardcoded featureId === ..."  "$HARDCODED_FEATURE_ID"
  printf "  %-32s %4d\n" "@ts-ignore (no reason)"       "$TS_IGNORE_UNREASONED"
  printf "  %-32s %4d\n" "legacy middleware (no proxy)" "$LEGACY_MIDDLEWARE"
  printf "  %-32s %4d\n" "pages with 2+ preloadQuery"   "$PRELOADQUERY_MULTI"
  printf "  %-32s %4d\n" "server action w/o auth"       "$SERVER_ACTION_NO_AUTH"
  printf "  %-32s %4d\n" "convex public w/o validator"  "$CONVEX_PUBLIC_NO_VALIDATOR"
  printf "  %-32s %4d\n" "self-hosted SQLite default"   "$SELFHOSTED_SQLITE_DEFAULT"
  printf "  %-32s %4d\n" "missing deploymentId"         "$MISSING_DEPLOYMENT_ID"
  printf "  %-32s %4d\n" "missing SA encryption key"    "$MISSING_SERVER_ACTIONS_KEY"
  echo ""
  printf "  %-32s %4d\n" "TOTAL"                        "$TOTAL"
  echo ""
  if [[ $EXIT_CODE -eq 0 ]]; then
    echo "  verdict: CLEAN at mechanical level. Phase-3 deep read can focus on judgement calls."
  else
    echo "  verdict: FINDINGS. Use the counts above to seed the deep-review phase."
  fi
  echo ""
}

if [[ $JSON_ONLY -eq 1 ]]; then
  print_kpi_json
else
  print_human
  print_kpi_json
fi

exit $EXIT_CODE
