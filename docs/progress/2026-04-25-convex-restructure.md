# Convex Restructure — 2026-04-25

> **Goal:** reshape `convex/` from flat files to domain folders that mirror frontend slices, so contributors (and AI) load one feature at a time, dependencies stay explicit, and the project is opensource-ready.
>
> **Constraint:** zero behavior change. Schema content unchanged → no data migration. Function signatures unchanged → frontend re-points imports only.
>
> **Gates before merge:** `pnpm typecheck`, `pnpm lint` (zero-warning), `pnpm test`, `pnpm build`. All must be green.

---

## 1. Why

| Driver | Concrete benefit |
|---|---|
| Opensource-ready | `convex/cv/`, `convex/matcher/` instantly scannable for outside contributors. |
| AI context | Loading `convex/<domain>/**` ≈ 5–6k tokens vs ~10k via grep on flat layout. |
| Frontend ↔ backend symmetry | `frontend/src/slices/cv/` ↔ `convex/cv/`. Mental model matches. |
| Future ATS Match feature | Lands in `convex/matcher/atsMatch.ts` next to the rest, not as another flat file. |
| Schema fragmentation | Per-domain `schema.ts` keeps table definitions next to their usage; root schema becomes a thin orchestrator. |

## 2. Convex constraints (non-negotiable)

These files MUST stay at `convex/` root — Convex hardcodes their location:

- `schema.ts`
- `auth.ts` + `auth.config.ts` (`@convex-dev/auth` requires)
- `http.ts`
- `crons.ts`
- `_generated/` (auto, untouched)

Underscore-prefixed folders are excluded from `api` codegen — used for shared helpers + seeds.

A folder name that collides with a sibling file (`auth.ts` + `auth/` folder) is risky — we deliberately avoid this by keeping `passwordReset.ts` at root next to `auth.ts` instead of nesting it under an `auth/` folder.

## 3. Final folder layout

```
convex/
  _generated/                       (auto, untouched)

  _shared/                          (was _lib — host-system helpers, no public API)
    auth.ts                         requireUser, optionalUser, requireOwnedDoc
    env.ts
    rateLimit.ts
    rateLimit.test.ts
    sanitize.ts
    sanitize.test.ts
    aiProviders.ts                  AI provider catalog (also referenced by ai/)

  _seeds/                           (data fixtures only, no Convex functions)
    demoData.ts

  # ROOT FILES (Convex hardcodes / auth-adjacent / orchestrators)
  schema.ts                         imports + spreads per-domain *Tables fragments
  auth.ts                           @convex-dev/auth provider config (Password + Anonymous)
  auth.config.ts
  http.ts
  router.ts                         httpRouter shim used by http.ts
  crons.ts                          cron schedules; refs internal.<domain>.<file>.fn
  passwordReset.ts                  auth-adjacent — kept at root to avoid auth/ folder collision
  seed.ts                           top-level seed orchestrator; calls per-domain helpers

  # DOMAIN FOLDERS (mirror frontend slices loosely; 17 domains)
  cv/                               CV builder + translation
  matcher/                          Job matching + future ATS scan
  applications/                     Job applications tracker
  documents/                        Document checklist
  roadmap/                          Skill roadmap
  calendar/                         Calendar events
  contacts/                         Networking contacts (renamed from "networking" — domain noun)
  notifications/                    User notifications
  portfolio/                        Portfolio items
  mockInterview/                    Mock interview sessions
  financial/                        Financial planner + budget envelopes (merge financial + budgetVariables)
  goals/                            Career goals + milestones
  profile/                          User profile + public profile (merge users + publicProfile)
  ai/                               AI core: actions, settings, chat (merge ai + aiSettings + chat)
  admin/                            Admin powers + analytics (merge admin + analytics)
  feedback/                         User-submitted feedback
  files/                            File uploads (avatars, attachments)
```

Each domain folder contains, as needed:

- `schema.ts` — non-default `export const <name>Tables = { ... }` fragment
- `queries.ts` — all `query()` exports
- `mutations.ts` — all `mutation()` + `internalMutation()` exports
- `actions.ts` — all `action()` exports
- `cleanup.ts` / `seedJobs.ts` / `providers.ts` — domain-specific helpers when meaningful

