#!/usr/bin/env bash
# audit-features — per-feature UI/UX consistency audit for feature-sliced projects.
#
# Sibling to audit-bp.sh. Where audit-bp scores cross-cutting framework drift,
# this script scores EACH feature slice against the canonical layout rules,
# emitting a per-feature card + total.
#
# Usage:
#   audit-features.sh                       # human + JSON
#   audit-features.sh --json                # JSON only (CI)
#   audit-features.sh --md > report.md      # markdown report
#   audit-features.sh --slice <slug>        # one feature only
#
# Exit codes:
#   0 — every feature scores ≥80 (B or better)
#   1 — at least one feature scores <80
#   2 — script error
#
# Validation rules (P0=10pts, P1=5pts, P2=2pts):
#   P0: config.ts exists + defineFeature
#   P0: init.ts exists
#   P0: page.tsx exists
#   P0: hasConvex+true → schema+queries+mutations exist
#   P0: status.state honest (no `stable` if hasConvex but no schema)
#   P1: agent/index.ts (singular)
#   P1: settings/index.ts
#   P1: features-preview/index.tsx
#   P1: views/ directory
#   P1: <FeatureShell> in views (canonical layout)
#   P1: ResponsiveDialog used (no raw <Dialog> from shadcn)
#   P1: DateField/SharedDatePicker (no native <input type="date">)
#   P1: permissions array populated if hasConvex+true
#   P2: no raw <input type="file">
#   P2: no raw <a href="/..."> for internal routes
#   P2: no raw <img>
#
# Score: 100 - sum(deductions). Grade: A≥90 B≥80 C≥70 D≥60 F<60.

set -uo pipefail

# ---------- arg parsing ----------
MODE="human"
SLICE_FILTER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json) MODE="json"; shift ;;
    --md) MODE="md"; shift ;;
    --slice)
      SLICE_FILTER="${2:-}"
      [[ -z "$SLICE_FILTER" ]] && { echo "audit-features: --slice requires a slug" >&2; exit 2; }
      shift 2
      ;;
    -h|--help)
      sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "audit-features: unknown arg: $1" >&2; exit 2 ;;
  esac
done

# ---------- repo sanity ----------
if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "audit-features: not inside a git repository" >&2
  exit 2
fi
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SLICES_DIR="frontend/slices"
if [[ ! -d "$SLICES_DIR" ]]; then
  echo "audit-features: $SLICES_DIR not found — not a feature-sliced project" >&2
  exit 2
fi

# ---------- helpers ----------
# grep_count FILE PATTERN — count matching lines, defaulting 0 on miss / no file.
grep_count() {
  local file="$1" pattern="$2"
  [[ ! -f "$file" ]] && { echo 0; return; }
  local n
  n=$({ grep -cE "$pattern" "$file" 2>/dev/null; true; } | head -1)
  echo "${n:-0}"
}

# grep_count_dir DIR PATTERN — recursive count over .ts/.tsx in DIR.
grep_count_dir() {
  local dir="$1" pattern="$2"
  [[ ! -d "$dir" ]] && { echo 0; return; }
  local n
  n=$(find "$dir" -type f \( -name '*.ts' -o -name '*.tsx' \) -not -name '*.test.*' \
        -exec grep -lE "$pattern" {} + 2>/dev/null | wc -l)
  echo "${n:-0}"
}

# grep_count_dir_lines — count matching LINES (not files).
grep_count_dir_lines() {
  local dir="$1" pattern="$2"
  [[ ! -d "$dir" ]] && { echo 0; return; }
  local n
  n=$(find "$dir" -type f \( -name '*.ts' -o -name '*.tsx' \) -not -name '*.test.*' \
        -exec grep -hE "$pattern" {} + 2>/dev/null | wc -l)
  echo "${n:-0}"
}

# parse_config_field SLUG_DIR FIELD — pull a top-level field value from config.ts.
# Returns empty if not found. Pragmatic regex; fine for the the standard `defineFeature` shape.
parse_config_field() {
  local cfg="$1/config.ts" field="$2"
  [[ ! -f "$cfg" ]] && return
  grep -E "^\s*${field}:\s*" "$cfg" | head -1 | sed -E "s/^\s*${field}:\s*['\"]?([^,'\"]+)['\"]?,?\s*$/\1/"
}

