# Backend (Convex)

Semua backend di `convex/`. Mode default = self-hosted via Dokploy (`<your-convex-backend>`). Convex cloud juga didukung — tukar `CONVEX_SELF_HOSTED_URL` dengan `CONVEX_DEPLOYMENT`.

## 1. Schema (`convex/schema.ts`)

15 table + authTables dari `@convex-dev/auth`.

| Table | Purpose | Index |
|---|---|---|
| `userProfiles` | Profil extended per user (location, targetRole, skills, interests) | `by_user` |
| `jobApplications` | Tracking lamaran kerja (status, tanggal apply, wawancara, notes) | `by_user`, `by_user_status`, `by_user_applied` |
| `cvs` | CV terstruktur (personalInfo, experience, education, skills, certifications, projects) | `by_user` |
| `skillRoadmaps` | Roadmap per careerPath dengan resources + progress | `by_user` |
| `documentChecklists` | Ceklis dokumen (local / international) | `by_user` |
| `mockInterviews` | Sesi wawancara + pertanyaan + skor | `by_user`, `by_user_started` |
| `financialPlans` | Plan keuangan (target salary, expenses, relocation) | `by_user` |
| `careerGoals` | Goal + milestones + progress | `by_user`, `by_user_status`, `by_user_target` |
| `notifications` | In-app notif (read/unread, optional schedule) | `by_user`, `by_user_read` |
| `chatConversations` | Riwayat AI chat per user | `by_user` |
| `calendarEvents` | Interview / deadline / followup (date `YYYY-MM-DD`, time `HH:mm`) | `by_user`, `by_user_date` |
| `rateLimitEvents` | Token bucket untuk AI quota (per minute/day) | `by_user_key_time` |
| `errorLogs` | Telemetry error (optional userId, source, stack, route) | `by_time` |

Full field definitions: baca file `convex/schema.ts` — self-documenting.

## 2. Module Map

Semua module = `query` / `mutation` / `action` style Convex. Auth-guarded via helper di `_lib/auth.ts`.

| File | Exports |
|---|---|
| `auth.ts` | `auth`, `signIn`, `signOut`, `store`, `isAuthenticated`, `loggedInUser` — Password (PBKDF2-SHA256 100k iter) + Anonymous provider |
| `users.ts` | `getCurrentUser`, `userExistsByEmail`, `createOrUpdateProfile`, `getUserStats` |
| `applications.ts` | `getUserApplications`, `createApplication`, `updateApplicationStatus`, `addInterviewDate`, `deleteApplication` |
| `cv.ts` | `getUserCVs`, `createCV`, `updateCV`, `deleteCV` |
| `calendar.ts` | `listEvents`, `createEvent`, `updateEvent`, `deleteEvent` |
| `roadmaps.ts` | `getUserRoadmap`, `createRoadmap` (pakai `defaultRoadmaps` per careerPath), `updateSkillProgress` |
| `documents.ts` | `getUserDocumentChecklist`, `createDocumentChecklist` (template local/international), `updateDocumentStatus` |
| `interviews.ts` | `getUserInterviews`, `createMockInterview`, `updateInterviewAnswer`, `completeInterview`, `getInterviewAnalytics`, `deleteInterview` |
| `financial.ts` | `getUserFinancialPlan`, `createOrUpdateFinancialPlan` |
| `goals.ts` | `getUserGoals`, `createGoal`, `updateGoalProgress`, `deleteGoal` |
| `notifications.ts` | `getUserNotifications`, `createNotification`, `markNotificationAsRead`, `markAllNotificationsAsRead` |
| `chat.ts` | `getUserConversation`, `saveMessage`, `clearConversation` (cap 4000 char/msg, 200 msg/convo) |
| `ai.ts` | `generateCareerAdvice`, `generateInterviewQuestions`, `evaluateInterviewAnswer` — action yang call OpenAI-compatible API (proxy). Di-guard rate limit + sanitize input. |
| `seed.ts` | `seedForCurrentUser` — bootstrap starter data (CV template, checklist, roadmap) saat pertama login |
| `http.ts` + `router.ts` | HTTP routes (auth callback) |

## 3. Auth Guards (`convex/_lib/auth.ts`)

```ts
requireUser(ctx)          // → Id<"users">, throw kalau unauth
optionalUser(ctx)         // → Id<"users"> | null (read-only fallback)
requireOwnedDoc(ctx, id)  // → Doc, throw kalau bukan owner — typed RLS
```

Convention: semua **mutation** pakai `requireUser`, semua **query list** pakai `optionalUser` (return empty array / null kalau unauth, jangan throw supaya SSR / logout smooth).

## 4. Rate Limit (`convex/_lib/rateLimit.ts`)

Token bucket sederhana via `rateLimitEvents` table.

```ts
AI_RATE_LIMITS = {
  "ai:minute": { window: 60_000, max: 10 },
  "ai:day":    { window: 86_400_000, max: 100 },
}
enforceRateLimit(ctx, userId, "ai:minute")
```

Semua action AI wajib lewat `_checkAIQuota` dulu.

## 5. Sanitize (`convex/_lib/sanitize.ts`)

- `sanitizeAIInput(text)` — strip karakter kontrol + cap panjang
- `wrapUserInput(label, text)` — bungkus untuk prompt injection mitigation

Tested: `convex/_lib/sanitize.test.ts`.

## 6. Env (`convex/_lib/env.ts`)

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