Domains without a dimension simply omit that file (e.g. `feedback/` has no `queries.ts`).

## 4. File-level migration map

### Renames (folder)

| Old | New |
|---|---|
| `convex/_lib/` | `convex/_shared/` |

### Files removed (consolidated elsewhere)

| Old path | Becomes |
|---|---|
| `convex/cv.ts` | `convex/cv/queries.ts` + `convex/cv/mutations.ts` |
| `convex/translateCV.ts` | `convex/cv/actions.ts` (with internal `_checkTranslateQuota` co-located in `convex/cv/mutations.ts`) |
| `convex/matcher.ts` | `convex/matcher/queries.ts` + `convex/matcher/mutations.ts` + `convex/matcher/seedJobs.ts` |
| `convex/applications.ts` | `convex/applications/queries.ts` + `convex/applications/mutations.ts` |
| `convex/documents.ts` | `convex/documents/queries.ts` + `convex/documents/mutations.ts` |
| `convex/roadmaps.ts` | `convex/roadmap/queries.ts` + `convex/roadmap/mutations.ts` |
| `convex/calendar.ts` | `convex/calendar/queries.ts` + `convex/calendar/mutations.ts` |
| `convex/networking.ts` | `convex/contacts/queries.ts` + `convex/contacts/mutations.ts` |
| `convex/notifications.ts` | `convex/notifications/queries.ts` + `convex/notifications/mutations.ts` |
| `convex/portfolio.ts` | `convex/portfolio/queries.ts` + `convex/portfolio/mutations.ts` |
| `convex/interviews.ts` | `convex/mockInterview/queries.ts` + `convex/mockInterview/mutations.ts` |
| `convex/financial.ts` + `convex/budgetVariables.ts` | `convex/financial/queries.ts` + `convex/financial/mutations.ts` |
| `convex/goals.ts` | `convex/goals/queries.ts` + `convex/goals/mutations.ts` |
| `convex/users.ts` + `convex/publicProfile.ts` | `convex/profile/queries.ts` + `convex/profile/mutations.ts` |
| `convex/ai.ts` + `convex/aiSettings.ts` + `convex/chat.ts` | `convex/ai/queries.ts` + `convex/ai/mutations.ts` + `convex/ai/actions.ts` + `convex/ai/providers.ts` (← `_lib/aiProviders.ts`) |
| `convex/admin.ts` + `convex/analytics.ts` | `convex/admin/queries.ts` + `convex/admin/mutations.ts` + `convex/admin/cleanup.ts` (cron target) |
| `convex/feedback.ts` | `convex/feedback/mutations.ts` (`listFeedback` query already lives in admin) |
| `convex/files.ts` | `convex/files/queries.ts` + `convex/files/mutations.ts` |

### Files unchanged (root, untouched location)

- `convex/auth.ts`, `convex/auth.config.ts`
- `convex/http.ts`, `convex/router.ts`
- `convex/crons.ts` (content updated for new internal paths)
- `convex/passwordReset.ts`
- `convex/seed.ts` (imports updated)

### Internal helpers move

| Old path | New path |
|---|---|
| `convex/_lib/auth.ts` | `convex/_shared/auth.ts` |
| `convex/_lib/env.ts` | `convex/_shared/env.ts` |
| `convex/_lib/rateLimit.ts` | `convex/_shared/rateLimit.ts` |
| `convex/_lib/rateLimit.test.ts` | `convex/_shared/rateLimit.test.ts` |
| `convex/_lib/sanitize.ts` | `convex/_shared/sanitize.ts` |
| `convex/_lib/sanitize.test.ts` | `convex/_shared/sanitize.test.ts` |
| `convex/_lib/aiProviders.ts` | `convex/ai/providers.ts` (also re-exported from `_shared` if any other domain needs it; current usage is ai-only) |

## 5. Schema split

`convex/schema.ts` becomes a 30-line orchestrator:

