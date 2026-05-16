# KitabSync Report — CareerPack

> Generated 2026-05-15 by Claude Code (Opus 4.7).
>
> - **Kitab repo**: <https://github.com/rahmanef63/resource-site>
> - **Kitab snapshot ref**: `de7411b90cf2d63cf974025f1228b36deb4d90bb` (`main`)
> - **Consumer repo HEAD**: see `Run history` below
> - **Scanned paths**: `frontend/slices/` (absent), `slices/` (absent), `frontend/slices/` ✓
> - **Local manifest format**: `.kitab.json` per slice (template in `CLAUDE.md` § Rahman Resources kitab — BSDL)

## Snapshot

| Metric | Value |
|---|---|
| Kitab slugs total | 15 |
| Local slices total | 22 |
| Manifests detected (`.kitab.json`) | 1 |
| Manifested slugs in kitab | 1 |
| Kitab-only slugs (no local manifest) | 14 |
| Local-only slices (no kitab slug) | 21 |
| Kitab version (assumed across all slugs) | `0.1.0` |

### Verdict breakdown

| Verdict | Count | Slugs |
|---|---|---|
| `in-sync` | 1 | `document-checklist` |
| `drift` | 0 | — |
| `kitab-only` | 14 | `admin`, `ai-router`, `audit-log`, `broadcast-channel-sync`, `cal-com-booking`, `comments`, `convex-auth`, `doku-payment`, `full-width-toggle`, `mdx-blog`, `midtrans-payment`, `resend-newsletter`, `seo`, `vector-search` |
| `local-only` | 0 | — (21 unrelated local slices: see Snapshot note below) |

> Local-only context: CareerPack has 21 local slices whose names do not collide with any kitab slug — these are project-domain features (`cv-generator`, `matcher`, `skill-roadmap`, `career-dashboard`, `mock-interview`, `financial-calculator`, etc.) and are out of scope for kitab sync.

### Generalization breakdown

| Status | Count | Slugs |
|---|---|---|
| `portable` | 0 | — |
| `needs-adapter` | 1 | `document-checklist` |
| `consumer-locked` | 0 | — |
| N/A (no local manifest) | 14 | (all `kitab-only` slugs above) |

## Slices detail

### `admin` — kitab-only · N/A

- **Local path**: not adopted
- **Closest local slice**: `admin-panel` (different slug — not the kitab `admin`)
- **Suggested action**: triage — decide whether to adopt the kitab `admin` slice or keep CareerPack's local `admin-panel`. Adoption would require renaming local slice + Convex `admin/` domain to align with kitab table-shape conventions.

### `ai-router` — kitab-only · N/A

- **Local path**: not adopted
- **Closest local slices**: `ai-agent`, `ai-settings` (different slugs)
- **Suggested action**: low priority — CareerPack already centralises AI access via `convex/_shared/aiProviders.ts` + the action-bus pattern in `slices/ai-agent`. Re-evaluate when the kitab `ai-router` matures to a multi-provider router with quota + sanitisation parity.

### `audit-log` — kitab-only · N/A

- **Local path**: not adopted
- **Suggested action**: candidate for adoption — CareerPack currently has no dedicated audit-log slice. Could capture admin/seed/destructive actions from `slices/admin-panel` if kitab `audit-log` ships an append-only Convex table + viewer.

### `broadcast-channel-sync` — kitab-only · N/A

- **Local path**: not adopted
- **Suggested action**: deferred — single-user CareerPack flows benefit minimally from cross-tab sync today. Reconsider if multi-tab CV-edit collisions surface.

### `cal-com-booking` — kitab-only · N/A

- **Local path**: not adopted
- **Closest local slice**: `calendar` (different scope — internal scheduler, no Cal.com integration)
- **Suggested action**: skip — Cal.com is a vendor-specific integration; CareerPack's calendar is reminder-centric, not booking-centric.

### `comments` — kitab-only · N/A

- **Local path**: not adopted
- **Suggested action**: deferred — no commentable surface in current CareerPack feature set.

### `convex-auth` — kitab-only · N/A

- **Local path**: not adopted (local `auth` slice + `convex/auth.ts` already wire `@convex-dev/auth` directly)
- **Suggested action**: skip adoption — kitab `convex-auth` would conflict with the custom PBKDF2-SHA256 100k hashing locked in by Dokploy reverse-proxy timeout constraints (see CLAUDE.md § Auth specifics). Local implementation is intentionally divergent.

### `document-checklist` — in-sync · needs-adapter

