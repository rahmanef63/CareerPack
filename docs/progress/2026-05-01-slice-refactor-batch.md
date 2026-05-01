# Slice Refactor Batch + Seed URL Cleanup — 2026-05-01

> **Goal:** drive every long file under the per-kind length cap, push inline types/constants/hooks up to slice-level folders, DRY shared roadmap shapes via type extension, persist the rules into `.claude/`, and swap dead Indonesian placeholder learning URLs for verified free resources.
>
> **Constraint:** pure refactor — zero behavior change, zero new deps, zero stack swaps. Only file boundaries move.
>
> **Gate:** `pnpm typecheck` + `pnpm lint --max-warnings=0` + `pnpm test` (72/72) + `pnpm build` — green on every commit.

---

## 1. Why

| Driver | Concrete benefit |
|---|---|
| File-length caps | Component >350 / Service >500 / Convex API >300 → load one screen of code instead of two |
| Slice hygiene | Per-feature inline `types.ts`/`constants.ts`/`useX.ts` scattered inside `components/<feature>/` subfolders → promote to slice-level `types/`, `constants/`, `hooks/` so each kind has one home |
| Cross-slice DRY | `TemplateNode` duplicated between `admin-panel` and `skill-roadmap` → hoist canonical to `@/shared/types/roadmap.ts`, derive form-draft variants via `Omit` |
| Iframe template safety | PB v2 template crashed with `Cannot set properties of null` because hydrator wrote to `#deckMount` that never existed in markup |
| Seed quality | Roadmap templates pointed at dicoding/skillacademy/petanikode/@ProgrammerZamanNow/@sekolahkoding URLs — many dead, all Indonesian-only. Swap for verified May-2026 free resources (freeCodeCamp, Coursera, Codecademy, RevoU, Stripe, Docker, GitHub Skills, edX, Cybrary, Palo Alto Networks) |
| Rules persistence | Refactor protocol lived only in chat memory → bake into `.claude/skills/slice-refactor/SKILL.md` so future sessions inherit it |

## 2. Hard rules (non-negotiable)

Captured in `.claude/skills/slice-refactor/SKILL.md`:

- File-length caps per kind. Refactor when over upper bound, not when over ideal.
- Pure refactor only. Don't add/remove behavior; don't smuggle in fixes.
- One home per kind: `types/`, `constants/`, `hooks/`, `lib/`, `utils/`. Inline `types.ts`/`useX.ts` inside `components/<feature>/` subfolders is **not** allowed — those subfolders hold rendering only.
- A slice must not import from another slice. Cross-slice → `@/shared/`.
- Convex *registers* by file path. `api.<domain>.<file>.<fn>` must be defined (not re-exported) at `<domain>/<file>.ts`. Heavy helpers extract to sibling `lib/`.
- Iframe srcdoc template: every `getElementById('mountId').innerHTML = …` must null-guard the lookup. Hydrator fragments share IIFE scope — reorder = break.
- TS regex literals reject raw U+2028 / U+2029. Use `/ /g`, `/ /g`.

## 3. What landed

### Commit `a51cc95` — split 22 long files into per-slice subfolders

22 files split. Component shells stayed at original entry-point names (no caller churn). Examples:

- `convex/admin/mutations.ts` 544 → 279 lines. Helpers extracted to `convex/admin/lib/{cascadeDelete,userOps,skillOps,templateOps}.ts`. Mutation wrappers stayed in the registered file (Convex API path constraint).
- `slices/personal-branding/components/PersonalBrandingView.tsx` split into `sections/` + `dialogs/` + orchestrator shell.
- `slices/library/components/LibraryView.tsx` + `slices/admin-panel/components/MicroInteractions.tsx` split by purpose.

### Commit `a1f6a9e` — promote inline types/constants/hooks/lib to slice folders

10 slices reorganized to canonical layout. Scattered inline files moved up to slice-level folders via `git mv` (history preserved). Relative path adjustments after each move (`../../../../../../convex` → `../../../../../convex` when shallowing one level).

### Commit `8a269bf` — hoist roadmap `TemplateNode` + `RESOURCE_TYPES` to shared