```ts
import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { profileTables } from "./profile/schema";
import { cvTables } from "./cv/schema";
import { applicationsTables } from "./applications/schema";
import { roadmapTables } from "./roadmap/schema";
import { documentsTables } from "./documents/schema";
import { mockInterviewTables } from "./mockInterview/schema";
import { financialTables } from "./financial/schema";
import { goalsTables } from "./goals/schema";
import { notificationsTables } from "./notifications/schema";
import { aiTables } from "./ai/schema";
import { calendarTables } from "./calendar/schema";
import { observabilityTables } from "./admin/schema";
import { feedbackTables } from "./feedback/schema";
import { budgetTables } from "./financial/schema";  // co-located w/ financial
import { passwordResetTables } from "./passwordReset";
import { portfolioTables } from "./portfolio/schema";
import { contactsTables } from "./contacts/schema";
import { filesTables } from "./files/schema";
import { matcherTables } from "./matcher/schema";

export default defineSchema({
  ...authTables,
  ...profileTables,
  ...cvTables,
  ...applicationsTables,
  ...roadmapTables,
  ...documentsTables,
  ...mockInterviewTables,
  ...financialTables,
  ...goalsTables,
  ...notificationsTables,
  ...aiTables,
  ...calendarTables,
  ...observabilityTables,
  ...feedbackTables,
  ...passwordResetTables,
  ...portfolioTables,
  ...contactsTables,
  ...filesTables,
  ...matcherTables,
});
```

### Table → fragment ownership

| Table | Lives in | Fragment export |
|---|---|---|
| `userProfiles` | `convex/profile/schema.ts` | `profileTables` |
| `cvs` | `convex/cv/schema.ts` | `cvTables` |
| `jobApplications` | `convex/applications/schema.ts` | `applicationsTables` |
| `skillRoadmaps` | `convex/roadmap/schema.ts` | `roadmapTables` |
| `documentChecklists` | `convex/documents/schema.ts` | `documentsTables` |
| `mockInterviews` | `convex/mockInterview/schema.ts` | `mockInterviewTables` |
| `financialPlans` + `budgetVariables` | `convex/financial/schema.ts` | `financialTables` |
| `careerGoals` | `convex/goals/schema.ts` | `goalsTables` |
| `notifications` | `convex/notifications/schema.ts` | `notificationsTables` |
| `chatConversations` + `aiSettings` + `rateLimitEvents` | `convex/ai/schema.ts` | `aiTables` |
| `calendarEvents` | `convex/calendar/schema.ts` | `calendarTables` |
| `errorLogs` + `roleAuditLogs` | `convex/admin/schema.ts` | `observabilityTables` |
| `feedback` | `convex/feedback/schema.ts` | `feedbackTables` |
| `passwordResetTokens` | `convex/passwordReset.ts` | `passwordResetTables` (named export from same file) |
| `portfolioItems` | `convex/portfolio/schema.ts` | `portfolioTables` |
| `contacts` | `convex/contacts/schema.ts` | `contactsTables` |
| `files` | `convex/files/schema.ts` | `filesTables` |
| `jobListings` (+ future `atsScans`) | `convex/matcher/schema.ts` | `matcherTables` |

## 6. API path migration map

> **Format:** `OLD → NEW`. Frontend codemod uses this table.
> Internal helpers (functions starting with `_`) and unused public exports are also listed — they're rare but the codegen carries them.

### admin/

```
api.admin.bulkDeleteUsers              → api.admin.mutations.bulkDeleteUsers
api.admin.deleteUser                   → api.admin.mutations.deleteUser
api.admin.getGlobalStats               → api.admin.queries.getGlobalStats
api.admin.listAllUsers                 → api.admin.queries.listAllUsers
api.admin.listFeedback                 → api.admin.queries.listFeedback
api.admin.listRoleAuditLogs            → api.admin.queries.listRoleAuditLogs
api.admin.updateUserRole               → api.admin.mutations.updateUserRole
api.admin.viewErrorLogs                → api.admin.queries.viewErrorLogs

internal.admin.cleanupInactiveDemoUsers → internal.admin.cleanup.cleanupInactiveDemoUsers
```