# convex_paths_ok SLUG — echoes 1 if convex backend exists, 0 if missing.
convex_paths_ok() {
  local slug="$1"
  # Convex naming: kebab-case slice → camelCase feature folder.
  # Try both kebab + camel forms.
  local camel
  camel=$(echo "$slug" | awk -F- '{out=$1; for(i=2;i<=NF;i++) out=out toupper(substr($i,1,1)) substr($i,2); print out}')
  for variant in "$slug" "$camel"; do
    local base="convex/features/$variant"
    if [[ -d "$base" ]]; then
      # Schema can be at base/schema.ts or base/api/schema.ts; same for queries/mutations.
      local has_schema=0 has_queries=0 has_mutations=0
      [[ -f "$base/schema.ts" || -f "$base/api/schema.ts" ]] && has_schema=1
      [[ -f "$base/queries.ts" || -f "$base/api/queries.ts" ]] && has_queries=1
      [[ -f "$base/mutations.ts" || -f "$base/api/mutations.ts" ]] && has_mutations=1
      if (( has_schema && has_queries && has_mutations )); then
        echo 1; return
      fi
    fi
  done
  echo 0
}

# config_status SLUG_DIR — echoes status.state field value
config_status() {
  local cfg="$1/config.ts"
  [[ ! -f "$cfg" ]] && return
  awk '/status:\s*\{/,/\}/' "$cfg" | grep -E "state:" | head -1 \
    | sed -E "s/^.*state:\s*['\"]([^'\"]+)['\"].*$/\1/"
}

# config_has_convex SLUG_DIR — echoes "true" or "false"
config_has_convex() {
  local cfg="$1/config.ts"
  [[ ! -f "$cfg" ]] && { echo "false"; return; }
  if grep -Eq "hasConvex:\s*true" "$cfg" 2>/dev/null; then
    echo "true"
  else
    echo "false"
  fi
}

# config_permissions_populated SLUG_DIR — 1 if non-empty permissions array
config_permissions_populated() {
  local cfg="$1/config.ts"
  [[ ! -f "$cfg" ]] && { echo 0; return; }
  # Match `permissions: [` then look for any non-whitespace content before `]`.
  if awk '/permissions:\s*\[/,/\]/' "$cfg" 2>/dev/null | grep -Eq "['\"]" ; then
    echo 1
  else
    echo 0
  fi
}

