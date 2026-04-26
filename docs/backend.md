# Backend (Convex)

Semua backend di `convex/`. Mode default = self-hosted via Dokploy (`<your-convex-backend>`). Convex cloud juga didukung — tukar `CONVEX_SELF_HOSTED_URL` dengan `CONVEX_DEPLOYMENT`.

## 1. Schema (`convex/schema.ts`)

23 domain table + authTables dari `@convex-dev/auth`. Setiap mutation
yang menulis tabel ini harus lewat `requireUser` / `requireOwnedDoc`
(**R4**) + validasi string input (**R5**).

| Table | Purpose | Index |
|---|---|---|
| `userProfiles` | Profil + avatar (`avatarStorageId`) + 10 opt-in `public*` fields (incl. `publicAvatarShow`) | `by_user`, `by_public_slug` |
| `jobApplications` | Tracking lamaran kerja | `by_user`, `by_user_status`, `by_user_applied` |
| `cvs` | CV terstruktur; `personalInfo.avatarStorageId` untuk foto formal | `by_user` |
| `skillRoadmaps` | Roadmap per careerPath + per-skill status + resources | `by_user` |
| `documentChecklists` | Ceklis dokumen; `documents[].subcategory` untuk grouping UI | `by_user` |
| `mockInterviews` | Sesi wawancara + pertanyaan + skor + durasi | `by_user`, `by_user_started` |
| `financialPlans` | Plan keuangan (target salary, expenses, relocation, readinessScore) | `by_user` |
| `careerGoals` | Goal + milestones + progress — backend exists, UI belum wired | `by_user`, `by_user_status`, `by_user_target` |
| `notifications` | In-app notif (read/unread, optional schedule) | `by_user`, `by_user_read` |
| `chatConversations` | AI agent multi-session: `sessionId` + `title` + `messages[]` dengan `actions?[]` | `by_user`, `by_user_session`, `by_user_updated` |
| `calendarEvents` | Interview / deadline / followup (date `YYYY-MM-DD`, time `HH:mm`) | `by_user`, `by_user_date` |
| `rateLimitEvents` | Token bucket untuk AI quota (10/min + 100/day) | `by_user_key_time` |
| `errorLogs` | Telemetry error | `by_time` |
| `roleAuditLogs` | Append-only log perubahan role admin/moderator | `by_time`, `by_target` |
| `feedback` | Feedback form submissions (anon / signed-in) | `by_time`, `by_user_time` |
| `budgetVariables` | Per-user envelope kalkulator — label, value, icon, kind | `by_user_order`, `by_user` |
| `aiSettings` | Per-user AI provider + API key + base URL | `by_user` |
| `passwordResetTokens` | PBKDF2v2 reset token (hashed) | `by_user`, `by_hash` |
| `portfolioItems` | Showcase; `coverStorageId` untuk cover image (fallback emoji+gradient) | `by_user`, `by_user_category`, `by_user_featured` |
| `contacts` | Networking contacts (recruiter/mentor/peer) | `by_user`, `by_user_role`, `by_user_last` |
| `jobListings` | Seed catalog — no userId, public | `by_posted`, `by_workMode` |
| **`files`** | **Uploaded file metadata (WebP / PDF). Bytes live in `ctx.storage`; scoped per tenant** | `by_tenant`, `by_user`, `by_storage` |

Full field definitions: baca `convex/schema.ts` — self-documenting.

## 2. Module Map

Layout: per-domain folders. Each domain owns its `schema.ts` (table fragment)
and any of `queries.ts` / `mutations.ts` / `actions.ts`. API path =
`api.<domain>.<file>.<fn>`. Restructure rationale + full migration map:
[docs/progress/2026-04-25-convex-restructure.md](./progress/2026-04-25-convex-restructure.md).