### analytics → admin/

```
api.analytics.amISuperAdmin            → api.admin.queries.amISuperAdmin
api.analytics.getFeatureAdoption       → api.admin.queries.getFeatureAdoption
api.analytics.getOverview              → api.admin.queries.getOverview
api.analytics.getProfileAggregates     → api.admin.queries.getProfileAggregates
api.analytics.getSignupTrend           → api.admin.queries.getSignupTrend
api.analytics.listUsersWithProfiles    → api.admin.queries.listUsersWithProfiles
```

### ai (merge ai + aiSettings + chat)

```
# from ai.ts
api.ai.testConnection                  → api.ai.actions.testConnection
internal.ai._checkAIQuota              → internal.ai.mutations._checkAIQuota
api.ai.generateCareerAdvice            → api.ai.actions.generateCareerAdvice
api.ai.generateInterviewQuestions      → api.ai.actions.generateInterviewQuestions
api.ai.evaluateInterviewAnswer         → api.ai.actions.evaluateInterviewAnswer

# from aiSettings.ts
api.aiSettings.clearMine               → api.ai.mutations.clearAISettings
api.aiSettings.getMine                 → api.ai.queries.getAISettings
api.aiSettings.listProviders           → api.ai.queries.listAIProviders
api.aiSettings.setMine                 → api.ai.mutations.setAISettings
api.aiSettings.toggle                  → api.ai.mutations.toggleAI
internal.aiSettings._getForUser        → internal.ai.queries._getAISettingsForUser

# from chat.ts
api.chat.deleteSession                 → api.ai.mutations.deleteChatSession
api.chat.getSession                    → api.ai.queries.getChatSession
api.chat.listSessions                  → api.ai.queries.listChatSessions
api.chat.upsertSession                 → api.ai.mutations.upsertChatSession
api.chat.deleteAllSessions             → api.ai.mutations.deleteAllChatSessions
```

> Function names get qualified to avoid collisions inside the merged `ai/` folder
> (e.g. `clearMine` → `clearAISettings` since `chat` and `aiSettings` both have generic verbs).

### applications/

```
api.applications.createApplication        → api.applications.mutations.createApplication
api.applications.deleteApplication        → api.applications.mutations.deleteApplication
api.applications.getUserApplications      → api.applications.queries.getUserApplications
api.applications.updateApplicationStatus  → api.applications.mutations.updateApplicationStatus
```

### budgetVariables → financial/

```
api.budgetVariables.createVariable     → api.financial.mutations.createBudgetVariable
api.budgetVariables.listMine           → api.financial.queries.listBudgetVariables
api.budgetVariables.removeVariable     → api.financial.mutations.removeBudgetVariable
api.budgetVariables.seedDefaults       → api.financial.mutations.seedBudgetDefaults
api.budgetVariables.updateVariable     → api.financial.mutations.updateBudgetVariable
```

### calendar/

```
api.calendar.createEvent               → api.calendar.mutations.createEvent
api.calendar.deleteEvent               → api.calendar.mutations.deleteEvent
api.calendar.listEvents                → api.calendar.queries.listEvents
api.calendar.updateEvent               → api.calendar.mutations.updateEvent
```

### contacts/ (was networking)

```
api.networking.bumpContactInteraction  → api.contacts.mutations.bumpContactInteraction
api.networking.createContact           → api.contacts.mutations.createContact
api.networking.deleteContact           → api.contacts.mutations.deleteContact
api.networking.listContacts            → api.contacts.queries.listContacts
api.networking.toggleContactFavorite   → api.contacts.mutations.toggleContactFavorite
api.networking.updateContact           → api.contacts.mutations.updateContact
```

### cv/

```
api.cv.createCV                        → api.cv.mutations.createCV
api.cv.getUserCVs                      → api.cv.queries.getUserCVs
api.cv.updateCV                        → api.cv.mutations.updateCV
api.translateCV.translate              → api.cv.actions.translate
internal.translateCV._checkTranslateQuota → internal.cv.mutations._checkTranslateQuota
```

