# Structure Audit — 2026-05-13

Auto-generated via `audit-structure` skill.

Run: `node ~/.agents/skills/audit-structure/scripts/audit-structure.mjs --slice-base frontend/slices --shared-base frontend/shared --verbose`

## Summary

| Metric | Value | Severity |
|---|---|---|
| Slices | 22 | — |
| Total source files | 496 | — |
| Total LOC | 58,595 | — |
| Files > 200 LOC | **79** | HIGH |
| Cross-slice imports | 0 ✅ | OK |
| Circular deps | **3** | CRITICAL |
| Dead exports | 3 | LOW |
| Base-extension gaps | 10 | MED |
| Layout gaps | 22 | LOW |
| Naming violations | 3 | MED |

## CRITICAL: 3 Circular Dependencies

All 3 cycles are **slice-local** (no cross-slice spillover). Quick local fix possible.

### Cycle 1 — personal-branding themes

```
slices/personal-branding/components/BrandingShowMoreDialog.tsx
  → slices/personal-branding/themes/index.tsx
  → slices/personal-branding/themes/types.ts
  → slices/personal-branding/components/BrandingShowMoreDialog.tsx  ↺
```

**Cause:** `themes/types.ts` references a type from `BrandingShowMoreDialog.tsx`, while the dialog imports themes via the barrel.

**Fix:** Either
- Move the dialog's shared type into a new `themes/dialog-types.ts` (decouples) OR
- Inline the type in `themes/types.ts` (single source) and remove the dialog dependency.

### Cycle 2 — personal-branding themes (variant)

```
slices/personal-branding/components/BrandingShowMoreDialog.tsx
  → slices/personal-branding/themes/index.tsx
  → slices/personal-branding/themes/TemplateLayout.tsx
  → slices/personal-branding/components/BrandingShowMoreDialog.tsx  ↺
```

**Cause:** `TemplateLayout` imports `BrandingShowMoreDialog`; dialog imports themes barrel which re-exports TemplateLayout.

**Fix:** TemplateLayout should not import the dialog. Lift the dialog-controlled behavior into a callback prop the layout receives.

### Cycle 3 — skill-roadmap

```
slices/skill-roadmap/components/RoadmapBrowser.tsx
  → slices/skill-roadmap/components/RoadmapTable.tsx
  → slices/skill-roadmap/components/RoadmapBrowser.tsx  ↺
```

**Cause:** Browser and Table mutually import each other.

**Fix:** Extract shared types/state into `slices/skill-roadmap/lib/roadmap-state.ts`; both components import from there, not each other.

## HIGH: 79 Oversized Files (>200 LOC)

Listing top 10 via `--verbose`. Run:

```bash
node ~/.agents/skills/audit-structure/scripts/audit-structure.mjs \
  --slice-base frontend/slices --shared-base frontend/shared \
  --json | jq '.size[0:10] | .[] | "\(.loc) LOC  \(.file)"'
```

## Action Plan

| # | Patch | Effort | Risk |
|---|---|---|---|
| 1 | Fix personal-branding cycle (extract dialog type / lift callback) | 30 min | LOW |
| 2 | Fix skill-roadmap Browser ↔ Table cycle (shared state file) | 30 min | LOW |
| 3 | Auto-fix layout scaffolds via audit-structure --fix | 5 min | LOW |
| 4 | Split top-10 oversized files | 2 hr | LOW |
| 5 | Address residual 70 oversized files (multi-session) | weeks | MED |

## CareerPack-specific blockers (Operator Backlog)

- `src/slices` rename to `slices` (254 tsc errors from deep `../convex` imports)
- Tailwind 3.4 → 4 codemod (chart primitive coupling)

These are pre-existing operator-backlog items, not new audit findings.

## Re-audit

```bash
node ~/.agents/skills/audit-structure/scripts/audit-structure.mjs \
  --slice-base frontend/slices --shared-base frontend/shared --quick
```
