# Dual-Agent Tasklist — Known Work Remaining

Last updated: 2026-04-20. Status: draft (Agent A owns this doc).

Dua Claude agent eksekusi paralel lima pekerjaan tersisa dari [`../progress.md`](../progress.md). Split by **domain** (backend vs frontend) supaya konflik file minimal. Doc ini jadi satu-satunya SSOT untuk handoff.

## Split

| Track | Agent | Fokus | Branch |
|---|---|---|---|
| Backend + admin wire | **A** | `convex/**`, `slices/admin/**` | `agent-a/backend-admin-forgot` |
| Frontend features | **B** | `slices/settings/**`, `slices/cv-generator/**`, `app/(marketing)/forgot-password/**`, `app/(marketing)/reset-password/[token]/**`, `slices/auth/**` | `agent-b/profile-pdf-forgot-ui` |

Pisahan file ketat — kalau keduanya butuh edit file yang sama, dokumentasikan di bagian [Konflik potensial](#konflik-potensial) dan satu tunggu.

## Shared contracts (LOCK sebelum koding)

Kedua agent harus pakai signature ini apa adanya. Kalau perlu ubah, update doc ini dulu + notify agent lain.

### 1. `userProfiles.role`

```ts
role: v.optional(v.union(v.literal("admin"), v.literal("moderator"), v.literal("user")))
```

Default = `"user"` kalau field absent. Admin manual set via Convex dashboard (pertama kali) atau `api.admin.updateUserRole` setelahnya.

### 2. `api.admin.*`

```ts
// query
api.admin.getGlobalStats() → {
  totalUsers: number,
  activeUsers: number,          // activity in last 30d (signed in / mutated)
  totalCVs: number,
  totalApplications: number,
  aiUsage: { totalRequests: number, totalTokens: number, lastMonth: number },
}

// query — paginated
api.admin.listAllUsers({ cursor?: string, limit?: number }) → {
  page: Array<{ _id, email, name, role, createdAt, lastActiveAt?: number }>,
  continueCursor: string | null,
  isDone: boolean,
}

// query — paginated, newest first
api.admin.viewErrorLogs({ cursor?, limit?, source? }) → same paginated shape

// mutation
api.admin.updateUserRole({ userId: Id<"users">, role: "admin"|"moderator"|"user" }) → void
```

Semua gated `requireAdmin(ctx)`. Error lempar `"Bukan admin"`.

### 3. `api.passwordReset.*`

```ts
// mutation — always returns success shape (no enumeration leak)
api.passwordReset.requestReset({ email: string })
  → { ok: true }   // token tersimpan server-side; email delivery out of scope V1

// mutation
api.passwordReset.resetPassword({ token: string, newPassword: string })
  → { ok: true }
  // throws "Token tidak valid atau sudah kedaluwarsa" kalau gagal
```

Token: 32-byte random → URL-safe base64. Hash pakai scheme sama dengan password (`pbkdf2v2_<salt>_<hash>`) — disimpan di tabel `passwordResetTokens`. TTL 30 menit, single-use.

**V1 delivery:** tidak kirim email — agent A log token ke `errorLogs` dengan `source="password-reset"` untuk dev. Link template: `/reset-password/<token>`. V2 integrate Resend/SMTP (out of scope tasklist ini).

## Task Matrix

### Agent A

| ID | Task | File utama | Blocks | Status |
|---|---|---|---|---|
| A1 | Add `role` field ke `userProfiles` | `convex/schema.ts` | A2, A3 | ✅ done (`a51b42f`) |
| A2 | `requireAdmin(ctx)` helper | `convex/_lib/auth.ts` | A3 | ✅ done (`a494422`) |
| A3 | `convex/admin.ts` — 4 endpoint | `convex/admin.ts` (baru) | A4 | ✅ done (`9103eb8`) |
| A4 | Wire `AdminDashboard` ke real query | `slices/admin/components/AdminDashboard.tsx` | — | ✅ done (`a57d696`) |
| A5 | Forgot-password backend | `convex/schema.ts`, `convex/passwordReset.ts` (baru) | B2 | ✅ done (`5667690`) — **B2 unblocked setelah agent-a merge ke main** |

### Agent B

| ID | Task | File utama | BlockedBy | Status |
|---|---|---|---|---|
| B1 | Profile editor card di TweaksPanel | `slices/settings/components/TweaksPanel.tsx` | — | ✅ done (`f87d053`, originally `3487d85` by Agent B, cherry-picked ke agent-a saat konsolidasi single-agent) |
| B2 | Forgot-password UI | `app/(marketing)/forgot-password/page.tsx`, `app/(marketing)/reset-password/[token]/page.tsx`, `slices/auth/components/LoginPage.tsx` | A5 | ✅ done (Agent A setelah dual-agent digabung) |
| B3 | PDF export CV Generator | `slices/cv-generator/components/CVGenerator.tsx`, `package.json` | — | ✅ done (`5ff1703`, originally `d633651` by Agent B, cherry-picked) |

### Single-agent consolidation note

Setelah B1 + B3 selesai oleh sesi Agent B, user memutuskan pivot ke single-agent. Komitmen Agent B (`3487d85`, `d633651`) di-cherry-pick ke branch `agent-a/backend-admin-forgot` supaya satu branch tunggal lolos ke PR. Branch `agent-b/profile-pdf-forgot-ui` tidak perlu di-merge terpisah — sudah ter-replay via cherry-pick.

## Urutan eksekusi

```
A1 ─→ A2 ─→ A3 ─→ A4
           │
A5 ────────┘        ─→ B2
B1 (independent)
B3 (independent)
```

Agent A kerja serial A1→A2→A3→A4, dan parallel di A5.
Agent B mulai B1 + B3 segera (zero blockers), baru B2 setelah A5 merged.

## Konflik potensial

- `convex/schema.ts` — hanya A edit (A1 + A5). B jangan sentuh.
- `slices/auth/components/LoginPage.tsx` — B edit sekali (B2 tambah link). A tidak sentuh.
- `docs/features/*.md` — masing-masing edit doc slice-nya sendiri:
  - A: `admin.md`
  - B: `settings.md`, `auth.md`, `cv-generator.md`
- `docs/progress.md` — A update setelah A1-A5 done; B update setelah B1-B3 done. Appending only — rebase kalau bentrok.

## Handoff protocol

1. Tiap task done → commit dengan prefix `[agent-a]` atau `[agent-b]` di body (subject tetap conventional).
2. PR ke main — judul format `{feat|fix|refactor}(<scope>): <ringkas>`. Isi PR body referensi task ID (A1/B2/…).
3. Setelah A5 merge ke main, Agent A update tasklist ini: tick checkbox + unblock B2.
4. Dokploy auto-deploy main — jangan push ke main tanpa `/ship` kecuali user eksplisit minta.

## Prompts untuk tiap agent

Copy-paste blok di bawah utuh ke sesi Claude baru. Konteks project ada di `CLAUDE.md` root — agent harus baca itu dulu.

### Prompt Agent A

```
You are Agent A on the CareerPack project (Next.js 15 + Convex).

Read first:
- CLAUDE.md
- docs/roadmap/dual-agent-tasklist.md
- docs/backend.md (skim)
- docs/features/admin.md
- docs/features/auth.md

Your scope is Agent A tasks A1–A5 in the tasklist. Execute A1→A2→A3→A4 serially, then A5. For each task: read the contract in §"Shared contracts", implement in the named files only, run `pnpm typecheck` + `pnpm lint` before committing. Use `pnpm backend:dev-sync` (not `backend:dev`) to regenerate types — backend:dev runs a watcher.

Hard rules:
- Do NOT edit any frontend file outside `slices/admin/**`. B owns the rest.
- `convex/schema.ts` additions are additive-optional — never drop or rename fields.
- Admin queries must use pagination (Convex `.paginate()`), never `.collect()` on users/errorLogs.
- No email delivery in A5 — log token to `errorLogs` source="password-reset" for dev; B2 renders the link manually in V1.
- Each task = one commit, conventional format, prefix `[agent-a]` in the body.
- Do NOT push to main without explicit user approval. Work on branch `agent-a/backend-admin-forgot`.

When you finish A5, update docs/roadmap/dual-agent-tasklist.md: tick A1-A5 in the matrix and tell the user B2 is now unblocked.
```

### Prompt Agent B

```
You are Agent B on the CareerPack project (Next.js 15 + Convex).

Read first:
- CLAUDE.md
- docs/roadmap/dual-agent-tasklist.md
- docs/features/settings.md
- docs/features/cv-generator.md
- docs/features/auth.md

Your scope is Agent B tasks B1–B3. Start B1 + B3 immediately (no blockers). Do not start B2 until `api.passwordReset.*` is available on main (Agent A task A5). Check `git log origin/main --grep=A5` before starting B2.

Hard rules:
- Do NOT edit `convex/**` — A owns backend. You consume the generated types from `convex/_generated/api`.
- Do NOT edit any file under `slices/admin/**`.
- B1: new profile card in TweaksPanel.tsx — wire to `api.users.createOrUpdateProfile` + `api.users.getCurrentUser`. Fields defined in the mutation args in `convex/users.ts`. Use shadcn `input`, `textarea`, `badge` for skills/interests chips.
- B2: two new pages under `app/(marketing)/`. Add "Lupa password?" link below password field in `LoginPage.tsx`. Reset page reads `[token]` from route params.
- B3: prefer `html2pdf.js` (smallest deps, text-selectable output). Export button inside the existing preview Dialog in CVGenerator.tsx — do NOT break the Ctrl+P print flow.
- Each task = one commit, conventional format, prefix `[agent-b]` in the body.
- Do NOT push to main without explicit user approval. Work on branch `agent-b/profile-pdf-forgot-ui`.
- Run `pnpm typecheck && pnpm lint && pnpm test` before every commit. Stop-hook will re-run anyway.
```

## Update cadence

- Agent A owns this doc. Setelah checkbox di [Task Matrix](#task-matrix) berubah, commit update.
- Agent B baca ulang doc ini sebelum mulai B2 untuk verifikasi contract tidak berubah.
- User bisa interject kapan saja — agent stop, read instruction, resume.
