# Porting Guide — Transplant a CareerPack Feature

Shared reference for moving any slice/feature from CareerPack into a
new project. Every feature doc's **Portabilitas** section links back
here instead of repeating the basics.

> **Workflow:** open the target feature's doc (e.g. `cv-generator.md`)
> for the slice-specific file list + cp commands, and this guide for
> the environment + shared-deps it takes for granted.

---

## 0. Does your target project have the baseline?

CareerPack features assume a specific stack. Before porting, the
target project needs **all** of the following — if anything is
missing, port it from here first.

| Requirement | Why | How to verify |
|---|---|---|
| **Next.js 15 App Router** (not Pages) | App Router conventions, Server Components, Route Groups | `next --version`, `app/` dir exists |
| **TypeScript strict** | Every slice uses `strict: true` (R9) | `tsconfig.json` |
| **pnpm workspace OR single-package** | Imports use `@/` path alias to `frontend/src` | `pnpm-workspace.yaml` or `tsconfig.paths` |
| **Self-hosted Convex** (`convex/` dir + `@convex-dev/auth`) | Every data-touching feature uses `useQuery`/`useMutation` | `convex/schema.ts` exists, `convex/_generated/` present |
| **Tailwind v3** with **OKLCH tokens** | Every component uses semantic tokens (`bg-primary`, `text-brand`, `border-border/40`) | Grep for `oklch(var(` in `tailwind.config.ts` |
| **shadcn/ui primitives** | Every component uses `Button`, `Card`, `Input`, `Dialog`, etc. | `frontend/src/shared/components/ui/` |
| **sonner Toaster** mounted at root | Features fire `toast.success` / `toast.error` | `Providers.tsx` includes `<Toaster />` |
| **Responsive shell** | Features assume MobileContainer (BottomNav) + DesktopContainer (Sidebar) wrap `(dashboard)/` | Copy containers from `frontend/src/shared/containers/` if absent |

If the target is greenfield Next.js + Convex + shadcn — minimum 1 hour
to set up the baseline. See `docs/architecture.md` for the full shell
copy-paste.

---

## 1. Shared helpers every feature uses

These are the "prelude" imports. If your slice doc mentions any of
them, make sure they exist in the target project before cp'ing the
slice.

### Auth

```
frontend/src/shared/hooks/useAuth.tsx
frontend/src/shared/types/auth.ts
frontend/src/shared/components/auth/RouteGuard.tsx
convex/_shared/auth.ts                 → requireUser, optionalUser, requireOwnedDoc
convex/auth.ts                      → @convex-dev/auth Password provider + PBKDF2
convex/auth.config.ts
convex/http.ts
```

### UI primitives (shadcn — assume already present)

```
frontend/src/shared/components/ui/
  button.tsx, card.tsx, input.tsx, label.tsx, textarea.tsx,
  dialog.tsx, responsive-dialog.tsx, select.tsx, responsive-select.tsx,
  tabs.tsx, badge.tsx, progress.tsx, scroll-area.tsx, sheet.tsx,
  dropdown-menu.tsx, tooltip.tsx, responsive-tooltip.tsx,
  avatar.tsx, skeleton.tsx, slider.tsx, sonner.tsx, table.tsx
```

Install shadcn: `npx shadcn@latest init` — pick the components on
demand when each slice needs one. Don't copy CareerPack's shadcn
wrappers wholesale; use upstream.

### Cross-cutting utilities

```
frontend/src/shared/lib/utils.ts            → cn() classname merger
frontend/src/shared/lib/env.ts              → lazy env getter
frontend/src/shared/hooks/use-mobile.tsx    → viewport detection
frontend/src/shared/components/interactions/MicroInteractions.tsx
  (several slices consume MagneticTabs, SwipeToDelete, useDragReorder,
   TypingDots, AnimatedProgress — copy if needed)
```

### Theme (only if the slice uses slash-opacity utilities)

```
frontend/src/shared/styles/index.css        → OKLCH :root vars
frontend/tailwind.config.ts                 → oklch(var(--x) / <alpha-value>)
```

If the slice only uses generic Tailwind (no `bg-brand`, `text-muted-foreground`, etc.), the theme system is optional.

---

## 2. Convex module registration (IMPORTANT)

When you copy a new Convex module (e.g. `convex/cv/`) into the
target project, **manually add it to `convex/_generated/api.d.ts`**
if you're not running live `convex dev`:

```ts
// _generated/api.d.ts
import type * as cv from "../cv.js";

declare const fullApi: ApiFromModules<{
  // ...
  cv: typeof cv;
}>;
```

If you ARE running `pnpm backend:dev` (or `npx convex dev`), this
regenerates automatically on file save.

---

## 3. Schema migration — the additive rule (R14)

Every slice doc lists its schema requirements. When you port:

1. Open target's `convex/schema.ts`.
2. Add each listed table. Keep **new fields `v.optional(...)`** unless
   you're seeding every existing row in the same commit.