| Domain folder | Files | Public API |
|---|---|---|
| `cv/` | `queries.ts`, `mutations.ts`, `actions.ts`, `schema.ts` | `api.cv.queries.getUserCVs`; `api.cv.mutations.createCV` / `updateCV` / `deleteCV`; `api.cv.actions.translate` |
| `applications/` | `queries.ts`, `mutations.ts`, `schema.ts` | `api.applications.queries.getUserApplications`; `api.applications.mutations.createApplication` / `updateApplicationStatus` / `addInterviewDate` / `deleteApplication` |
| `documents/` | `queries.ts`, `mutations.ts`, `schema.ts` | `api.documents.queries.getUserDocumentChecklist`; `api.documents.mutations.seedDocumentChecklist` / `updateDocumentStatus` / `resetDocumentChecklist` |
| `roadmap/` | `queries.ts`, `mutations.ts`, `schema.ts` | `api.roadmap.queries.getUserRoadmap`; `api.roadmap.mutations.seedRoadmap` / `updateSkillProgress` / `toggleResource` / `resetRoadmap` |
| `calendar/` | `queries.ts`, `mutations.ts`, `schema.ts` | `api.calendar.queries.listEvents`; `api.calendar.mutations.createEvent` / `updateEvent` / `deleteEvent` |
| `contacts/` | `queries.ts`, `mutations.ts`, `schema.ts` (was `networking`) | `api.contacts.queries.listContacts`; `api.contacts.mutations.createContact` / `updateContact` / `deleteContact` / `toggleContactFavorite` / `bumpContactInteraction` |
| `notifications/` | `queries.ts`, `mutations.ts`, `schema.ts` | `api.notifications.queries.getUserNotifications`; `api.notifications.mutations.createNotification` / `markNotificationAsRead` / `markAllNotificationsAsRead` / `deleteNotification` / `deleteAllNotifications` |
| `portfolio/` | `queries.ts`, `mutations.ts`, `schema.ts` | `api.portfolio.queries.listPortfolio` (inlines `coverUrl`); `api.portfolio.mutations.createPortfolioItem` / `updatePortfolioItem` (with `clearCover`) / `deletePortfolioItem` / `togglePortfolioFeatured` |
| `mockInterview/` | `queries.ts`, `mutations.ts`, `schema.ts` (was `interviews`) | `api.mockInterview.queries.getUserInterviews` / `getInterviewAnalytics`; `api.mockInterview.mutations.createMockInterview` / `updateInterviewAnswer` / `completeInterview` / `deleteInterview` |
| `financial/` | `queries.ts`, `mutations.ts`, `schema.ts` (merges `financial` + `budgetVariables`) | `api.financial.queries.getUserFinancialPlan` / `listBudgetVariables`; `api.financial.mutations.createOrUpdateFinancialPlan` / `deleteFinancialPlan` / `seedBudgetDefaults` / `createBudgetVariable` / `updateBudgetVariable` / `removeBudgetVariable` |
| `goals/` | `queries.ts`, `mutations.ts`, `schema.ts` | `api.goals.queries.getUserGoals`; `api.goals.mutations.createGoal` / `updateGoalProgress` / `deleteGoal` |
| `profile/` | `queries.ts`, `mutations.ts`, `schema.ts` (merges `users` + `publicProfile`) | `api.profile.queries.getCurrentUser` (inlines `avatarUrl`) / `userExistsByEmail` / `getUserStats` / `getBySlug` / `getMyPublicProfile` / `listIndexableSlugs` / `isSlugAvailable`; `api.profile.mutations.createOrUpdateProfile` / `updateAvatar` / `updateMyPublicProfile` |
| `ai/` | `queries.ts`, `mutations.ts`, `actions.ts`, `schema.ts` (merges `ai` + `aiSettings` + `chat`) | `api.ai.queries.listAIProviders` / `getMyAISettings` / `listChatSessions` / `getChatSession`; `api.ai.mutations.setMyAISettings` / `toggleAIEnabled` / `clearMyAISettings` / `upsertChatSession` / `deleteChatSession` / `deleteAllChatSessions`; `api.ai.actions.testConnection` / `generateCareerAdvice` / `generateInterviewQuestions` / `evaluateInterviewAnswer` |
| `admin/` | `queries.ts`, `mutations.ts`, `cleanup.ts`, `schema.ts` (merges `admin` + `analytics`) | `api.admin.queries.getGlobalStats` / `listAllUsers` / `viewErrorLogs` / `listRoleAuditLogs` / `listFeedback` / `amISuperAdmin` / `getOverview` / `getProfileAggregates` / `getFeatureAdoption` / `getSignupTrend` / `listUsersWithProfiles`; `api.admin.mutations.updateUserRole` / `deleteUser` / `bulkDeleteUsers`; `internal.admin.cleanup.cleanupInactiveDemoUsers` (cron target) |
| `feedback/` | `mutations.ts`, `schema.ts` | `api.feedback.mutations.submitFeedback` |
| `files/` | `queries.ts`, `mutations.ts`, `schema.ts` | `api.files.queries.getFileUrl` (tenant-scoped) / `listMyFiles`; `api.files.mutations.generateUploadUrl` / `saveFile` / `deleteFile` |
| `matcher/` | `queries.ts`, `mutations.ts`, `seedJobs.ts`, `schema.ts` | `api.matcher.queries.listJobs` / `getMatches`; `api.matcher.mutations.seedDemoJobs` |

Root-level files (not in a domain folder):