- New `frontend/src/shared/types/roadmap.ts` — canonical `TemplateNode`, `TemplateNodeResource`, `ROADMAP_RESOURCE_TYPES`.
- `slices/admin-panel/types/template.ts`: form-draft `TemplateNode = Omit<TemplateNodeStrict, "estimatedHours"> & { estimatedHours: number | "" }` — extends, doesn't restate.
- `slices/skill-roadmap/types/builder.ts`: re-exports `TemplateNode` from shared.

### Commit `b607214` — null-guard `#deckMount` + save refactor rules

- `frontend/public/personal-branding/templates/v2.html` lines 2142-2152: null-guard `casesMount` + `deckMount` writes. Root cause: hydrator wrote to `#deckMount` element that never existed in v2 markup.
- `.claude/skills/slice-refactor/SKILL.md` (~140 lines) — full protocol persisted.
- `CLAUDE.md` — link to skill.

### Commit `45fbc89` — replace placeholder ID learning URLs with verified free resources

- 41 roadmap template seed JSONs touched. 340 URLs replaced via `/tmp/replace_urls.py`:
  - `DIRECT_MAP` (35+ slugs → known replacements)
  - `KEYWORD_FALLBACK` (35+ keyword matches by resource title)
  - `PLACEHOLDER_HOSTS = [dicoding.com, skillacademy.id, petanikode.com, youtube.com/@ProgrammerZamanNow, youtube.com/@sekolahkoding]`
- `frontend/src/shared/data/demoUser.ts` — demo CV cert link → `freecodecamp.org/certification/...`
- Icon audit: every roadmap JSON `"icon"` value verified valid lucide-react PascalCase. No non-lucide icon library imports anywhere in frontend (180 files use `lucide-react`).

## 4. Side incident

- Stale `frontend/tsconfig.tsbuildinfo` made typecheck report 4 phantom errors (`@/shared/types`, `@/shared/lib/notify` "not found", implicit `any` cascade) on `skill-roadmap/`. Root cause: `baseUrl` was briefly corrupted to `https://careerpack.org/` during URL-replacement script run, then restored — but `.tsbuildinfo` cached the broken module graph. Clear with `rm -f frontend/tsconfig.tsbuildinfo`. Recorded so a future session recognizes the symptom.

## 5. Verification (every commit)

```bash
pnpm typecheck   # frontend + convex tsconfig
pnpm lint        # --max-warnings=0
pnpm test        # 72/72 vitest
NEXT_PUBLIC_CONVEX_URL=$(grep ^NEXT_PUBLIC_CONVEX_URL frontend/.env.local | cut -d= -f2) pnpm build
```

All green on `45fbc89`. CI runs `25204746965` (CI) + `25204746956` (Deploy Convex) queued on push.

## 6. Follow-ups (not done in this batch)

- [ ] Audit remaining slices for leftover inline `types.ts`/`useX.ts` inside `components/<feature>/` subfolders. Spot-check still found a few in `personal-branding/builder/` — those are *intentional* per the complex-slice variant (sub-feature folders own their own peers). Document the distinction more loudly in the skill.
- [ ] Promote a second cross-slice candidate (calendar agenda block? PB block schema?) once the second consumer appears — don't pre-promote.
- [ ] Replace the seed-URL Python script with a sustainable model: roadmap templates currently embed raw URLs at write time. Long-term, link rot is inevitable — consider a periodic CI job that hits each URL and flags 404s, or move resource catalog into a Convex table with admin UI for swaps.
- [ ] V2 template hydrator: same null-guard pattern probably applies to other mounts (`#projectsMount`, `#skillsMount`, etc.). Audit before next layout variant ships.

## 7. Where to find the rules

- `.claude/skills/slice-refactor/SKILL.md` — refactor protocol, file-length thresholds, canonical/complex slice layouts, DRY rules, Convex constraints, iframe caveats, refusal list.
- `.claude/skills/slice-new/SKILL.md` — companion: scaffolding a fresh slice with dual SSOT registration.
- `.claude/skills/ship/SKILL.md` — companion: gate + push to `origin/main`. Always finish a refactor through `/ship`.
- `CLAUDE.md` — links to all three.
