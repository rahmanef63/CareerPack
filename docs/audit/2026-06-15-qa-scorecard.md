# CareerPack — QA Scorecard (loop ke 100/100)

> **Dokumen hidup.** "QA alter ego" (review + adversarial re-verify multi-agent)
> menilai; "Builder alter ego" mengerjakan backlog per batch; skor diukur ulang
> tiap putaran. Push ke prod DITAHAN; kerja di branch `qa/loop-to-100`.

**Skor saat ini: 89 / 100** · baseline 83 · iterasi 3 selesai · **batch-4 jalan → target ~92**

> ⚠️ **Plafon jujur (dikonfirmasi QA via source):** ceiling autonom = **~92–93**.
> Sisanya ke 100 **butuh tanganmu, bukan kode**:
> - **ops** (80, capped): restore drill, provider auto-snapshot, Google OAuth Console.
> - **arsitektur** (78): keputusan konsolidasi 4-SSOT route/nav (medium-risk; QA sengaja
>   TIDAK auto-include karena restructure routing butuh sign-off-mu).

## Riwayat skor

| Iterasi | Tanggal | Skor | Catatan |
|---|---|---|---|
| 0 (baseline) | 2026-06-15 | **83** | Audit 9-agent. Headline: fix XSS "C2" masih bisa ditembus. |
| 1 | 2026-06-15 | **85** (+2) | Batch-1 (6 fix) → `dfd8639`. |
| 2 | 2026-06-15 | **86** (+1) | Batch-2 (7 fix) → `bc9fda3`. Dimensi carried jadi penahan. |
| 3 | 2026-06-15 | **89** (+3) | Batch-3 (8 fix) → `ab67dcb`. ux+perf akhirnya disentuh → lompatan terbesar. |

## Scorecard per dimensi (post batch-3)

| Dimensi | Base | Kini | Bobot | Penahan utama |
|---|---|---|---|---|
| Security | 82 | **92** | 20% | edge open-redirect interior-tab, verifySecret empty-salt, plain-Error 2 action, publicLocationShow. |
| Convex backend | 82 | **93** | 19% | ConvexError 2 action inline, createNotification client-callable, toggleResource guard, email index. |
| Frontend (React) | 88 | 91 | 15% | (carry) flush debounce unmount, AISettings dirty, effect deps. |
| UX / a11y / i18n | 82 | **87** | 12% | mock-interview dead buttons + fake "Sedang merekam", sisa prose `text-warning` kontras. |
| Performance | 82 | **87** | 10% | listChatSessions over-fetch, CV preview re-render. |
| Testing / DX | 82 | **92** | 9% | coverage gak di pre-push, .tsx 0/0 coverage, dev.md §8 stale. |
| **Ops / reliability** | 74 | 80 | 9% | **restore drill + snapshot + OAuth (BUTUH AKSIMU)**. |
| Arsitektur | 78 | 78 | 6% | (carry) 4-SSOT route/nav (butuh keputusanmu). |

## Batch-3 — landed & verified (commit `ab67dcb`)

8/8 done, 8/8 verified. Gate: typecheck + lint + **414 test** + build compile (Windows-symlink only). Open-redirect `//`, validasi caps (profile/applications/cv via SSOT `_shared/validate.ts`), ConvexError dari guard+rateLimit, coverage-gate dilebarkan, calibrator time-index `by_time`, aiResolve test, keyboard-a11y 4 komponen, kontras `--warning-text` WCAG. Orchestrator fix `calibrator.test.ts` (withIndex typing yang vitest gak nangkep).

## Batch-4 — dikerjakan sekarang (6 item, semua autonom)

1. **Edge open-redirect interior-whitespace** + dedup 2 sanitizer jadi 1 modul — security.
2. **ConvexError di 4 cek quota/auth inline action** (ai/actions, matcher/external) — convex.
3. **`createNotification` → internalMutation** (matiin self-insert klien) — convex.
4. **Hapus afordans mock-interview palsu** (tombol mati + "Sedang merekam" bohong) — ux.
5. **Migrasi sisa prose `text-warning` → `text-warning-text`** (WCAG) — ux.
6. **`listChatSessions` denormalize messageCount+preview** (stop baca messages[] penuh) — performance.

→ Estimasi QA: security→94, convex→94-95, ux→90, perf→89-90, testing→93 ⇒ **overall ~92**.

## Sisa setelah batch-4 — BUTUH KEPUTUSAN/AKSIMU

**Out-of-code (ops, ~2 poin overall):**
- [ ] Restore drill: restore arsip tar ke volume staging + verifikasi Convex jalan.
- [ ] Provider auto-snapshot: toggle di dashboard VPS.
- [ ] Google OAuth: set env + OAuth client di Google Console (`docs/auth.md` §1b).

**Keputusan arsitektur (~0.2-0.4 poin overall):**
- [ ] Setujui konsolidasi 4-SSOT route/nav? Autonom bisa dikerjain TAPI medium-risk
  (nyentuh routing semua halaman dashboard). Aku tunggu sign-off-mu sebelum eksekusi.

## Protokol loop

Builder per batch di `qa/loop-to-100`, verify adversarial → gate penuh → commit lokal (TANPA push) → QA ukur ulang. **Loop berhenti di plafon autonom (~92)** lalu handoff jujur ke kamu.

## Log progres

- **2026-06-15** — **83** → batch-1 `dfd8639` → **85** → batch-2 `bc9fda3` → **86** → batch-3 `ab67dcb` → **89**. Batch-4 (6 item) jalan → target ~92, lalu stop + handoff (out-of-code + keputusan arsitektur).
