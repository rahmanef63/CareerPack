# Product Flow Diagram

User journey per skenario. Deeper per-feature detail ada di [`../features/`](../features/README.md).

## Scenario 1: Onboarding & CV Creation

1. User buka landing `/` → klik "Mulai Gratis" → `/login`
2. Sign-up (email + password + nama) atau sign-in kalau sudah existing
3. Auto-seed via `api.seed.seedForCurrentUser` (CV template, checklist, roadmap default)
4. Redirect `/dashboard` → Dashboard Home load stats + agenda
5. User ke `/dashboard/cv` → isi personalInfo, experience, education, skills
6. AI suggest bullet (via AI agent FAB / inline chip) → approve action → CV ter-update
7. `CVScoreBadge.computeScore(cvData)` tampilkan skor ATS
8. Export via dialog preview → print-to-PDF

## Scenario 2: Mock Interview

1. `/dashboard/interview` → pilih role + difficulty + type
2. `api.ai.generateInterviewQuestions` → seed pertanyaan (rate-limited)
3. User isi jawaban per pertanyaan
4. Per-answer: `api.ai.evaluateInterviewAnswer` → score + feedback
5. `completeInterview` → agregasi overallScore + feedback final
6. Session tersimpan, muncul di analytics `getInterviewAnalytics`

## Scenario 3: Application Tracking

1. `/dashboard/applications` → tambah lamaran (company, position, source)
2. Status pipeline: Applied → Screening → Interview → Offer / Rejected / Withdrawn
3. Link opsional: `applicationId` di `calendarEvents` untuk interview date
4. Dashboard Home & Chart lamaran per minggu baca subset yang sama

## Scenario 4: Skill Roadmap

1. `/dashboard/roadmap` → pilih careerPath (frontend-developer, dll)
2. `createRoadmap` populate default skills dari `convex/roadmaps.ts`
3. User toggle status skill (not-started / in-progress / completed)
4. `updateSkillProgress` recompute progress% server-side

## Scenario 5: Document Checklist

1. `/dashboard/checklist` → pilih `local` atau `international`
2. `createDocumentChecklist` populate template (10+ dokumen)
3. User toggle completed + set expiry date + notes
4. Progress% live update — missing required jadi action items

## Scenario 6: Financial Planning

1. `/dashboard/calculator` → input targetSalary + expense breakdown + relocation (optional)
2. `createOrUpdateFinancialPlan` simpan
3. Readiness score + chart (pie expense, line timeline) render client-side dari schema

## Scenario 7: AI Agent (Global)

1. FAB / SiteHeader trigger → Sheet panel buka
2. User type message atau slash-command (`/cv`, `/roadmap`, `/review`, `/interview`, `/match`)
3. `runAgent()` heuristic parse → return `{ text, actions }`
4. Optional online: `api.ai.generateCareerAdvice` via user-config provider (atau env fallback)
5. Per-action `ApproveActionCard` — user approve → publish ke `aiActionBus`
6. Slice target (mis. CV generator) subscribe → eksekusi aksi
7. Riwayat simpan ke `chatConversations` (cap 4000 char / 200 msg)

## Scenario 8: AI Settings

1. `/dashboard/ai-settings` → list provider dari `listProviders`
2. User pilih provider, set apiKey + model + baseUrl → `setMine`
3. `testConnection` verify
4. Toggle `enabled` — action AI baca config via `internal.aiSettings._getForUser`
5. Fallback ke env backend `CONVEX_OPENAI_*` kalau `enabled=false`

## Data Flow Overview

```
Browser (Next.js Client)
    │  useQuery / useMutation / useAction
    ▼
Convex WebSocket (wss://<your-convex-backend>)
    │
    ├─ query   → ctx.db (SQLite at-rest)
    ├─ mutation → ctx.db + index update
    └─ action  → external HTTP (OpenAI-compat), rate-limit via rateLimitEvents
```

Tabel utama: `userProfiles`, `cvs`, `jobApplications`, `skillRoadmaps`, `documentChecklists`, `mockInterviews`, `financialPlans`, `careerGoals`, `notifications`, `chatConversations`, `calendarEvents`, `aiSettings`, `rateLimitEvents`, `errorLogs` — plus authTables dari `@convex-dev/auth`.

Full schema: [`../backend.md`](../backend.md).
