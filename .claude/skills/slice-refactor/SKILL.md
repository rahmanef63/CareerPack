---
name: slice-refactor
description: Rules + protocol for refactoring long files and reorganising slice contents in CareerPack. Use when user says "/slice-refactor", "refactor long files", "audit slice structure", or asks to split / reorganise an oversized component / hook / module.
---

# /slice-refactor — CareerPack slice + file refactor protocol

CareerPack uses the slice pattern documented in `CLAUDE.md`. This skill captures the file-length thresholds, the canonical folder layout, the recognised "complex slice" variant, and the verification gate that a refactor must clear before it ships.

## Length thresholds (the trigger)

A file is a refactor candidate when it crosses the upper bound for its kind. Targets are the *ideal* range, not a hard floor.

| Kind | Ideal | Refactor when over |
|---|---|---|
| Component (UI, `.tsx`) | 100–250 | > 350 |
| Service / module | 150–350 | > 500 |
| API / Convex public function file | 80–200 | > 300 |
| Utility / helper | 50–200 | > 300 |
| Test | 200–500 | > 700 |
| Config | flexible | n/a |

**Pure refactor only.** Don't add, remove, or change behaviour. The user's progress is preserved verbatim — only file boundaries move.

## Canonical slice layout (flat — most slices)

```
frontend/src/slices/<slug>/
  components/         <- React components (.tsx) only
  hooks/              <- useX.ts(x) — slice-wide hooks
  types/              <- types/index.ts barrel + domain files (e.g. status.ts)
  constants/          <- constants/index.ts barrel + domain files
  lib/                <- pure helpers, transforms, validators
  utils/              <- string / date / formatting micro-helpers
  config.ts           <- slice-level config object (rare)
  index.ts            <- public barrel: `export { Component } from "./components/Component"`
```

Each kind has ONE home. Inline `types.ts` / `constants.ts` / `useX.ts` files inside `components/<feature>/` subfolders are **not** allowed — those subfolders hold rendering only.

Skip a folder when the slice doesn't use it. Don't create empty `types/` or `hooks/` just to look complete (per CLAUDE.md, empty `export {}` placeholders are *intentional* contract scaffolding — never delete those, but never create new empty ones either).

## Complex-slice variant (sub-feature folders)

Some slices have multiple distinct internal domains. Then it's clearer to organise by **domain** rather than **kind**. `personal-branding/` is the canonical example:

```
slices/personal-branding/
  blocks/      <- block schema + sanitiser types (re-exports from convex/profile/blocks)
  builder/     <- interactive block editor (BlockFields, presets, defaults)
  form/        <- usePBForm + form/state types + slug validation
  sections/    <- individual setting cards
  themes/      <- template renderer + iframe hydrator + types
  components/  <- top-level orchestrators (PersonalBrandingView, dialogs, mobile bar)
  index.ts
```

When this variant applies:
- Each sub-feature folder owns its own `types.ts`, hook files, and lib helpers as peers (flat inside the sub-feature).
- Cross-sub-feature imports go through the public surface of the consumed sub-feature (e.g. `themes/` imports `blocks/types.ts` directly).
- No top-level `types/` / `hooks/` / `lib/` at slice root — would duplicate or scatter the sub-feature's contents.

**Use the variant only when the slice has 4+ genuinely distinct internal domains.** Most slices don't qualify; default to the flat layout.

## Refactor protocol (the steps)

For each oversized file:

1. **Identify the seams.** Group the file's contents by purpose:
   - Pure data → `types.ts`
   - Constant maps / lists → `constants.ts`
   - Stateful logic → `useX.ts` hook
   - Pure transforms / validators → `lib.ts`
   - Sub-components → `<Name>.tsx`
2. **Pick the home for each group:**
   - Crossed by other slice files → slice-level (`<slice>/types/`, `<slice>/hooks/`, …).
   - Truly component-internal (e.g. recursion-typed prop) → keep alongside the component.
   - Used by another slice → promote to `@/shared/types/`, `@/shared/hooks/`, `@/shared/lib/`.
3. **Use `git mv` to preserve history** when moving committed files. For brand-new splits use `Write`.
4. **Adjust relative paths.** Moving a file 1 level shallower means dropping one `..` from convex `_generated` imports (e.g. `../../../../../../convex` → `../../../../../convex`).
5. **Keep the original file as a thin shell** — orchestrator / barrel / dispatcher. The original entry-point name stays so external callers don't change.
6. **No barrel chaos.** Re-exports from sibling files are fine; cyclic re-exports are not. If you find yourself writing `index.ts` just to dodge a path, move the file instead.

