# AI Onboarding — CareerPack

Single-page orientation for an AI coding agent (Claude / GPT / other) that
just landed in this repo and needs to be productive fast. Read top-to-
bottom — total ~4 min, half of which is links you only open if relevant.

If you're a human, read `README.md` → `docs/architecture.md` instead.

---

## 1. One-paragraph description

CareerPack is an Indonesian-language career-starter SaaS. Users build
CVs, track job applications, pick skill roadmaps, practise interviews,
plan relocation finances, and can publish a `careerpack.org/<slug>`
personal-brand page. Stack: **Next.js 15 App Router** (frontend) +
**self-hosted Convex** (backend + blob storage + auth). Deployed to
**Dokploy**. UI strings are Indonesian, enforced by **R8**.

---

## 2. Orientation — what to read, in order

**Before any edit:**
1. **[CLAUDE.md](../CLAUDE.md)** (at repo root) — invariants the repo
   enforces via hooks. Overrides anything in this file if conflict.
2. **[docs/rules.md](./rules.md)** — R1..R17 non-negotiables. Every
   commit is held to these.
3. **[docs/architecture.md](./architecture.md)** — routing, slices,
   provider tree.
4. **[docs/guides.md](./guides.md)** — G1..G14 recipes for the
   workflows you'll hit most often.

**When your task touches a specific domain:**
- Backend / Convex / schema → **[docs/backend.md](./backend.md)**
- Auth / login / sessions → **[docs/auth.md](./auth.md)**
- A specific feature slice → **[docs/features/&lt;slice&gt;.md](./features/)**
- Deployment / env → **[docs/deployment.md](./deployment.md)**
- Quality baseline → **[docs/qa/quality-report-2026-04-23.md](./qa/quality-report-2026-04-23.md)**

---

## 3. Golden rules (the non-negotiables)

These come up in almost every review. Violating them = PR rejected.

| ID | Rule | Shortest form |
|---|---|---|
| R1 | Slices own features | No cross-slice imports; share via `@/shared/*` |
| R2 | Theme tokens only | No hex, no palette classes; `bg-primary` / `text-brand` |
| R3 | OKLCH raw components | `oklch(var(--x) / <alpha-value>)` in Tailwind |
| R4 | Convex mutations guarded | `requireUser` / `requireOwnedDoc` / `requireAdmin` |
| R5 | Validate at boundary | `trim` + length cap + enum whitelist on every string arg |
| R6 | Public = opt-in + enum-safe | `null` for every failure mode; no `forbidden` vs `not-found` |
| R7 | WCAG touch split | `h-11 sm:h-9` — 44×44 mobile AAA, 36×36 desktop AA |
| R8 | Indonesian UI | Copy + thrown errors in Indonesian; match existing tone |
| R9 | TS strict | No `any`, no `@ts-ignore`; `unknown` + type guard |
| R14 | Schema additions optional | `v.optional(...)` unless every row backfillable in same PR |
| R17 | Convex is SSOT | localStorage only for ephemeral UI prefs |

Full text + the other six rules in `docs/rules.md`.

---

## 4. Where things live (the 30-second map)

```
frontend/
├─ app/                           Next.js App Router (route tree only, thin)
├─ src/
│  ├─ shared/                     Cross-cutting — hooks, UI kit, containers
│  │  ├─ hooks/useAuth.tsx        Auth state + login/register
│  │  ├─ hooks/useFileUpload.ts   File upload + client WebP conversion
│  │  ├─ lib/env.ts               Lazy env getter (R17 SSR-safe)
│  │  ├─ lib/themePresets.ts      36-preset OKLCH pipeline
│  │  ├─ lib/dashboardRoutes.tsx  SSOT registry for dashboard slices
│  │  ├─ components/layout/*      Sidebar, BottomNav, Header, NavUser
│  │  ├─ components/files/*       FileUpload (drag-drop + crop + WebP)
│  │  └─ components/ui/*          shadcn primitives
│  └─ slices/                     14 feature slices (kebab-case)
convex/
├─ schema.ts                      23 tables (domain + auth + audit)
├─ _lib/auth.ts                   requireUser, requireOwnedDoc, requireAdmin
├─ _lib/rateLimit.ts              Token bucket (10/min + 100/day)
├─ _lib/sanitize.ts               sanitizeAIInput, wrapUserInput
├─ files.ts                       Convex blob store (generate/save/get/list/delete)
└─ *.ts                           one module per domain
```

---

## 5. Quick-look features that are easy to break

These are hotspots — before editing anything touching them, skim the
listed file.

