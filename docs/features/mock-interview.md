# Mock Interview

## Tujuan

Simulator wawancara: pilih role + difficulty → generate pertanyaan via AI → user jawab → AI evaluasi per jawaban → skor akhir + feedback.

## Route & Entry

- URL: `/dashboard/interview`
- Slice: `frontend/src/slices/mock-interview/`
- Komponen utama: `MockInterview.tsx`

## Struktur Slice

```
mock-interview/
├─ index.ts
├─ components/MockInterview.tsx
└─ types/index.ts        InterviewSession, InterviewQuestion, InterviewCategory, DifficultyLevel
```

## Data Flow

Convex: tabel `mockInterviews` via `convex/mockInterview/`.

| Operasi | Convex op |
|---|---|
| List session user | `api.mockInterview.queries.getUserInterviews` |
| Create new session | `api.mockInterview.mutations.createMockInterview` |
| Update answer (per Q) | `api.mockInterview.mutations.updateInterviewAnswer` |
| Complete + agregasi skor | `api.mockInterview.mutations.completeInterview` |
| Stats | `api.mockInterview.queries.getInterviewAnalytics` |
| Delete | `api.mockInterview.mutations.deleteInterview` |

AI action (proxy via `convex/ai/actions.ts`):
- `api.ai.actions.generateInterviewQuestions({ role, difficulty, count })` — seed pertanyaan
- `api.ai.actions.evaluateInterviewAnswer({ question, answer, role })` — skor + feedback per jawaban

Kedua action lewat `requireQuota` (rate limit AI minute+day) + `sanitizeAIInput` + `wrapUserInput`.

## State Lokal

- `phase`: `"setup" | "in-progress" | "review"`
- `currentQuestionIndex`, timer countdown
- `form.role`, `form.type`, `form.difficulty`

## Dependensi

- `useAuth`, rate-limit via backend action
- shadcn: `card`, `button`, `textarea`, `progress`, `select`, `badge`
- Countdown via `setInterval` + `useEffect` cleanup

## Catatan Desain

- Question bank bukan hardcoded — fully AI generated. Alasan: coverage tanpa curation manual, tapi cost per session = 1 AI call untuk generate + N call untuk evaluasi. Quota penting.
- Session resume didukung via `phase` persisted di doc — user tutup tab, buka lagi, lanjut.

## Extending

- STT (speech-to-text) → mic input → transcribed ke textarea. Pakai Web Speech API atau Whisper.
- Video recording untuk self-review (lokal, tidak di-upload) — butuh `MediaRecorder` API.
- Coach-in-loop: session dishare ke mentor, mentor isi feedback via link.

---

## Portabilitas

**Tier:** L — slice + Convex module + schema + hardcoded Indonesian question bank.

**Files:**

```
frontend/src/slices/mock-interview/
frontend/src/shared/data/indonesianData.ts              # indonesianInterviewQuestions
convex/mockInterview/
```

**cp:**

```bash
SRC=~/projects/CareerPack DST=~/projects/<target>
cp -r "$SRC/frontend/src/slices/mock-interview"     "$DST/frontend/src/slices/"
cp "$SRC/frontend/src/shared/data/indonesianData.ts" "$DST/frontend/src/shared/data/"
cp "$SRC/convex/mockInterview/"                       "$DST/convex/"
```

**Schema:** add `mockInterviews` table (`type`, `role`, `difficulty`, `questions[]`, `overallScore?`, `duration?`, `startedAt`) + `by_user`, `by_user_started` indexes.

**Convex api.d.ts:** add `interviews: typeof interviews`.

**npm deps:** none.

**Nav:** `interview` slug in MORE_APPS.

**i18n & content:** `indonesianInterviewQuestions` categorized (behavioral/technical/situational/company-specific) in Indonesian. Translate or regenerate for target.

See `_porting-guide.md`.
