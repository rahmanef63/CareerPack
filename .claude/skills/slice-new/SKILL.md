---
name: slice-new
description: Scaffold a new feature slice in CareerPack and wire it into the two SSOT registries. Use when user says "/slice-new", "new slice", "buat fitur baru", or asks to add a new dashboard page.
---

# /slice-new — scaffold a CareerPack slice

CareerPack is slice-based. A slice is self-contained under `frontend/src/slices/<kebab-name>/` and plugs into the dashboard via two SSOT files. Missing either edit = broken route or dead nav item.

## Inputs required

Ask the user for:
1. **slug** (kebab-case, e.g. `networking`, `portfolio`). Must not collide with existing keys in `DASHBOARD_VIEWS`.
2. **label** (Indonesian, user-facing, e.g. "Networking & Kontak").
3. **icon** (lucide-react name, e.g. `Users`, `Briefcase`). Check existing `navConfig.ts` for style.
4. **nav bucket** — `PRIMARY_NAV` (rare, only for top 3-5 actions) or `MORE_APPS` (default).
5. **component name** (PascalCase, e.g. `Networking`). Must match the barrel export.

Do not proceed without all five.

## Steps

1. **Create slice folder:** `frontend/src/slices/<slug>/`
   - `index.ts` — `export { <Component> } from "./components/<Component>"`
   - `components/<Component>.tsx` — minimal `"use client"` component rendering a placeholder Card with heading + "Coming soon" message. Use shadcn `Card` + `CardHeader` + `CardTitle` + `CardContent`. Header text matches the label.

2. **Register view** in `frontend/src/shared/lib/dashboardRoutes.tsx`:
   - Add a `const <SLUG_UPPER>: View = dynamic(() => import("@/slices/<slug>").then(m => m.<Component>), { loading: loadingFallback });`
   - Add `<slug>: <SLUG_UPPER>,` to `DASHBOARD_VIEWS`.

3. **Register nav item** in `frontend/src/shared/components/layout/navConfig.ts`:
   - Append to the chosen bucket array. Match existing object shape exactly — `{ key, label, href: "/dashboard/<slug>", icon }`.
   - Import the lucide icon at the top if not already imported.

4. **Feature doc:** create `docs/features/<slug>.md` with sections: Overview, Data model (if any), UI, AI integration (if any). One short paragraph each.

5. **Gate:**
   - `pnpm typecheck` — must pass.
   - `pnpm lint` — must pass.
   - Visit `/dashboard/<slug>` mentally: slug matches `href` matches `DASHBOARD_VIEWS` key. If any drift, fix before finishing.

## Rules

- Do **not** add imports from other slices. If you need cross-slice code, promote it to `@/shared/hooks/`, `@/shared/types/`, or `@/shared/lib/` first.
- Do **not** create empty `hooks/`, `lib/`, `types/` folders unless the slice actually uses them — the skeleton is intentional, not cargo-cult.
- Do **not** commit. Leave that to the user or `/ship`.

## Refusals

- Slug collides with an existing `DASHBOARD_VIEWS` key → stop, ask the user for a different slug.
- Requested slug is `ai-settings`, `admin`, or any existing slice → stop, explain it already exists.