### documents/

```
api.documents.getUserDocumentChecklist → api.documents.queries.getUserDocumentChecklist
api.documents.seedDocumentChecklist    → api.documents.mutations.seedDocumentChecklist
api.documents.updateDocumentStatus     → api.documents.mutations.updateDocumentStatus
```

### feedback/

```
api.feedback.submitFeedback            → api.feedback.mutations.submitFeedback
```

### files/

```
api.files.generateUploadUrl            → api.files.mutations.generateUploadUrl
api.files.getFileUrl                   → api.files.queries.getFileUrl
api.files.saveFile                     → api.files.mutations.saveFile
api.files.listMyFiles                  → api.files.queries.listMyFiles
api.files.deleteFile                   → api.files.mutations.deleteFile
```

### financial/

```
api.financial.createOrUpdateFinancialPlan → api.financial.mutations.createOrUpdateFinancialPlan
api.financial.getUserFinancialPlan        → api.financial.queries.getUserFinancialPlan
api.financial.deleteFinancialPlan         → api.financial.mutations.deleteFinancialPlan
```

### goals/

```
api.goals.createGoal                   → api.goals.mutations.createGoal
api.goals.deleteGoal                   → api.goals.mutations.deleteGoal
api.goals.getUserGoals                 → api.goals.queries.getUserGoals
api.goals.updateGoalProgress           → api.goals.mutations.updateGoalProgress
```

### interviews → mockInterview/

```
api.interviews.completeInterview         → api.mockInterview.mutations.completeInterview
api.interviews.createMockInterview       → api.mockInterview.mutations.createMockInterview
api.interviews.getInterviewAnalytics     → api.mockInterview.queries.getInterviewAnalytics
api.interviews.getUserInterviews         → api.mockInterview.queries.getUserInterviews
api.interviews.updateInterviewAnswer     → api.mockInterview.mutations.updateInterviewAnswer
```

### matcher/

```
api.matcher.getMatches                 → api.matcher.queries.getMatches
api.matcher.listJobs                   → api.matcher.queries.listJobs
api.matcher.seedDemoJobs               → api.matcher.mutations.seedDemoJobs
```

### notifications/

```
api.notifications.deleteAllNotifications     → api.notifications.mutations.deleteAllNotifications
api.notifications.deleteNotification         → api.notifications.mutations.deleteNotification
api.notifications.getUserNotifications       → api.notifications.queries.getUserNotifications
api.notifications.markAllNotificationsAsRead → api.notifications.mutations.markAllNotificationsAsRead
api.notifications.markNotificationAsRead     → api.notifications.mutations.markNotificationAsRead
```

### portfolio/

```
api.portfolio.createPortfolioItem      → api.portfolio.mutations.createPortfolioItem
api.portfolio.deletePortfolioItem      → api.portfolio.mutations.deletePortfolioItem
api.portfolio.listPortfolio            → api.portfolio.queries.listPortfolio
api.portfolio.togglePortfolioFeatured  → api.portfolio.mutations.togglePortfolioFeatured
api.portfolio.updatePortfolioItem      → api.portfolio.mutations.updatePortfolioItem
```

### profile/ (merge users + publicProfile)

```
# from users.ts
api.users.createOrUpdateProfile        → api.profile.mutations.createOrUpdateProfile
api.users.getCurrentUser               → api.profile.queries.getCurrentUser
api.users.updateAvatar                 → api.profile.mutations.updateAvatar
api.users.userExistsByEmail            → api.profile.queries.userExistsByEmail
api.users.getUserStats                 → api.profile.queries.getUserStats

# from publicProfile.ts
api.publicProfile.getBySlug            → api.profile.queries.getBySlug
api.publicProfile.getMyPublicProfile   → api.profile.queries.getMyPublicProfile
api.publicProfile.listIndexableSlugs   → api.profile.queries.listIndexableSlugs
api.publicProfile.updateMyPublicProfile → api.profile.mutations.updateMyPublicProfile
api.publicProfile.isSlugAvailable      → api.profile.queries.isSlugAvailable
```

