# Features — Modular Portable Docs

Every feature in this project has a self-contained doc describing:
- **What it does** (Tujuan, Data Flow, Design notes)
- **How to port it** to another project (file list, `cp` commands, schema migrations, npm deps, env vars, integration steps)

Each doc is designed to be **read in isolation** — pair one feature
doc with `_porting-guide.md` (baseline stack + shared helpers) and
you have everything you need to transplant.

## Quick reference

- **`_porting-guide.md`** — Shared stack requirements + common
  helpers + verification checklist. Read once; applies to every
  feature.
- **`_template.md`** — Canonical structure for writing a new
  feature doc.

## Feature catalog

Tier column refers to porting effort — see `_porting-guide.md` §8:
- **S** = slice-only, ~15 min
- **M** = slice + shared, ~1 hour
- **L** = slice + shared + new schema, 2–4 hours
- **XL** = infrastructure, platform-level work, 3–8 hours

| Feature | Route | Tier | Doc |
|---|---|---|---|
| **Infrastructure (not a slice)** | | | |
| File upload (Convex storage + WebP convert + crop) | — | **XL** | [file-upload.md](./file-upload.md) |
| Auth (`@convex-dev/auth` + PBKDF2 + JWT) | `/login`, `/forgot-password`, `/reset-password/[token]` | **XL** | [auth.md](./auth.md) |
| AI Agent (chat console + action bus + slash commands) | global FAB | **XL** | [ai-agent.md](./ai-agent.md) |
| Admin Panel (super-admin analytics) | `/dashboard/admin-panel` | **L** | [admin-panel.md](./admin-panel.md) |
| **Landing + dashboard shell** | | | |
| `hero` (marketing landing) | `/` | **S** | [hero.md](./hero.md) |
| `dashboard-home` | `/dashboard` | **M** | [dashboard-home.md](./dashboard-home.md) |
| **Core career tools** | | | |
| `cv-generator` | `/dashboard/cv` | **L** | [cv-generator.md](./cv-generator.md) |
| `calendar` | `/dashboard/calendar` | **M** | [calendar.md](./calendar.md) |
| `career-dashboard` (applications) | `/dashboard/applications` | **M** | [career-dashboard.md](./career-dashboard.md) |
| `skill-roadmap` | `/dashboard/roadmap` | **L** | [skill-roadmap.md](./skill-roadmap.md) |
| `document-checklist` | `/dashboard/checklist` | **L** | [document-checklist.md](./document-checklist.md) |
| `mock-interview` | `/dashboard/interview` | **L** | [mock-interview.md](./mock-interview.md) |
| `financial-calculator` | `/dashboard/calculator` | **L** | [financial-calculator.md](./financial-calculator.md) |
| `portfolio` | `/dashboard/portfolio` | **L** | [portfolio.md](./portfolio.md) |
| `personal-branding` (public profile builder) | `/dashboard/personal-branding`, `/[slug]` | **XL** | [personal-branding.md](./personal-branding.md) |
| **Secondary tools** | | | |
| `matcher` (job matching) | `/dashboard/matcher` | **M** | [matcher.md](./matcher.md) |
| `networking` (contacts) | `/dashboard/networking` | **M** | [networking.md](./networking.md) |
| `notifications` | `/dashboard/notifications` | **M** | [notifications.md](./notifications.md) |
| `library` (content library) | `/dashboard/library` | **M** | [library.md](./library.md) |
| `database` (per-user table hub) | `/dashboard/database` | **M** | [database.md](./database.md) |
| `help` (pusat bantuan) | `/dashboard/help` | **S** | [help.md](./help.md) |
| **Settings + admin** | | | |
| `settings` (multi-section) | `/dashboard/settings` | **L** | [settings.md](./settings.md) |
| `ai-settings` | `/dashboard/ai-settings` | **M** | [ai-settings.md](./ai-settings.md) |
| `admin` (role-gated `/admin` route) | `/admin` | **S** | [admin.md](./admin.md) |

## How to use for porting

### Scenario: I want to add CV Generator to my existing project

1. Open [`_porting-guide.md`](./_porting-guide.md) — ensure target has
   baseline (Next.js 15 + Convex + shadcn + Tailwind OKLCH).
2. Open [`cv-generator.md`](./cv-generator.md) — scroll to
   **Portabilitas** section.
3. Run the listed `cp` commands.
4. Apply schema additions to target's `convex/schema.ts`.
5. Install listed npm deps.
6. Register nav entry + api.d.ts.
7. Run verification checklist from `_porting-guide.md` §9.

### Scenario: I want only the file upload pipeline

Same flow, but read [`file-upload.md`](./file-upload.md) — it's
infrastructure (no slice boundary), 4 files + 1 schema table + 1
npm dep.

### Scenario: I want the whole super-admin pattern

1. Port `auth.md` first (full auth).
2. Port `admin-panel.md` (adds `requireSuperAdmin` helper +
   `analytics.ts`).
3. Wire `useVisibleMoreApps` filter into target's nav.

## Writing a new feature doc

Copy [`_template.md`](./_template.md) and fill in. Keep:
- Descriptive sections short (~1-2 paragraphs each)
- File lists **exhaustive** — someone reading this cold should be
  able to `cp` without opening the code
- cp commands **runnable** — include the `SRC=~/projects/CareerPack`
  + `DST=~/projects/<target>` prelude

## Related docs

- [`../ai-onboarding.md`](../ai-onboarding.md) — for an AI agent just loaded into the repo
- [`../architecture.md`](../architecture.md) — shape of the codebase
- [`../backend.md`](../backend.md) — full Convex module + schema map
- [`../rules.md`](../rules.md) — R1..R17 non-negotiables
- [`../guides.md`](../guides.md) — G1..G14 recipes (includes G14 file storage pattern)
