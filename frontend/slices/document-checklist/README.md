# Document Checklist

Track required job-search docs (CV, KTP, ijazah, etc.). Country-scoped template seeds populate the per-user checklist; user toggles completed state + notes + expiry per item.

## Props / surface

| Prop | Type | Required | Default | Notes |
|---|---|---|---|---|
| (route component) | — | — | — | Mounted at `/dashboard/checklist` via slice manifest |

## Convex tables

| Table | Purpose |
|---|---|
| `documentChecklists` | Per-user document state (completed flag, notes, expiry) |
| `documentTemplates` | Country-scoped master list (seed-managed, ISO-3166 alpha-2) |

## Permissions

| Permission | Action |
|---|---|
| `requireUser` | All mutations + queries require authenticated user (CareerPack pattern) |

Kitab port: convert `requireUser` → `requirePermission(ctx, workspaceId, "document-checklist.*")` + add workspace-scoped indexing.

## Dependencies

- npm: `convex`, `lucide-react`, `react`
- kitab slices: none (self-contained)
- shadcn primitives: `badge`, `button`, `card`, `label`, `progress`, `scroll-area`, `skeleton`, `tabs`, `textarea`, `date-picker`
- env vars: none

## Origin

Harvested from `CareerPack` on `2026-05-15`. Source path: `frontend/slices/document-checklist/`.