### roadmaps → roadmap/

```
api.roadmaps.getUserRoadmap            → api.roadmap.queries.getUserRoadmap
api.roadmaps.seedRoadmap               → api.roadmap.mutations.seedRoadmap
api.roadmaps.updateSkillProgress       → api.roadmap.mutations.updateSkillProgress
```

### Unchanged (root files)

```
api.passwordReset.requestReset         → unchanged
api.passwordReset.resetPassword        → unchanged
api.seed.seedDemoExperience            → unchanged
api.seed.seedForCurrentUser            → unchanged
```

## 7. Codemod execution

### A. Convex internal cross-refs

After moving files:

```bash
# 1. crons.ts
sed -i 's|internal\.admin\.cleanupInactiveDemoUsers|internal.admin.cleanup.cleanupInactiveDemoUsers|g' convex/crons.ts

# 2. seed.ts orchestrator — every internal.<table>.<fn> reference
#    update by hand referencing the migration map above

# 3. relative imports within convex/
#    moving a file from convex/foo.ts → convex/foo/queries.ts means
#      `from "./_lib/auth"` → `from "../_shared/auth"`
#      `from "./_generated/server"` → `from "../_generated/server"`
#    one level deeper.
```

### B. Frontend api paths

Single sed pass, derived from §6 mapping. Run from repo root:

```bash
# Build sed script from migration map (manual or generated). Example excerpt:
sed -i \
  -e 's|api\.networking\.|api.contacts.|g' \
  -e 's|api\.translateCV\.|api.cv.actions.|g' \
  -e 's|api\.aiSettings\.|api.ai.|g' \
  -e 's|api\.chat\.|api.ai.|g' \
  -e 's|api\.users\.|api.profile.|g' \
  -e 's|api\.publicProfile\.|api.profile.|g' \
  -e 's|api\.budgetVariables\.|api.financial.|g' \
  -e 's|api\.interviews\.|api.mockInterview.|g' \
  -e 's|api\.roadmaps\.|api.roadmap.|g' \
  -e 's|api\.analytics\.|api.admin.|g' \
  $(git ls-files 'frontend/**/*.ts' 'frontend/**/*.tsx')

# Then a SECOND pass injects the queries/mutations/actions segment.
# Easiest: do this BY HAND per file or via ts-morph script (safer than sed
# because some calls use the ref form `api.x.y` indirectly through helpers).
```

**Strategy chosen:** generate `_generated/api.d.ts` first (after Convex side moves), then run typecheck. Every miss surfaces as a TS error like `Property 'createCV' does not exist on type ...`. Fix one by one — gives strong correctness guarantee that pure-regex codemod can't.

### C. Verification

After all edits:

```bash
# No reference to old paths should remain
grep -rE "api\.(networking|translateCV|aiSettings|chat|users|publicProfile|budgetVariables|interviews|roadmaps|analytics)\." \
  frontend/src frontend/app convex
# Expected: no matches
```

## 8. Gates

Run in sequence; abort on first failure:

```bash
pnpm install                            # in case _generated changed
pnpm backend:dev-sync                   # regenerate convex/_generated/* from new layout
pnpm typecheck                          # frontend + convex must be clean
pnpm lint                               # zero-warning policy
pnpm test                               # 25 existing test cases must still pass
pnpm build                              # confirms _generated/api.d.ts is reachable end-to-end
```

A passing build is the ultimate signal — Next.js statically analyzes `api.*` references during build, so a missing path fails loudly.

## 9. Rollback plan

If anything explodes mid-restructure:

```bash
git restore .
git clean -fd convex/  # remove new empty folders
```