## DRY rules (cross-slice + extension)

- **Cross-slice = `@/shared/`.** A type / hook / helper used by two or more slices is promoted, not duplicated. CLAUDE.md hard rule: "A slice must not import from another slice."
- **Intra-slice = barrel re-export.** Slice-internal files import each other directly with relative paths.
- **Extend, don't restate.** When a draft / form variant differs from a canonical type only in input-permissive fields, derive it: `type FormDraft = Omit<Canonical, "n"> & { n: number | "" }`. Copy-pasting the whole interface is a smell.
- **Check before introducing a new `interface`.** `git grep -n "interface <Name>"` first. If two slices already have it, move the base to `@/shared/types/<domain>.ts` and have both extend.
- **Don't DRY across legitimately different concerns.** A draft (with `""` placeholders) and a domain entity (strict numbers) are different concerns; an Omit-derived form variant is fine, a forced shared shape isn't.

## Convex constraints

- Convex *registers* functions by file path. `api.<domain>.<file>.<fn>` requires the function to be *defined* in `<domain>/<file>.ts` — re-exporting from another module **does not register the function**.
- For long Convex API files (e.g. `convex/admin/mutations.ts`): keep the `mutation({ … })` definitions in the registered file. Extract heavy *helper* logic into sibling `lib/` files and have the handlers call into them. The mutation wrapper stays slim; the helpers shrink the file.
- Cross-domain shared validators / sanitisers go under `convex/_shared/`, not in the consuming domain.

## Verification gate (after every refactor batch)

Run sequentially. Stop on first failure. This is non-negotiable — refactor without verification is just hope.

```bash
# 1. Boundary check — every moved file resolves.
pnpm typecheck

# 2. Style check — no warnings, ESLint --max-warnings=0.
pnpm lint

# 3. Behaviour check — every test still passes.
pnpm test

# 4. Production build — catches issues typecheck/lint miss
#    (next/dynamic resolution, Server/Client boundary, bundle issues).
NEXT_PUBLIC_CONVEX_URL=$(grep ^NEXT_PUBLIC_CONVEX_URL frontend/.env.local | cut -d= -f2) \
  pnpm build
```

If you split a UI component, also smoke-test it in the browser before declaring done. Type-check verifies code correctness, not feature correctness.

## Iframe / templated-HTML caveat (PB-specific)

The personal-branding `themes/` pipeline injects a hydrator script into static HTML templates served from `frontend/public/personal-branding/templates/v*.html`. When refactoring anything that touches the iframe srcdoc:

- **The templates have their own inline scripts.** Their JS reaches for elements by ID (`$('#casesMount').innerHTML = …`). Any `.innerHTML = …` setter on a `getElementById` / `querySelector` result without a null guard is a latent crash — the element may not exist in every layout variant.
- **Always null-guard mount-point access** in `frontend/public/personal-branding/templates/*.html`: `var mount = $('#mountId'); if (mount) mount.innerHTML = …;` — cheaper than a debug session via `about:srcdoc:<line>` errors.
- **Hydrator fragments share IIFE scope.** `templateHydrator/preamble.ts → style.ts → manualBlocks.ts → fillHelpers.ts → identityFills.ts → pageExtras.ts → truncate.ts` all concatenate into one `(function(){…})();`. Variables declared in one fragment (e.g. `var d`, `var has`, `function fill`) are visible to all later fragments — order matters; reordering imports in `templateHydrator.ts` will break.
- **TypeScript regex literals reject raw U+2028 / U+2029.** When sanitising JSON for inline injection (see `themes/inject.ts`), use unicode-escape regex form (`/\u2028/g` and `/\u2029/g`) — pasting the literal characters from a file edit will fail to parse.

## Refusals

- Don't refactor without running the gate. Ever.
- Don't add behaviour while refactoring. Note the idea, ship the pure refactor, address it in a follow-up.
- Don't promote to `@/shared/` for a single consumer — that's premature abstraction. Wait for the second consumer.
- Don't break Convex API paths. The user-visible `api.<domain>.<file>.<fn>` is a public contract; extracting helpers must not move where the registered function is *defined*.
- Don't use `--no-verify` or skip CI to "land the refactor faster." That defeats the gate.

## Companion skills

- **`/ship`** — runs the verification gate and pushes when green. Always finish a refactor through `/ship`, never raw `git push`.
- **`/slice-new`** — scaffold a fresh slice with the canonical layout. Use it before refactoring INTO a new slice rather than hand-creating folders.
- **`/audit-bp`** — broader best-practice review. Use when you suspect the long file is a symptom of architectural drift, not just length.
