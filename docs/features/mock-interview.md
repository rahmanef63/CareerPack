# Mock Interview

> **Portability tier:** L — slice + Convex module + schema table +
> AI actions + curated Indonesian question bank fallback

## Tujuan

Simulator wawancara: pilih role + difficulty → AI generate
pertanyaan → user jawab → AI evaluasi per jawaban → skor akhir +
feedback STAR. Fallback ke `indonesianInterviewQuestions` (curated
bank) kalau quota AI habis atau action gagal.

## Route & Entry

- URL: `/dashboard/interview`
- Slice: `frontend/src/slices/mock-interview/`
- Komponen utama: `MockInterview.tsx`
- **No manifest yet** — slice belum diregister di `sliceRegistry.ts`;
  nav fallback ke `dashboardRoutes.tsx` + `navConfig.ts` (legacy).

## Struktur Slice

```
mock-interview/
├─ index.ts                                     barrel: MockInterview + types
├─ components/
│  ├─ MockInterview.tsx                         page shell — phase router (setup/in-progress/review)
│  └─ mock-interview/
│     ├─ PracticeSession.tsx                    timer + question card + answer textarea
│     ├─ QuestionBank.tsx                       browse tab — categorized fallback bank
│     └─ SessionCompleteCard.tsx                review state — overall score + per-Q feedback
├─ constants/
│  └─ categories.ts                             interview categories (behavioral/technical/situational)
├─ hooks/
│  └─ useMockSession.ts                         session lifecycle + Convex CRUD + AI calls
└─ types/
   └─ index.ts                                  InterviewSession, InterviewQuestion, InterviewCategory, DifficultyLevel
```

## Data Flow

Backend: tabel `mockInterviews` di `convex/mockInterview/`.

| Hook / call | Convex op | Purpose |
|---|---|---|
| `useMockSession().sessions` | `api.mockInterview.queries.getUserInterviews` | List user's sessions |
| `useMockSession().analytics` | `api.mockInterview.queries.getInterviewAnalytics` | Stats (avg score, count, …) |
| `useMockSession().create` | `api.mockInterview.mutations.createMockInterview` | Init session w/ generated Qs |
| `useMockSession().answer` | `api.mockInterview.mutations.updateInterviewAnswer` | Per-Q answer + feedback |
| `useMockSession().complete` | `api.mockInterview.mutations.completeInterview` | Aggregate overall score |
| `useMockSession().remove` | `api.mockInterview.mutations.deleteInterview` | Hapus session |

AI actions (proxy via `convex/ai/actions.ts`):
- `api.ai.actions.generateInterviewQuestions({ role, difficulty, count })`
  — seed pertanyaan
- `api.ai.actions.evaluateInterviewAnswer({ question, answer, role })`
  — skor + feedback per jawaban (STAR rubric)

Pipeline: `requireQuota` (rate limit 10/min + 100/day) → `sanitizeAIInput`
→ `wrapUserInput` → OpenAI-compatible proxy. Quota habis → action throw,
hook fallback ke `indonesianInterviewQuestions` bank.

Schema:
- `type: string` — convention: `"behavioral" | "technical" | "situational" | "company-specific"`
- `role: string`, `difficulty: string`
- `questions: Array<{ id, question, category, userAnswer?, feedback?, score?, answeredAt? }>`
- `overallScore?: number`, `feedback?: string`, `completedAt?: number`,
  `duration?: number`, `startedAt: number`
- Indexes: `by_user`, `by_user_started`

## State Lokal

- `phase`: `"setup" | "in-progress" | "review"` (also persisted via
  doc state — close tab + reopen = resume)
- `currentQuestionIndex`, timer countdown
- `form.role`, `form.type`, `form.difficulty`

## Dependensi

- `@/shared/data/indonesianData` —
  `indonesianInterviewQuestions`, `indonesianDifficultyLabels`
- `@/shared/components/layout/PageContainer`
- `@/shared/components/ui/responsive-page-header`
- `@/shared/lib/notify` — toast wrapper
- `@/shared/lib/utils` — `cn`
- shadcn primitives: `card`, `tabs`, `progress`, `badge`, `button`,
  `textarea`
- npm: none (Web `setInterval` for countdown)

## Catatan Desain

- Question bank tidak hardcoded di server — fully AI-generated saat
  session create. `indonesianInterviewQuestions` di shared data adalah
  curated fallback bank (dipakai juga di tab "Bank Soal").
- Cost: 1 AI call generate + N call evaluasi per session. Quota
  penting; evaluator panggil sequential (bukan parallel) supaya
  rate-limit tidak meledak.
- Session resume via `phase` persisted di doc — user tutup tab, buka
  lagi, lanjut.

## Extending

- STT (speech-to-text) → mic input → transcribed ke textarea.
  Web Speech API atau Whisper.
- Video recording self-review (lokal, tidak di-upload) — `MediaRecorder`.
- Coach-in-loop: session dishare ke mentor, mentor isi feedback via
  link.
- Add manifest + capability binder (skill `interview.start`,
  `interview.list`).

---

## Portabilitas

**Tier:** L

**Files untuk dicopy:**

