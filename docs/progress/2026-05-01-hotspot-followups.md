# Hotspot Follow-Ups Batch — 2026-05-01

> **Goal:** close the 6 hotspot follow-ups identified during the progress
> breakdown earlier today: email delivery, password-reset rate limit, ICS
> export + reminders, OAuth-free import, backup recipe, a11y / EN i18n.
>
> **Constraint:** stay inside the existing stack — no new frameworks, no
> new auth providers, no LinkedIn / Notion API integrations (those need
> OAuth app setup outside the repo). Email goes through a pluggable
> `fetch`-based sender so we don't pull a vendor SDK into the Convex bundle.

---

## What landed

### 1 — Email delivery for password reset

- New `convex/_shared/email.ts` — pluggable `sendEmail()` (Resend REST via `fetch`, console fallback when `RESEND_API_KEY` is unset).
- `convex/passwordReset.ts` refactored: `requestReset` mutation persists the hashed token then `ctx.scheduler.runAfter(0, …)` hands off to a new internal action `deliverResetEmail`. Action picks env at runtime, builds the link from `APP_URL`, renders the Indonesian-language HTML template, and calls `sendEmail`.
- Anti-enumeration property preserved — caller still always gets `{ok:true}`; failures only surface in backend logs.

**Env to set in production (Dokploy):**
- `RESEND_API_KEY` — required for delivery
- `EMAIL_FROM` — verified Resend sender domain
- `APP_URL` — base URL for reset links (e.g. `https://careerpack.org`)

### 2 — Per-email rate limit on `requestReset`

- 5 requests / hour bucket, keyed by user._id (effectively per-email since email→user is 1:1).
- Implemented in-line — counts existing `passwordResetTokens` rows in the last hour. No new table.
- Silent overflow (returns `{ok:true}`) so the anti-enumeration response is identical to the "no such email" path.
- Mutations don't expose request IP, so true per-IP would need migrating `requestReset` to an `httpAction`. Logged as future work; per-email already blunts the realistic threat (a single inbox being spammed).

### 3 — Calendar reminders

- `convex/calendar/schema.ts` — added `reminderMinutes` (offset before start) + `reminderSentAt` (idempotency key) to `calendarEvents`. New `by_date` index for the cron sweep.
- `convex/calendar/reminders.ts` (new) — internalMutation `sweepReminders`. Walks today's + tomorrow's events; for each event with `reminderMinutes` set whose reminder window opened, inserts a `notifications` row and sets `reminderSentAt`. Skips events that already have it set; marks events that ended >30 min ago as sent so retries don't fire late.
- `convex/crons.ts` — wires it to run hourly at `:05`. Hourly granularity = a 15-minute reminder may fire up to ~60 min early; tighten cadence later if needed.
- `convex/calendar/mutations.ts` — `createEvent` accepts `reminderMinutes`; `updateEvent` clears `reminderSentAt` whenever the user reschedules so the cron can re-fire.
- `frontend/shared/hooks/useAgenda.ts` — passthrough `reminderMinutes` on the AgendaItem type.
- `frontend/slices/calendar/components/CalendarView.tsx` — new `Pengingat` select in `AddAgendaDialog` with options *Tanpa pengingat / 15 menit / 1 jam / 1 hari sebelum*.

### 4 — Calendar ICS export

- `frontend/slices/calendar/lib/ics.ts` (new) — minimal RFC 5545 builder. Pure JS, no deps. Emits floating local-time DTSTART (importing client uses local TZ), 60-min default duration, `VALARM` block when `reminderMinutes` is set.
- `CalendarView` page header now has *Ekspor .ics* button next to *Tambah Agenda*. Disabled when there are no events. Filename `careerpack-agenda-YYYY-MM-DD.ics`.

### 5 — ImportCard server-side AI parse

- New action `convex/ai/actions.ts#parseImportText` — takes raw resume / LinkedIn text, sanitizes through the existing pipeline (`requireQuota` → `sanitizeAIInput` → `wrapUserInput`), prompts the AI proxy for a strict JSON QuickFill profile payload, parses + returns it.
- `frontend/slices/personal-branding/sections/ImportCard.tsx` — replaces the *Segera hadir* placeholder with a real *Parse Otomatis (server-side)* card: textarea + button, runs the action, pipes result straight into the existing `api.onboarding.mutations.quickFill` apply pipeline.
- Scope fixed to `profile` for now — broader scopes (`cv`, `portfolio`, etc.) still go through the copy-paste flow because their JSON schema is too large for the current `max_tokens=800` budget. Easy to widen later by raising `max_tokens` and adding a scope arg.

### 6 — Backup recipe finalized

- New `backend/convex-self-hosted/backup.sh` — idempotent volume snapshot + retention prune. Auto-detects volume name, supports env overrides (`VOLUME_NAME`, `BACKUP_DIR`, `RETENTION_DAYS`).
- `docs/db-backup.md` updated: status flipped from *Belum diimplementasikan* → *Recipe Final*. New section walks through `scp` + cron install, plus weekly health-check commands. Action-items checklist updated.

### 7 — V2 iframe template hardening (carry-over)

- `frontend/public/personal-branding/templates/v2.html` — null-guarded the remaining 7 mount-write sites (`#skillsMount`, `#toolsMount`, `#stepsMount`, `#processRail`, `#wallMount`, `#faqMount`, `#insightsMount`). Already shipped in commit `fba129c`; recorded here for completeness.

## Out of scope (deliberately deferred)

### Per-IP rate limit on `requestReset`

Would need migrating the function from `mutation` to `httpAction` to access request headers. Doable but invasive — moves the entry point + the auth-context model. Per-email rate limit blunts the realistic single-inbox-spam threat for now; per-IP becomes worth the refactor only if we see distributed login-enumeration probes.

### LinkedIn / Notion structured import

LinkedIn API access requires partnership approval (or OAuth scopes that aren't open-self-serve). Notion needs a per-user integration token + page sharing. Both add a connect-OAuth-app surface that's bigger than this batch's scope. The new server-side AI parse covers ~80% of the *useful* import case (resume / LinkedIn export → profile fields).

### EN i18n

Full EN translation = framework decision (`next-intl` vs custom `i18n` provider vs route-segmented). Touches every UI string + Convex error message. Scoping it properly is its own discovery doc; out of scope for a follow-up batch.

### Full a11y audit

A targeted aria-label sweep landed where this batch already touched buttons (calendar `Ekspor .ics`, import textarea). A repo-wide audit needs a dedicated pass with `axe` / Lighthouse.

## Verification

```bash
pnpm typecheck   # frontend + convex tsconfig
pnpm lint        # --max-warnings=0
pnpm test        # 72/72 vitest
NEXT_PUBLIC_CONVEX_URL=$(grep ^NEXT_PUBLIC_CONVEX_URL frontend/.env.local | cut -d= -f2) pnpm build
```

All green.

## Production rollout checklist

- [ ] `convex env set RESEND_API_KEY <…>` (or via Dokploy env panel)
- [ ] `convex env set EMAIL_FROM "CareerPack <noreply@careerpack.org>"`
- [ ] `convex env set APP_URL https://careerpack.org`
- [ ] Verify Resend sender domain (DNS records)
- [ ] Smoke-test password reset end-to-end on prod
- [ ] `scp backend/convex-self-hosted/backup.sh root@<host>:/opt/careerpack/backup.sh`
- [ ] SSH host → install cron → verify first archive lands in `/var/backups/careerpack/`
- [ ] Restore-test once on staging volume