| File | Purpose |
|---|---|
| `auth.ts` | `convexAuth({...})` — Password (PBKDF2v2 100k iter) + Anonymous. `loggedInUser` query exposed via `api.auth.loggedInUser`. |
| `auth.config.ts` | Provider config consumed by `@convex-dev/auth`. |
| `http.ts` + `router.ts` | HTTP routes (auth callback). |
| `crons.ts` | Cron schedules; refs `internal.<domain>.<file>.<fn>`. |
| `passwordReset.ts` | `api.passwordReset.requestReset` / `resetPassword` — kept at root to avoid `auth.ts` ↔ `auth/` folder name collision. |
| `seed.ts` | `api.seed.seedForCurrentUser` (minimal starter data); `api.seed.seedDemoExperience` (rich Rizky demo). |
| `schema.ts` | Orchestrator — imports per-domain `<domain>Tables` fragments and spreads into one `defineSchema`. |
| `_shared/` | Cross-domain helpers (no public API): `auth.ts`, `env.ts`, `rateLimit.ts`, `sanitize.ts`, `aiProviders.ts`. |
| `_seeds/` | Data fixtures (e.g. `demoData.ts`). |

## 3. Auth Guards (`convex/_shared/auth.ts`)

```ts
requireUser(ctx)          // → Id<"users">, throw kalau unauth
optionalUser(ctx)         // → Id<"users"> | null (read-only fallback)
requireOwnedDoc(ctx, id)  // → Doc, throw kalau bukan owner — typed RLS
```

Convention: semua **mutation** pakai `requireUser`, semua **query list** pakai `optionalUser` (return empty array / null kalau unauth, jangan throw supaya SSR / logout smooth).

## 4. Rate Limit (`convex/_shared/rateLimit.ts`)

Token bucket sederhana via `rateLimitEvents` table.

```ts
AI_RATE_LIMITS = {
  "ai:minute": { window: 60_000, max: 10 },
  "ai:day":    { window: 86_400_000, max: 100 },
}
enforceRateLimit(ctx, userId, "ai:minute")
```

Semua action AI wajib lewat `_checkAIQuota` dulu.

## 4b. File storage (`convex/files.ts` + `ctx.storage`)

Convex self-hosted ships with a built-in blob store — no S3/R2/MinIO
dependency. Metadata lives in the `files` table; bytes in storage.

| Function | Purpose |
|---|---|
| `generateUploadUrl` | Auth-gated. Returns a tokenized short-lived POST URL |
| `saveFile` | Persists metadata. `uploadedBy` + `tenantId` derived server-side (never from client) |
| `getFileUrl` | Enumeration-safe read — returns `null` on unauth/missing/cross-tenant |
| `listMyFiles` | Lists current tenant's uploads (newest first) |
| `deleteFile` | Tenant-scoped delete. DB first, storage after (orphan blob benign) |

Strict server whitelist: **`image/webp` + `application/pdf`**. Raw
JPEG/PNG rejected — the client-side converter in
`shared/lib/imageConvert.ts` transcodes everything to WebP before
upload (Canvas re-encode also strips EXIF). Pattern docs: **G14**.

## 5. Sanitize (`convex/_shared/sanitize.ts`)

- `sanitizeAIInput(text)` — strip karakter kontrol + cap panjang
- `wrapUserInput(label, text)` — bungkus untuk prompt injection mitigation

Tested: `convex/_shared/sanitize.test.ts`.

## 6. Env (`convex/_shared/env.ts`)

```ts
requireEnv("CONVEX_OPENAI_API_KEY")   // throw kalau empty
```

Env yang dibaca:
- `CONVEX_OPENAI_BASE_URL` — endpoint OpenAI-compat (bisa Azure, OpenRouter, Groq, dll)
- `CONVEX_OPENAI_API_KEY` — API key
- `JWT_PRIVATE_KEY` — signing key untuk session token (convex-auth)
- `CONVEX_SITE_URL` — public URL backend (untuk OAuth redirect)

Set via Convex dashboard (cloud) atau `backend/convex-self-hosted/.env` (self-hosted).

## 7. Generated Types

`convex/_generated/` di-generate oleh `pnpm exec convex dev`. Frontend import:

```ts
import { api } from "../../../../convex/_generated/api"
import type { Id, Doc } from "../../../../convex/_generated/dataModel"
```

Jangan edit manual. File `_generated/` di-commit ke git supaya CI tidak perlu push Convex untuk typecheck.

## 8. Seeding

First login auto-call `api.seed.seedForCurrentUser` dari `useAuth.login()`. Kalau gagal (mis. duplicate), di-swallow dengan `console.warn`. Manual re-seed:

```bash
pnpm exec convex run seed:seedForCurrentUser --env-file backend/convex-self-hosted/convex.env
```

## 9. Deployment

Self-hosted prod: lihat [deployment.md](./deployment.md).

Convex cloud (alternatif):
```bash
pnpm exec convex deploy --cmd 'pnpm build' --prod
```
Lalu set `NEXT_PUBLIC_CONVEX_URL=<deployment>.convex.cloud` di frontend env.