```
# Slice itself
frontend/src/slices/mock-interview/

# Shared deps
frontend/src/shared/data/indonesianData.ts            # indonesianInterviewQuestions + difficulty labels
frontend/src/shared/components/layout/PageContainer.tsx
frontend/src/shared/components/ui/responsive-page-header.tsx
frontend/src/shared/lib/notify.ts

# Backend
convex/mockInterview/                                 # queries.ts, mutations.ts, schema.ts
convex/ai/actions.ts                                  # generateInterviewQuestions + evaluateInterviewAnswer
convex/_shared/rateLimit.ts                           # requireQuota (per _porting-guide.md)
convex/_shared/sanitize.ts                            # sanitizeAIInput, wrapUserInput
convex/_shared/aiProviders.ts                         # OpenAI-compat client
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

# Slice
mkdir -p "$DST/frontend/src/slices"
cp -r "$SRC/frontend/src/slices/mock-interview" "$DST/frontend/src/slices/"

# Shared helpers
mkdir -p "$DST/frontend/src/shared/data"
mkdir -p "$DST/frontend/src/shared/lib"
mkdir -p "$DST/frontend/src/shared/components/layout"
mkdir -p "$DST/frontend/src/shared/components/ui"

cp "$SRC/frontend/src/shared/data/indonesianData.ts"                   "$DST/frontend/src/shared/data/"
cp "$SRC/frontend/src/shared/components/layout/PageContainer.tsx"      "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/components/ui/responsive-page-header.tsx" "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/lib/notify.ts"                            "$DST/frontend/src/shared/lib/"

# Backend
cp -r "$SRC/convex/mockInterview" "$DST/convex/"

# AI plumbing (only port if target has not already)
mkdir -p "$DST/convex/_shared"
cp "$SRC/convex/_shared/rateLimit.ts"     "$DST/convex/_shared/"
cp "$SRC/convex/_shared/sanitize.ts"      "$DST/convex/_shared/"
cp "$SRC/convex/_shared/aiProviders.ts"   "$DST/convex/_shared/"

# AI actions module — likely shared with other slices; merge interview-specific
# functions into the target's existing convex/ai/actions.ts rather than overwriting.
```

**Schema additions** — append to target's `convex/schema.ts`:

```ts
mockInterviews: defineTable({
  userId: v.id("users"),
  type: v.string(),                       // behavioral|technical|situational|company-specific
  role: v.string(),
  difficulty: v.string(),
  questions: v.array(v.object({
    id: v.string(),
    question: v.string(),
    category: v.string(),
    userAnswer: v.optional(v.string()),
    feedback: v.optional(v.string()),
    score: v.optional(v.number()),
    answeredAt: v.optional(v.number()),
  })),
  overallScore: v.optional(v.number()),
  feedback: v.optional(v.string()),
  completedAt: v.optional(v.number()),
  duration: v.optional(v.number()),
  startedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_started", ["userId", "startedAt"]),
```

**Convex `api.d.ts`** — add `mockInterview: typeof mockInterview`.
Note module name: `mockInterview` (camelCase folder), so API path is
`api.mockInterview.<file>.<fn>` — keep this in mind when copying.

**npm deps** — none.

**Env vars** (AI proxy):
- `CONVEX_OPENAI_API_KEY` — provider key
- `CONVEX_OPENAI_BASE_URL` — OpenAI-compatible endpoint
(See `_porting-guide.md` §6.)

**Manifest + binder wiring** — N/A: this slice does **not** have
`manifest.ts` or a `Capabilities` binder yet. The seed
`DEFAULT_AI_TOOLS` already lists `interview.startSession` (used by
the older `nav.go`-style agent action), but no slice-manifest skills
exist. Skip the manifest wiring section.

**Nav registration** (legacy):

1. `frontend/src/shared/lib/dashboardRoutes.tsx` — add lazy import
   for `MockInterview` keyed by slug `interview`.
2. `frontend/src/shared/components/layout/navConfig.ts` — add to
   `MORE_APPS` with `href: "/dashboard/interview"`.

**i18n & content** — `indonesianInterviewQuestions` di
`shared/data/indonesianData.ts` (categorized:
behavioral/technical/situational/company-specific) dalam Bahasa
Indonesia. AI prompts di `convex/ai/actions.ts` juga Indonesian
("Anda adalah pewawancara senior…"). Translate / regenerate untuk
target locale.

**Common breakage after port:**

- **AI actions throw 401** — env vars `CONVEX_OPENAI_API_KEY` /
  `CONVEX_OPENAI_BASE_URL` not set. Convex deployment env, not
  Next.js env.
- **Quota errors immediately** — `requireQuota` ledger table empty
  on first run; check `convex/_shared/rateLimit.ts` ledger table
  ported alongside helper.
- **Question generation timeout** — proxy endpoint slow; bump
  Convex action timeout or reduce `count` from 10 → 5.
- **Bank tab empty** — fallback bank lives in
  `indonesianInterviewQuestions`; ensure `shared/data/indonesianData.ts`
  copied.
- **Resume fails** — `mockInterviews` doc must persist
  `currentQuestionIndex`-equivalent state; CareerPack derives this
  from `questions[i].userAnswer` (next unanswered = current). If
  hook diverges, resume breaks.

**Testing the port:**

1. Navigate `/dashboard/interview` → setup form renders
2. Fill role + type + difficulty + count → "Mulai" → AI generates
   questions (or fallback bank used if quota hit)
3. Answer Q1 → submit → AI evaluation appears, score persisted
4. Repeat → "Selesai" → SessionCompleteCard with overall score
5. Reload mid-session → resumes at last unanswered Q
6. Delete session → row removed from history

Run `_porting-guide.md` §9 checklist.