3. Add the listed indexes (`by_user` convention).
4. Don't remove/rename existing tables in the target — additive only.
5. Run `pnpm backend:dev-sync` (or `npx convex dev --once`) to
   regenerate types.

If the slice uses `files` (Convex storage), also port:

```
convex/files/
convex/schema.ts → files table (tenantId scope)
frontend/src/shared/hooks/useFileUpload.ts
frontend/src/shared/lib/imageConvert.ts
frontend/src/shared/components/files/FileUpload.tsx
```

See `file-upload.md` for the complete file-storage porting doc.

---

## 4. Nav registration (for dashboard-wrapped slices)

If the slice renders in `(dashboard)/dashboard/[[...slug]]`:

1. Add import + entry in `frontend/src/shared/lib/dashboardRoutes.tsx`
   (`DASHBOARD_VIEWS` map). Lazy-load via `next/dynamic`.
2. Add to `frontend/src/shared/components/layout/navConfig.ts`
   (`PRIMARY_NAV` or `MORE_APPS`). Slug must match `DASHBOARD_VIEWS`
   key.
3. **Optional** super-admin / role gate: add `superAdminOnly: true`
   on the MoreAppTile and `useVisibleMoreApps()` hook will filter it.
   See `admin-panel.md`.

---

## 5. Indonesian copy (R8) — consider before porting

Every CareerPack slice has UI copy in Indonesian:
- Labels, placeholders, button text, toast messages
- Error messages thrown from Convex handlers
- Date / number / currency formatting (`id-ID` locale)

Porting to an English-language project = search-and-replace, but the
pattern "`{count} jam`" → "`{count} hours`" is non-trivial when
copy is scattered. Budget **1-3 hours per slice for i18n conversion**
depending on size.

---

## 6. Environment variables

Slices that call external APIs need env vars. Common ones:

| Variable | Used by | Format |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | All frontend | HTTPS Convex URL |
| `CONVEX_OPENAI_API_KEY` | `ai.ts` actions | Provider key |
| `CONVEX_OPENAI_BASE_URL` | `ai.ts` actions | OpenAI-compatible endpoint |
| `ADMIN_BOOTSTRAP_EMAILS` | `users.ts` role bootstrap | Comma-separated |
| `JWT_PRIVATE_KEY` | `@convex-dev/auth` JWT signing | PEM PKCS8 |
| `JWKS` | `@convex-dev/auth` JWT verify | JSON |
| `CONVEX_SITE_URL` | `auth.config.ts` | Auto-mapped from `CONVEX_SITE_ORIGIN` |

Each feature doc lists only its specific vars; treat the shell +
Convex vars as baseline.

---

## 7. Dependencies cheatsheet

Most slices need only what Next + Convex + shadcn already provide.
Exceptions (external npm):

| Slice | Extra deps |
|---|---|
| `cv-generator` | `html2pdf.js`, `jspdf`, `html2canvas` |
| `financial-calculator` | `recharts` |
| `admin-panel` | `recharts` |
| `calendar` | `react-day-picker` + `date-fns` |
| `skill-roadmap` | — |
| File upload (shared) | `react-easy-crop` |
| AI agent (chat console) | — (uses markdown inline renderer) |
| Public profile (`/[slug]`) | — |

Install per-slice in the target: `pnpm add <pkg>`.

---

## 8. Portability tiers (recap)

Each feature doc labels itself with a tier:

| Tier | Meaning | Typical effort |
|---|---|---|
| **S — slice-only** | Self-contained; one `cp -r` and it works. No schema, no shared hooks beyond `useAuth` / shadcn. Examples: `hero`, `dashboard-home` (subset), `help`. | 15 min |
| **M — slice + shared** | Needs 1-2 shared hooks/components + possibly 1 Convex module. Examples: `calendar`, `notifications`, `networking`. | 1 hour |
| **L — slice + shared + schema migration** | New Convex tables + indexes + multiple shared deps. Examples: `cv-generator`, `skill-roadmap`, `mock-interview`, `portfolio`. | 2-4 hours |
| **XL — infrastructure** | Cross-cutting; not a slice but a platform. Examples: `file-upload`, theme-preset system, public-profile `/[slug]`, auth. | 3-8 hours + design decisions |

---

## 9. Verification checklist (after porting)

Run through this after cp'ing a feature to the target project.

- [ ] `pnpm typecheck` passes (shared + convex tsconfigs)
- [ ] `pnpm lint --max-warnings=0` passes
- [ ] `pnpm test` (if the target has tests) passes
- [ ] `pnpm build` produces a clean Next build
- [ ] `pnpm backend:dev-sync` regenerated `convex/_generated/api.d.ts`
- [ ] Schema migration applied without errors (`pnpm backend:deploy`)
- [ ] Nav entry appears at the expected URL
- [ ] Feature renders, mutations succeed, data persists across reload
- [ ] Indonesian copy replaced with target language (if applicable)
- [ ] R4 guards still in place on every mutation (`requireUser`, etc.)

If any step fails, the feature doc's **Troubleshooting** section
usually covers the common causes.
