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

Convex: tabel `mockInterviews` via `convex/interviews.ts`.

| Operasi | Convex op |
|---|---|
| List session user | `api.interviews.getUserInterviews` |
| Create new session | `api.interviews.createMockInterview` |
| Update answer (per Q) | `api.interviews.updateInterviewAnswer` |
| Complete + agregasi skor | `api.interviews.completeInterview` |
| Stats | `api.interviews.getInterviewAnalytics` |
| Delete | `api.interviews.deleteInterview` |

AI action (proxy via `convex/ai.ts`):
- `api.ai.generateInterviewQuestions({ role, difficulty, count })` — seed pertanyaan
- `api.ai.evaluateInterviewAnswer({ question, answer, role })` — skor + feedback per jawaban

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
