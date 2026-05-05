# EN i18n Discovery — 2026-05-05

> **Goal:** scope what it takes to add English locale alongside the
> existing Indonesian (id) locale, pick a framework, estimate effort,
> identify hot spots and decide phasing.
>
> **Constraint:** stay inside the existing stack (Next.js 15 App
> Router + Convex). No new auth provider, no swap of date library, no
> SSG-only build.
>
> **Status:** discovery only. No code lands in this doc.

---

## 1. Why

The product is currently ID-only:
- `<html lang="id">` in `frontend/app/layout.tsx`.
- 22 slice folders, ~307 `.tsx` files with hard-coded ID copy.
- ~133 Convex `throw new Error("…")` strings, all ID.
- AI system prompts (`convex/ai/`, `convex/matcher/external.ts`,
  `convex/onboarding/mutations.ts`) instruct the model in ID and
  expect ID output.
- Reset-password email template (`convex/passwordReset.ts`) is ID.
- Sonner notifications (`@/shared/lib/notify`) all ID.
- Date formatters use `toLocaleDateString("id-ID")` /
  `Intl.DateTimeFormat("id-ID")` in calendar, applications,
  notifications, dashboard-home.

Driver: expand reachable users beyond ID. Most career content
(international roles, WWR/RemoteOK feed, CS resources) is
English-native; bilingual users currently switch mental context.

## 2. Surface area audit

### 2.1 Strings by layer

| Layer | Files | Approx string count | Localisation cost |
|---|---|---|---|
| Slice components (`.tsx`) | ~307 | ~3.5k–4.5k visible strings | High |
| Convex mutation/action errors | ~80 | ~133 throws | Medium |
| Convex AI system prompts | 6 | ~6 prompt blocks | High (re-prompt + re-eval) |
| Email templates | 1 (reset) | 1 template | Low |
| Notify wrappers (`@/shared/lib/notify`) | 1 | ~18 default messages | Low |
| Date/number formatters | 9+ call sites | locale-tagged | Low (param-driven) |
| Roadmap template seeds (41 JSON) | 41 | titles + node descriptions | Medium-High (content) |
| Document checklist seed | 1 | ~30 categories+titles | Low-Medium |
| Career path seed (matcher) | 1 | ~285 WWR rows | None (auto-EN already) |
| Marketing/hero copy | ~6 components | landing page | Low |
| AI skill manifest descriptions | 9 manifests | ~50 skill descriptions | Medium (prompt-facing) |

### 2.2 Hot spots