- **Dashboard routing**: every dashboard page resolves through a
  **single catch-all** `app/(dashboard)/dashboard/[[...slug]]/page.tsx`
  looking up a view in `DASHBOARD_VIEWS`. Adding a page = 2 edits
  (registry + nav). See **G1**.
- **Theme preset pipeline**: tokens are raw OKLCH components in CSS
  vars; Tailwind consumes them with `<alpha-value>`. Don't write
  wrapped `oklch(...)` to vars — it breaks the 36 presets. See
  `shared/lib/themePresets.ts`.
- **Auth cryptography**: PBKDF2-SHA256 100k iter custom (NOT Scrypt —
  Scrypt times out behind Dokploy proxy). `convex/auth.ts`. Don't
  swap it.
- **Login-or-register single call**: `useAuth.login` queries
  `userExistsByEmail` then signs in or signs up in one shot. Password
  field must carry `autoComplete="new-password"` on register to avoid
  browser-autofill poisoning (see **commit d66cc15**).
- **Public profile `/[slug]`**: Server Component, `ConvexHttpClient`,
  `revalidate = 60`, `robots: noindex` default. Every whitelisted
  field is explicit — never spread the profile doc. See **R6**.
- **File upload**: client converts raster images to WebP via Canvas
  (quality 0.9, original dimensions), then POSTs via XHR for
  progress. Server accepts only `image/webp + application/pdf` —
  raw JPEG is rejected. Canvas re-encode strips EXIF for free. See
  **G14**.

---

## 6. Current feature surface (for context)

Implemented and live on main:
- 14 dashboard slices (CV builder, AI agent, calendar, career
  dashboard, skill roadmap, document checklist, mock interview,
  financial calculator, dashboard home, settings, ai-settings, hero,
  auth, admin)
- Full Convex persistence (no localStorage except ephemeral UI prefs)
- File storage: avatar, CV photo, portfolio cover image
- Public `/[slug]` profile with opt-in fields + avatar
- Admin role system with `roleAuditLogs` + self-demote guard
- 36 tweakcn theme presets via OKLCH pipeline

Deferred / not built yet:
- Interview recording (video/audio) — Convex blob store isn't
  streaming-optimized; would need a dedicated service
- Multi-file upload queue — no consumer asking; YAGNI
- Career goals UI — backend exists (`convex/goals.ts`) but no front-end

---

## 7. Common gotchas

- **`useQuery` returns `undefined` while loading, `null` on unauth or
  missing** — always distinguish the two in effects. Use a `useRef`
  hydration guard so effects don't fire on every refetch.
- **Convex throws `[Request ID: X] Server Error\nUncaught Error: <real>`**
  — parse out the `<real>` message before showing to users (see
  `extractAuthError` in `useAuth.tsx`).
- **The `api.d.ts` is "generated" but committed to git** — when you
  add a new Convex module in offline edits, add its import + typeof
  alias manually (see **G2**). Live `pnpm backend:dev` regenerates.
- **Empty folders with `export {}`** are intentional feature-contract
  scaffolding. Don't delete (**R1**).
- **Tabs render both contents in the DOM** — on Radix `TabsContent`,
  hidden tabs still exist, so browser autofill can target them.
  Mitigated by correct `autoComplete` + `name` attrs.

---

## 8. How to validate your work

Before claiming a task complete, run these in order. CI runs them
on every PR.

```bash
pnpm typecheck   # frontend + convex tsconfigs
pnpm lint        # --max-warnings=0
pnpm test        # vitest run
pnpm build       # Next production build
```

If any fail: **do not** use `--no-verify` on commits or skip rules.
Investigate and fix. Pre-commit hook (lint-staged) auto-fixes what
it can.

---

## 9. When you're stuck

1. Search the repo (grep / Agent tool) before asking.
2. Read the PR history: `git log --oneline --merges`. Recent merges
   document the "why" of recent changes.
3. `docs/progress.md` tracks the session log; `docs/roadmap/*` the
   intended future.
4. Feature-specific docs under `docs/features/<slice>.md`.
5. If the user asks for something that conflicts with a rule, flag
   the rule by ID and propose an alternative. Don't silently
   violate.

---

## 10. What to do BEFORE you start writing code

**One-line check**: is the task surface-level enough that no plan is
needed, OR is it architectural?

- Surface-level (small bug fix, copy change, single-file refactor)
  → just write the code.
- Architectural (new feature, cross-slice change, schema migration)
  → produce a plan first. State which rules/guides apply. Ask if
  you're unsure.

When in doubt, ask.