# ---------- per-feature scorer ----------
# Outputs a single line of TSV: slug<tab>score<tab>grade<tab>p0_count<tab>p1_count<tab>p2_count<tab>findings
score_feature() {
  local slug_dir="$1"
  local slug
  slug=$(basename "$slug_dir")

  local score=100
  local p0=0 p1=0 p2=0
  local -a findings=()

  # P0: config.ts + defineFeature
  if [[ ! -f "$slug_dir/config.ts" ]]; then
    score=$((score - 10)); p0=$((p0 + 1))
    findings+=("P0: config.ts missing")
  elif ! grep -q "defineFeature" "$slug_dir/config.ts" 2>/dev/null; then
    score=$((score - 10)); p0=$((p0 + 1))
    findings+=("P0: config.ts has no defineFeature() call")
  fi

  # P0: init.ts
  if [[ ! -f "$slug_dir/init.ts" ]]; then
    score=$((score - 10)); p0=$((p0 + 1))
    findings+=("P0: init.ts missing")
  fi

  # P0: page.tsx
  if [[ ! -f "$slug_dir/page.tsx" ]]; then
    score=$((score - 10)); p0=$((p0 + 1))
    findings+=("P0: page.tsx missing")
  fi

  # P0: hasConvex backend exists
  local has_convex
  has_convex=$(config_has_convex "$slug_dir")
  if [[ "$has_convex" == "true" ]]; then
    if [[ "$(convex_paths_ok "$slug")" != "1" ]]; then
      score=$((score - 10)); p0=$((p0 + 1))
      findings+=("P0: hasConvex:true but missing schema/queries/mutations under convex/features/")
    fi
  fi

  # P0: status honesty — `stable` claim with no Convex backend when hasConvex:true
  local status_state
  status_state=$(config_status "$slug_dir")
  if [[ "$status_state" == "stable" && "$has_convex" == "true" ]]; then
    if [[ "$(convex_paths_ok "$slug")" != "1" ]]; then
      score=$((score - 10)); p0=$((p0 + 1))
      findings+=("P0: status.state=stable but Convex backend missing")
    fi
  fi

  # P1: agent/ singular
  if [[ ! -f "$slug_dir/agent/index.ts" && ! -f "$slug_dir/agent/index.tsx" ]]; then
    score=$((score - 5)); p1=$((p1 + 1))
    findings+=("P1: agent/index.ts missing (canonical: singular)")
  fi
  if [[ -d "$slug_dir/agents" ]]; then
    score=$((score - 5)); p1=$((p1 + 1))
    findings+=("P1: agents/ (plural) directory present — must migrate to agent/")
  fi

  # P1: settings/index.ts
  if [[ ! -f "$slug_dir/settings/index.ts" && ! -f "$slug_dir/settings/index.tsx" ]]; then
    score=$((score - 5)); p1=$((p1 + 1))
    findings+=("P1: settings/index.ts missing")
  fi

  # P1: features-preview/index.tsx
  if [[ ! -f "$slug_dir/features-preview/index.tsx" && ! -f "$slug_dir/features-preview/index.ts" ]]; then
    score=$((score - 5)); p1=$((p1 + 1))
    findings+=("P1: features-preview/index.tsx missing")
  fi

  # P1: views/ directory
  if [[ ! -d "$slug_dir/views" ]]; then
    score=$((score - 5)); p1=$((p1 + 1))
    findings+=("P1: views/ directory missing")
  else
    # P1: FeatureShell used somewhere in views/
    local fs_hits
    fs_hits=$(grep_count_dir "$slug_dir/views" "FeatureShell")
    if (( fs_hits == 0 )); then
      score=$((score - 5)); p1=$((p1 + 1))
      findings+=("P1: views/ exists but no FeatureShell usage (canonical layout)")
    fi
  fi

  # P1: no raw shadcn <Dialog> (must use ResponsiveDialog)
  local raw_dialog
  raw_dialog=$(grep_count_dir_lines "$slug_dir" 'from\s+["'\'']@/components/ui/dialog["'\'']')
  if (( raw_dialog > 0 )); then
    score=$((score - 5)); p1=$((p1 + 1))
    findings+=("P1: raw shadcn <Dialog> import found ($raw_dialog) — use ResponsiveDialog")
  fi

  # P1: no native <input type="date">
  local native_date
  native_date=$(grep_count_dir_lines "$slug_dir" 'type="date"')
  if (( native_date > 0 )); then
    score=$((score - 5)); p1=$((p1 + 1))
    findings+=("P1: native <input type=\"date\"> ($native_date) — use DateField/SharedDatePicker")
  fi

  # P1: permissions populated if hasConvex
  if [[ "$has_convex" == "true" ]]; then
    if [[ "$(config_permissions_populated "$slug_dir")" != "1" ]]; then
      score=$((score - 5)); p1=$((p1 + 1))
      findings+=("P1: hasConvex:true but permissions array empty in config.ts")
    fi
  fi

  # P2: no raw <input type="file">
  local raw_file_input
  raw_file_input=$(grep_count_dir_lines "$slug_dir" 'type="file"')
  if (( raw_file_input > 0 )); then
    score=$((score - 2)); p2=$((p2 + 1))
    findings+=("P2: native <input type=\"file\"> ($raw_file_input) — use <FileUpload>")
  fi

  # P2: raw <a href="/..."> for internal routes (not target=_blank, not protocol)
  local raw_internal_anchor=0
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    local total proto blank
    total=$({ grep -cE '<a[[:space:]]+href=' "$f" 2>/dev/null; true; } | head -1)
    proto=$({ grep -cE '<a[[:space:]]+href=(["'\'']|\{`)(mailto|tel|sms|ftp):' "$f" 2>/dev/null; true; } | head -1)
    blank=$({ grep -cE '<a[[:space:]][^>]*target=["'\'']_blank' "$f" 2>/dev/null; true; } | head -1)
    total=${total:-0}; proto=${proto:-0}; blank=${blank:-0}
    local h=$(( total - proto - blank ))
    (( h < 0 )) && h=0
    raw_internal_anchor=$(( raw_internal_anchor + h ))
  done < <(find "$slug_dir" -type f \( -name '*.tsx' -o -name '*.ts' \) -not -name '*.test.*' 2>/dev/null)
  if (( raw_internal_anchor > 0 )); then
    score=$((score - 2)); p2=$((p2 + 1))
    findings+=("P2: raw <a href=\"/...\"> ($raw_internal_anchor) — use next/link or SmartLink")
  fi

  # P2: raw <img>
  local raw_img
  raw_img=$(grep_count_dir_lines "$slug_dir" '<img[[:space:]]')
  if (( raw_img > 0 )); then
    score=$((score - 2)); p2=$((p2 + 1))
    findings+=("P2: raw <img> ($raw_img) — use next/image")
  fi

  # Clamp + grade
  (( score < 0 )) && score=0
  local grade
  if   (( score >= 90 )); then grade="A"
  elif (( score >= 80 )); then grade="B"
  elif (( score >= 70 )); then grade="C"
  elif (( score >= 60 )); then grade="D"
  else                          grade="F"
  fi

  # Encode findings into pipe-delimited single field for portability.
  local findings_str=""
  if (( ${#findings[@]} > 0 )); then
    findings_str=$(printf '%s|' "${findings[@]}")
    findings_str=${findings_str%|}
  fi

  printf "%s\t%d\t%s\t%d\t%d\t%d\t%s\n" \
    "$slug" "$score" "$grade" "$p0" "$p1" "$p2" "$findings_str"
}

# ---------- iterate ----------
TSV_FILE=$(mktemp)
trap "rm -f $TSV_FILE" EXIT

for slug_dir in "$SLICES_DIR"/*/; do
  [[ -d "$slug_dir" ]] || continue
  slug=$(basename "$slug_dir")
  # Skip directories starting with `_` (templates, scaffolding, non-features)
  case "$slug" in _*) continue ;; esac
  [[ -n "$SLICE_FILTER" && "$slug" != "$SLICE_FILTER" ]] && continue
  score_feature "$slug_dir" >> "$TSV_FILE"
done

# ---------- aggregate + emit ----------
TOTAL_FEATURES=$(wc -l < "$TSV_FILE")
COUNT_A=$(awk -F'\t' '$3=="A"' "$TSV_FILE" | wc -l)
COUNT_B=$(awk -F'\t' '$3=="B"' "$TSV_FILE" | wc -l)
COUNT_C=$(awk -F'\t' '$3=="C"' "$TSV_FILE" | wc -l)
COUNT_D=$(awk -F'\t' '$3=="D"' "$TSV_FILE" | wc -l)
COUNT_F=$(awk -F'\t' '$3=="F"' "$TSV_FILE" | wc -l)
AVG_SCORE=$(awk -F'\t' '{s+=$2; n++} END {if (n>0) printf "%.1f", s/n; else print "0"}' "$TSV_FILE")
TOTAL_P0=$(awk -F'\t' '{s+=$4} END {print s+0}' "$TSV_FILE")
TOTAL_P1=$(awk -F'\t' '{s+=$5} END {print s+0}' "$TSV_FILE")
TOTAL_P2=$(awk -F'\t' '{s+=$6} END {print s+0}' "$TSV_FILE")

# Exit code: 0 if every feature scored ≥80
EXIT_CODE=0
if (( $(awk -F'\t' 'BEGIN{n=0} $2<80{n++} END{print n+0}' "$TSV_FILE") > 0 )); then
  EXIT_CODE=1
fi

print_human() {
  echo "audit-features — per-feature consistency scan"
  echo "============================================="
  echo "  features scanned: $TOTAL_FEATURES"
  echo "  average score:    $AVG_SCORE"
  echo "  grade dist:       A:$COUNT_A  B:$COUNT_B  C:$COUNT_C  D:$COUNT_D  F:$COUNT_F"
  echo "  total findings:   P0:$TOTAL_P0  P1:$TOTAL_P1  P2:$TOTAL_P2"
  echo ""
  printf "  %-32s %6s  %5s  %3s %3s %3s\n" "FEATURE" "SCORE" "GRADE" "P0" "P1" "P2"
  printf "  %-32s %6s  %5s  %3s %3s %3s\n" "-------" "-----" "-----" "--" "--" "--"
  sort -t$'\t' -k2,2nr "$TSV_FILE" | while IFS=$'\t' read -r slug score grade p0 p1 p2 findings; do
    printf "  %-32s %6d  %5s  %3d %3d %3d\n" "$slug" "$score" "$grade" "$p0" "$p1" "$p2"
  done
  echo ""
  if (( EXIT_CODE == 0 )); then
    echo "  verdict: ALL FEATURES ≥80 (B or better). Layout consistency holding."
  else
    echo "  verdict: $(awk -F'\t' '$2<80' "$TSV_FILE" | wc -l) feature(s) below B. Run --md for full breakdown."
  fi
  echo ""
}

print_json() {
  echo "{"
  echo "  \"summary\": {"
  echo "    \"total_features\": $TOTAL_FEATURES,"
  echo "    \"average_score\": $AVG_SCORE,"
  echo "    \"grade_distribution\": { \"A\": $COUNT_A, \"B\": $COUNT_B, \"C\": $COUNT_C, \"D\": $COUNT_D, \"F\": $COUNT_F },"
  echo "    \"total_findings\": { \"P0\": $TOTAL_P0, \"P1\": $TOTAL_P1, \"P2\": $TOTAL_P2 },"
  echo "    \"exit\": $EXIT_CODE"
  echo "  },"
  echo "  \"features\": ["
  local first=1
  while IFS=$'\t' read -r slug score grade p0 p1 p2 findings; do
    [[ $first -eq 0 ]] && echo ","
    first=0
    # JSON-escape findings (replace | with array separator + escape ")
    local findings_json="[]"
    if [[ -n "$findings" ]]; then
      findings_json="["
      local first_f=1
      while IFS= read -r line; do
        [[ -z "$line" ]] && continue
        local esc
        esc=$(printf '%s' "$line" | sed 's/\\/\\\\/g; s/"/\\"/g')
        [[ $first_f -eq 0 ]] && findings_json+=","
        first_f=0
        findings_json+="\"$esc\""
      done < <(echo "$findings" | tr '|' '\n')
      findings_json+="]"
    fi
    printf '    { "slug": "%s", "score": %d, "grade": "%s", "p0": %d, "p1": %d, "p2": %d, "findings": %s }' \
      "$slug" "$score" "$grade" "$p0" "$p1" "$p2" "$findings_json"
  done < <(sort -t$'\t' -k2,2nr "$TSV_FILE")
  echo ""
  echo "  ]"
  echo "}"
}

print_md() {
  local today
  today=$(date +%Y-%m-%d)
  echo "# Per-Feature Layout Audit — $today"
  echo ""
  echo "Generated by \`audit-features.sh\`. Validation rules + scoring documented in \`~/.agents/skills/audit-bp/scripts/audit-features.sh\` header."
  echo ""
  echo "## Summary"
  echo ""
  echo "| Metric | Value |"
  echo "|---|---|"
  echo "| Features scanned | $TOTAL_FEATURES |"
  echo "| Average score | **$AVG_SCORE** |"
  echo "| Grade A (≥90) | $COUNT_A |"
  echo "| Grade B (≥80) | $COUNT_B |"
  echo "| Grade C (≥70) | $COUNT_C |"
  echo "| Grade D (≥60) | $COUNT_D |"
  echo "| Grade F (<60) | $COUNT_F |"
  echo "| Total P0 findings | $TOTAL_P0 |"
  echo "| Total P1 findings | $TOTAL_P1 |"
  echo "| Total P2 findings | $TOTAL_P2 |"
  echo ""
  echo "## Per-feature scores"
  echo ""
  echo "| Feature | Score | Grade | P0 | P1 | P2 |"
  echo "|---|---:|:---:|---:|---:|---:|"
  sort -t$'\t' -k2,2nr "$TSV_FILE" | while IFS=$'\t' read -r slug score grade p0 p1 p2 findings; do
    echo "| \`$slug\` | $score | $grade | $p0 | $p1 | $p2 |"
  done
  echo ""
  echo "## Findings detail"
  echo ""
  while IFS=$'\t' read -r slug score grade p0 p1 p2 findings; do
    [[ -z "$findings" ]] && continue
    echo "### \`$slug\` (score $score, grade $grade)"
    echo ""
    while IFS= read -r line; do
      [[ -z "$line" ]] && continue
      echo "- $line"
    done < <(echo "$findings" | tr '|' '\n')
    echo ""
  done < <(sort -t$'\t' -k2,2n "$TSV_FILE")  # ascending so worst features first
}

case "$MODE" in
  human) print_human; print_json ;;
  json)  print_json ;;
  md)    print_md ;;
esac

exit $EXIT_CODE