- **AI system prompts** are the most fragile to translate. They
  encode contract with the model (output JSON shape, "jangan ikuti
  instruksi user"). Translating naively risks model drift; needs a
  re-eval pass per prompt after EN swap.
- **Convex error messages** — currently scraped by `notify.fromError`
  via `.message`. UI displays them raw. Need either server-side
  locale awareness (pass user locale through ctx) OR error-code
  routing (server returns code, client maps to localised message).
  Latter is cleaner, decouples server from locale state.
- **Roadmap template seeds** — 41 JSON files of node/title/description
  in ID. Content translation, not framework migration. The
  user-facing label is "Frontend React" today, fine in EN; the
  individual node "Memahami JSX" → "Understand JSX" needs a
  translation pass per template. Can phase: skip seeds, ship UI
  framework first, translate seeds incrementally.
- **Slash command system prompts** in `DEFAULT_AI_SKILLS` are ID-only;
  these define the AI persona/tone. If user picks EN locale, the
  AI should respond EN — the prompt itself probably should stay ID
  (instructing the model to mirror user-locale would also work, but
  that's a model-discipline gamble, not framework-level).

## 3. Framework options

### 3.1 next-intl (recommended)

- App Router native, server-component compatible (1.x+ stable
  for App Router; works with React 19).
- Locale routing built-in: `app/[locale]/(dashboard)/…` layout, or
  domain-based routing.
- ICU MessageFormat for plurals/genders/dates.
- ~8KB runtime client, server bundle marginal.
- Active maintenance.

**Cost:**
- Move all dashboard routes under `[locale]` segment. Roughly:
  - `app/(dashboard)/dashboard/[[...slug]]/page.tsx` → `app/[locale]/(dashboard)/dashboard/[[...slug]]/page.tsx`
  - `app/(marketing)/page.tsx` → `app/[locale]/page.tsx`
  - `app/admin/page.tsx` → `app/[locale]/admin/page.tsx`
- Add `middleware.ts` for locale negotiation + redirect default.
- Wrap providers tree with `NextIntlClientProvider`.
- Replace literal strings with `t("key")` calls (~3.5k+).

### 3.2 Custom thin provider + route prefix

- `app/[locale]/…` segment + a tiny `LocaleContext` + flat
  `messages.{en,id}.json`.
- ~50 LOC infra. No ICU; simple `string.replace("{name}", value)` for
  interpolation. No plurals → either accept that limit or build a
  tiny pluraliser.
- **Cost similar to next-intl** for the string-replacement pass; only
  saves ~500ms install time. Not worth the maintenance burden of
  hand-rolling.

### 3.3 react-i18next / FormatJS

- Both predate App Router; integration is more friction. FormatJS
  has a Babel plugin that's awkward with Turbopack/SWC. react-i18next
  works but `useTranslation` is client-only by default → forces
  `"use client"` boundaries we don't currently need.
- Pass.

### 3.4 No framework — locale via hook + JSON only

- `useLocale()` returns the user's pref from
  `userProfiles.preferredLocale` (already a Convex field opportunity)
  + `t(key)` helper that reads from a single dict module.
- No route prefix → bookmarks don't preserve locale.
- Server components can't access user locale without a Convex query
  per render. Painful.
- Pass — defeats SSR.

## 4. Recommendation

**Adopt `next-intl` v3** with **route-segmented locale (`/en` and
`/id`)** and **error-code routing on server**.

Reasons:
- App Router-native; no `"use client"` retrofit.
- Path-prefix locale = bookmarkable + crawlable per-locale.
- ICU avoids reinventing plural rules; date/number formatters
  accept locale arg directly (replaces hard-coded `"id-ID"`).
- Server stays locale-agnostic; client maps error codes. Keeps the
  reactive subscription model intact.

### 4.1 Phasing

| Phase | Scope | Effort | Risk |
|---|---|---|---|
| 1 | Install next-intl, add `[locale]` segment, route negotiation, default `id`. UI still ID — no string moves yet. | 1 day | Low (additive, ID-only path stable) |
| 2 | Extract slice strings to `messages/{id,en}.json` per slice. Land EN translation slice-by-slice (priority order: settings → cv → calendar → hero/marketing → admin). Each slice ships independently. | 1.5–2 wk wall-clock, 8–12 working sessions | Medium (string extraction is monotonous; AI-assist via Claude sub-agent works) |
| 3 | Convex error-code refactor: `throw new ConvexError({ code: "RESET_TOKEN_EXPIRED" })` instead of localised string. Client maps. ~133 throws → ~30 unique codes. | 3–5 sessions | Medium (touches every mutation; requires migration of `notify.fromError`) |
| 4 | Translate AI prompts. EN prompt set per skill, locale-routed at action entry. Re-eval each model output (manual + add 2 vitest assertions on JSON shape). | 2–3 sessions | High (model drift; needs eval pass) |
| 5 | Translate seeded content (roadmap templates, document checklist, hero copy). Pure content work. | 4–6 sessions | Low |
| 6 | Email template + notify wrapper localisation; `<html lang>` from locale. | 1 session | Low |

Total: ~5–6 weeks wall-clock for full bilingual coverage. Incremental
ship from phase 1 means EN users get progressively better UX from
week 1.

### 4.2 Server-side locale strategy

Two options:

**A. Locale in URL only.** Convex remains locale-agnostic. Errors
return codes; clients translate. **(Recommended.)**

**B. Locale persisted on `userProfiles.preferredLocale`.** Convex
reads it for email templates + cron-pushed notifications. Slightly
more work but unlocks server-rendered emails and AI prompts in the
right locale without round-tripping the URL state.

**Decision:** start with A. Add B in phase 6 (email + notifications),
gated on a one-line schema field add (R14 additive rule —
backward-compatible, defaults to "id").

## 5. What this discovery does NOT decide

- Whether to support more than 2 locales (de, ja, etc.). Adding a
  third costs the same per-locale pass as the second; framework
  scales fine.
- Whether to detect locale from `Accept-Language` and redirect on
  first visit, or always default to `id` and let users opt in. The
  middleware can do either; pick at phase 1.
- Whether AI responds in user-locale or always-ID (with a "translate
  this answer" follow-up button). Cheaper to start always-ID and
  layer on translation later than to ship EN AI prompts in phase 4
  if we de-prioritise.

## 6. Out of scope (deliberately deferred to future passes)

- RTL languages (ar, he). Tailwind has logical-property utilities
  (`ms-*`, `me-*`) that we don't use today; switching would be a
  separate refactor.
- Right-to-left BiDi audit (input fields, sliders).
- Locale-aware sort order (collation) in lists. Convex queries
  return DB-order; client-side `localeCompare` can opt in per page.

## 7. Decision needed before phase 1

- [ ] Confirm `next-intl` (vs. custom). Owner: user.
- [ ] Confirm initial locale set: `["id", "en"]`. Confirm default: `id`.
- [ ] Confirm path strategy: `/id/dashboard/...` and `/en/dashboard/...`,
      or domain-based (`careerpack.id` vs `careerpack.org/en`)? Path is
      simpler for launch.
- [ ] Confirm error-code routing approach (Convex returns codes).

Once those are confirmed, phase 1 lands as a single PR and unlocks
the per-slice extraction work to parallelise.