Working tree is clean before we start (verified: branch `main`, status clean as of `9f1d828`). Branch protection: do this on a dedicated branch `chore/convex-restructure`, NOT directly on main.

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| `_generated/api.d.ts` doesn't regenerate cleanly because `convex/` schema fragments fail | Test schema split FIRST as a standalone commit before moving any function code. |
| Frontend codemod misses an import (e.g. dynamic `api[name]` indexing) | Forbid dynamic api indexing (we don't use any today; grep proves it). Typecheck catches static misses. |
| `crons.ts` internal ref typo blocks deploy | Type-check + Convex codegen surfaces this; cron only fires after deploy lands. |
| `@convex-dev/auth` paths hardcoded internally | `auth.ts` stays at root → unaffected. Verified by reading `auth.ts` — only imports from `./auth.config` and helpers. |
| Self-hosted deploy reads stale Convex bundle | Restart Convex container after deploy; `pnpm backend:deploy` triggers this. |
| Schema migration needed because table location changed | NO — schema content is unchanged, only the file the table is *defined in* moves. Convex hashes schema content, not source location. |

## 11. Documentation updates

After the move lands:

- `CLAUDE.md` — Architecture section's Convex bullet list re-pointed to new folder layout.
- `docs/backend.md` — module table re-keyed by domain folder.
- `docs/architecture.md` — diagram updated if it shows Convex flat layout.
- `convex/README.md` — replace with a domain-folder map + "how to add a domain" instructions for opensource contributors.
- `AGENTS.md` (if added later for opensource) — point AI agents at `convex/<domain>/` boundary.

## 12. Next steps after restructure

Once green:

1. **ATS Match feature** lands at `convex/matcher/atsMatch.ts` + `convex/matcher/atsScore.ts` + `convex/matcher/atsScore.test.ts`. Schema fragment grows by `atsScans` table.
2. **README** at repo root updated for opensource — link to `docs/architecture.md`, `docs/backend.md`, `docs/development.md`.
3. **CONTRIBUTING.md** stub: how to add a slice (frontend) or domain (backend), gates, conventions.

---

## Appendix A — Mechanical execution order

1. ✅ Write this doc.
2. Branch: `chore/convex-restructure` off main.
3. Create empty domain folders + `_shared/` rename. Run `pnpm typecheck` — should still pass (nothing referenced yet).
4. Schema split: extract per-domain `<domain>/schema.ts` fragments → root `schema.ts` orchestrator. Run `pnpm backend:dev-sync` + typecheck. Should still pass.
5. Move modules into folders, splitting by query/mutation/action. Update relative imports. After EACH domain, run typecheck. (Iterative is safer than big-bang within the convex side.)
6. Run `pnpm backend:dev-sync` to regenerate api.d.ts.
7. Frontend: run typecheck → fix every TS error one-by-one (each maps to a path rewrite per §6).
8. Update `crons.ts` + `seed.ts` + `http.ts` for new internal refs.
9. Full gate sweep: typecheck, lint, test, build.
10. Update CLAUDE.md + docs/backend.md.
11. Commit, push, watch CI green, PR.

## Appendix B — Why merge AI / profile / financial?

These three are merges, not 1:1 moves. Reasoning:

- **ai/** — `ai.ts` (LLM proxy actions), `aiSettings.ts` (per-user keys), `chat.ts` (conversation history) all share the same domain (the AI feature). Frontend has one `ai-agent` slice + one `ai-settings` slice; backend collapsing them gives `api.ai.*` as the single AI API surface — clearer than three sibling namespaces that all touch the same tables.
- **profile/** — `users.ts` (current user profile mutations) + `publicProfile.ts` (the `/[slug]` public-page reads) operate on the same `userProfiles` table. Two files for the same table is friction; one folder with `queries.ts` + `mutations.ts` is the canonical shape.
- **financial/** — `financial.ts` (relocation plan) + `budgetVariables.ts` (envelope categories) feed the same Financial Calculator slice. Frontend already treats them as one feature.

**Not merged:**

- `goals/` stays standalone — career goals are conceptually distinct from financial planning, even if both touch dashboard views.
- `feedback/` stays standalone — small but a clean boundary; the table is read by admin/ but written from a public-ish form. Splitting writer vs reader by domain is intentional.
- `files/` stays standalone — generic infra used by cv (avatar), profile (avatar), portfolio (cover image). It's cross-cutting; pulling it into any one domain would muddy ownership.
