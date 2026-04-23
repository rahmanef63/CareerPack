# CareerPack — Development Rules

Non-negotiable conventions enforced via review + CI. Agents and human
contributors both follow these. Exceptions require explicit note in the
PR body referring to the rule by ID.

## R1. Slices own their feature, share via `@/shared/*`

- Slice = one feature folder under `frontend/src/slices/<kebab-name>/`.
- A slice **must not** import from another slice. Cross-slice code goes
  to `@/shared/hooks/`, `@/shared/components/`, `@/shared/lib/`, or
  `@/shared/types/`.
- Slice barrel exports through `index.ts`. Promote a hook/type to
  `@/shared/` before a second slice consumes it.
- Empty folders with `export {}` are intentional feature-contract
  scaffolding; don't delete them.

## R2. Theme tokens are the only color source

- **No hex** in `.tsx` / `.ts` files outside two explicitly allowed
  locations: `frontend/src/slices/financial-calculator/constants/
  budgetIcons.ts` (user-selectable envelope swatches) and
  `frontend/src/shared/components/ui/chart.tsx` (shadcn recharts
  attribute matchers).
- **No palette classes** (`bg-sky-500`, `text-violet-600`, etc.) in any
  slice. Use semantic tokens: `bg-primary`, `text-brand`,
  `bg-muted-foreground/20`, `border-border/40`, `ring-ring/30`.
- **No inline-style hex/rgba**. Use `style={{ color: "oklch(var(--x))" }}`
  or just utility classes.
- Every color token in `tailwind.config.ts` carries the
  `/ <alpha-value>` placeholder so slash-opacity utilities compose.

## R3. CSS vars store raw components, not wrapped colors

- Color vars hold `L C H` OKLCH components (or `H S% L%` HSL for
  shadow-color). No `oklch(...)` wrapper.
- Tailwind consumes them as `oklch(var(--x) / <alpha-value>)`.
- When porting registry / preset values, strip the wrapper before
  `root.style.setProperty`.

## R4. Convex mutations are guarded

Every `mutation({ ... })` handler must start with one of:

```ts
const userId = await requireUser(ctx);         // any authenticated user
await requireOwnedDoc(ctx, docId, "Data");     // owned document CRUD
const callerId = await requireAdmin(ctx);      // admin-gated
```

List / reader queries that must survive unauthenticated SSR use
`await optionalUser(ctx)` and return `null` on missing session.

Public-by-design mutations (password reset, anonymous feedback, seed)
must be explicitly commented with the rationale.

## R5. Input validation at the boundary

- Any string field ≥ 1 user-visible character must be length-capped via
  `v.string()` + handler-side trim + length check.
- URLs must pass `assertUrl` (http/https only; block javascript: data:
  file:).
- Free-text fields run through `containsControlChar` to reject binary
  payloads.
- AI actions pipeline: `requireQuota(ctx)` → `sanitizeAIInput()` →
  `wrapUserInput()` before the proxy call.

## R6. Public endpoints are opt-in and enumeration-resistant

- Any mutation that flips a `public*` field on a user document starts
  as `undefined` / `false`.
- Queries behind a public URL (`/[slug]`, `/r/*`) return `null` for
  every failure mode — malformed / not-found / disabled indistinguish­
  able — so the response doesn't leak existence.
- Returned object uses an explicit per-key whitelist; never spread the
  source document.
- Metadata default is `robots: noindex, nofollow, noarchive, nosnippet`
  unless the user explicitly opts in.
- ISR `revalidate = 60` (or shorter) minimum on public routes to absorb
  scraping before it hits Convex.

## R7. WCAG touch-target split

- Mobile (viewports `< lg` / 1024): 44×44 AAA (WCAG 2.5.5).
- Desktop (viewports `≥ lg`): 36×36 AA (WCAG 2.5.8) — pointer input
  baseline.
- Enforced on `TabsList` (`h-11 sm:h-9`), dialog/sheet close, every
  icon-only button in mobile shells.
- Every icon-only button has `aria-label` in Indonesian.

## R8. i18n discipline

- All UI copy in Indonesian. `<html lang="id">` at layout root.
- Convex thrown errors in Indonesian — match existing tone
  (`"Tidak terautentikasi"`, `"Bukan admin"`, `"Data tidak ditemukan"`).
- Date: `Intl.DateTimeFormat("id-ID", ...)` — e.g., "23 April 2026".
- Number: `id-ID` ("1.234.567,89").
- Currency: `Rp 15.000.000` (space after Rp, dot as thousand separator).
- When adding new copy: grep-check for English leaks (`Close`,
  `Submit`, `Save`, `Open`, `Search`, `Filter`, etc.).

## R9. Typescript strictness

- `strict: true` in `tsconfig.json` — keep it.
- `any` / `as any` / `@ts-ignore` / `@ts-expect-error` = banned.
  Unknown shapes → `unknown` + type guard.
- Discriminated unions for state machines; Convex validators for schema
  parity.

## R10. File naming + structure

- Slice folders: `kebab-case`.
- React components: `PascalCase.tsx`.
- Hooks: `camelCase.ts(x)`.
- shadcn primitives: `kebab-case.tsx` (matches upstream convention).
- Test files: `*.test.ts(x)` colocated with source.
- No default exports unless Next.js requires it (`app/*/page.tsx`,
  `layout.tsx`, error boundaries). Named exports everywhere else.

## R11. Commits + PRs

- Conventional commits: `feat`, `fix`, `docs`, `refactor`, `test`,
  `chore`, `polish`.
- Scope in parens: `fix(theme):`, `feat(calculator):`, etc.
- Body explains WHY, not WHAT (the diff covers WHAT).
- Every commit passes `pnpm typecheck && pnpm lint && pnpm test`
  locally before push.
- Pre-commit hook (lint-staged) handles ESLint `--fix` + convex
  typecheck on staged files — **do not bypass with `--no-verify`**.

## R12. No hidden side effects

- No `console.log` in production code (warn + error for legitimate
  diagnostics only).
- No `fetch` directly to external origins from the browser; use
  Convex actions or Next.js route handlers.
- No `dangerouslySetInnerHTML` — currently one occurrence in shadcn's
  chart primitive (static constant, reviewed safe). Adding a new one
  needs PR-body justification.

## R13. Don't break the scroll gutter contract

- `html { scrollbar-gutter: stable }` in `index.css`. Do not toggle or
  override. Every interior scroller uses `overflow-y-auto` with
  `overscroll-contain` so nested scrolls don't bubble.

## R14. Schema migrations land under review

- New Convex schema fields default to `v.optional(...)` unless the
  field is required by business logic AND every existing row can be
  backfilled in the same PR.
- Indexes named `by_user[_<field>]` or `by_<domain-anchor>_<field>`
  per existing convention.
- Add a comment in `schema.ts` block explaining why the field exists
  + any whitelist / gate behavior it unlocks.

## R15. Follow the decision tree for theme extensions

1. New color needed → add to `index.css` `:root` + `.dark` blocks as
   OKLCH components + tailwind token with `<alpha-value>`.
2. New preset token (registry-sourced) → add key to `COLOR_TOKENS` /
   `PASSTHROUGH_TOKENS` / `FONT_TOKENS` lists in `themePresets.ts`.
3. New font for a preset → add to `registryFonts.ts` `REGISTRY_FONT_VAR`
   map + register in `app/layout.tsx` with `next/font/google`.
4. New tracking / shadow variant → bake default in `index.css`, add
   tailwind utility in `tailwind.config.ts`, document in
   `docs/guides.md`.