- **Local path**: `frontend/slices/document-checklist/`
- **Manifest**: `frontend/slices/document-checklist/.kitab.json`
- **kitabVersion**: `0.1.0` (== kitab `main`) → `in-sync`
- **consumerVersion**: `0.1.0`
- **syncDirection**: `bidirectional`
- **Blockers** (from `.harvest/audit-flags.json`, lifted into manifest):
  1. `auth-scope` (warn) — `convex/documents/mutations.ts` uses `requireUser(ctx)` per-user, kitab convention demands `requirePermission(ctx, workspaceId, perm)`.
  2. `table-shape` (warn) — `convex/documents/schema.ts` tables `documentChecklists` + `documentTemplates` indexed `by_user`/`by_country`, not `by_workspace`. Tables also not slug-prefixed.
  3. `raw-button` (warn) — 4 raw `<button>` elements in CategoryFilter:32,50 / ChecklistItemCard:31 / CountryTemplateCard:101 (should be `<Button>`).
  4. `hardcoded-copy` (warn) — Indonesian literals ("Template Dokumen per Negara", "Kerja Lokal", "Kerja Luar Negeri", "Pengingat", "Destinasi Populer") in `DocumentChecklist.tsx` + `CountryTemplateCard.tsx`; should route through `t()`/props.
  5. `deep-relative-import` (info) — `'../../../../../convex/_generated/api'` in 3 files; sanitizer should rewrite to `@convex/_generated/api` on push UP.
- **Suggested action**: run `/rr-prep document-checklist --fix` to resolve blockers, then `/rr-send document-checklist` to push UP. After kitab merges, run `npx rahman-resources update document-checklist` to pull DOWN and reset `consumerVersion` to match.

### `doku-payment` — kitab-only · N/A

- **Local path**: not adopted
- **Suggested action**: skip — CareerPack has no payment surface yet. If pricing/billing rolls out, prefer one of (`doku-payment`, `midtrans-payment`, future Stripe) per business decision; adopt only the chosen one.

### `full-width-toggle` — kitab-only · N/A

- **Local path**: not adopted
- **Suggested action**: candidate for adoption — could fold into `slices/settings` as a layout preference. Low complexity.

### `mdx-blog` — kitab-only · N/A

- **Local path**: not adopted
- **Suggested action**: skip — CareerPack is dashboard-first; marketing/blog surface is minimal (`/`, `/privacy`, `/terms`). If a careers blog emerges, reconsider.

### `midtrans-payment` — kitab-only · N/A

- **Local path**: not adopted
- **Suggested action**: skip — see `doku-payment` rationale (single payment provider when billing lands).

### `resend-newsletter` — kitab-only · N/A

- **Local path**: not adopted
- **Suggested action**: deferred — local notifications use Convex actions; the existing weekly job digest cron (`internal.notifications.digest.sendWeeklyDigest`) covers transactional+digest needs. Adopt only if a marketing newsletter is added.

### `seo` — kitab-only · N/A

- **Local path**: not adopted
- **Suggested action**: candidate for adoption — CareerPack already has `sitemap.xml`, `robots.txt`, and per-page OpenGraph image, but a centralised SEO slice could DRY title/description/canonical handling across `(marketing)/` and `(dashboard)/` route groups.

### `vector-search` — kitab-only · N/A

- **Local path**: not adopted
- **Suggested action**: candidate for adoption — `slices/matcher` currently ranks job listings via keyword scoring; vector search could lift match quality. Blocker: Convex vector indexes (self-hosted) need to be validated for the existing Dokploy image pin before adopting.

## Aggregate suggested actions (priority order)

1. **`document-checklist` UP-sync prep** — resolve the 5 blockers via `/rr-prep document-checklist --fix`. Highest priority because the slice is already manifested + audited and one `/rr-send` away from feeding the kitab back.
2. **`vector-search` adoption** — directly improves `slices/matcher` quality (the user-facing differentiation). Validate Convex vector-index support on the pinned self-hosted image first.
3. **`audit-log` adoption** — wraps the admin/seed/destructive actions in `slices/admin-panel` with append-only tracking. Cheap insurance for the engine seed flow (`/admin → Engine Seed`).
4. **`seo` adoption** — DRY the existing scattered SEO metadata across route groups.
5. **`full-width-toggle` adoption** — small layout preference, folds cleanly into `slices/settings`.
6. **`admin` triage** — decide whether to rename CareerPack's `admin-panel` to match kitab `admin` (slug + table-shape convergence) or keep them divergent.
7. **Skip with rationale**: `convex-auth` (PBKDF2 lock-in), `cal-com-booking` (vendor mismatch), `mdx-blog` (no blog surface), `doku-payment` / `midtrans-payment` / `resend-newsletter` (no commerce/newsletter surface yet), `broadcast-channel-sync` / `comments` (deferred until use case lands), `ai-router` (existing internal pattern already covers it).

## Run history (append-only)

| date | event | manifest count | consumer HEAD | actor |
|---|---|---|---|---|
| 2026-05-15 | initial bootstrap | 1 | `02233d71ffc545da636568910a904e2f29532e9b` | claude-code |
| 2026-05-15 | report backfill | 1 | `aa3a94ee3fea57aa0be6d2ac6db562119f7b1f09` | claude-code |
