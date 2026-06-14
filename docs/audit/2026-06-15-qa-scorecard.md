# CareerPack — QA Scorecard (loop ke 100/100) — FINAL

> **Loop selesai.** "QA alter ego" (review + adversarial re-verify multi-agent) menilai;
> "Builder alter ego" mengerjakan backlog per batch; skor diukur ulang tiap putaran.
> Berhenti di **plafon autonom** (dikonfirmasi QA: `loopShouldStop=true`). Semua kerja
> di branch `qa/loop-to-100`; **push ke prod DITAHAN** — kamu yang review & merge.

**SKOR FINAL: 91 / 100** · baseline **83** · **+8** · 4 iterasi, 7 fix-commit, semua terverifikasi adversarial

## Riwayat skor

| Iterasi | Skor | Commit fix | Isi |
|---|---|---|---|
| 0 baseline | **83** | — | Audit 9-agent. Headline: fix XSS "C2" ternyata masih bisa ditembus. |
| 1 | **85** (+2) | `dfd8639` | XSS `>`-in-attr, 2 sink main-origin, IDOR proofStorageId, toast notifikasi, script ops, deployment.md. |
| 2 | **86** (+1) | `bc9fda3` | residual XSS scheme, IP-spoof XFF, Resend webhook, resetPassword DoS, PBKDF2 tests, actionUrl. |
| 3 | **89** (+3) | `ab67dcb` | open-redirect `//`, validasi caps, ConvexError, coverage-gate, calibrator index, aiResolve test, keyboard-a11y, kontras WCAG. |
| 4 | **91** (+2) | `86bd7e3`, `3c95d8c` | edge open-redirect + sanitizer dedup, ConvexError inline, createNotification internalMutation, mock-interview honesty (fake recording + **random score**), prose kontras, listChatSessions denormalize. |

## Scorecard final per dimensi

| Dimensi | Base | **Final** | Bobot | Catatan |
|---|---|---|---|---|
| Security | 82 | **95** | 20% | XSS (semua kelas), IDOR, IP-spoof, webhook, open-redirect ditutup + diverifikasi. Sisa: 3 item low. |
| Convex backend | 82 | **95** | 19% | Validasi SSOT, ConvexError konsisten, internalMutation, ownership lengkap. Sisa: low. |
| Frontend (React) | 88 | 91 | 15% | (carry) flush debounce unmount, AISettings dirty, effect deps. |
| UX / a11y / i18n | 82 | **90+** | 12% | keyboard-a11y, kontras WCAG, mock-interview jujur. Sisa: low. |
| Performance | 82 | **91** | 10% | calibrator deterministic, listChatSessions ramping, salary honest. Sisa: CV preview memo. |
| Testing / DX | 82 | **94** | 9% | +130 test (447 total), PBKDF2+aiResolve di-test, coverage-gate dilebarkan. |
| **Ops / reliability** | 74 | **80** | 9% | **CAPPED — butuh aksimu** (lihat punch-list). |
| Arsitektur | 78 | **78** | 6% | **butuh keputusanmu** (4-SSOT routing). |

Gate tiap batch: `pnpm typecheck` + `pnpm lint` + `pnpm exec vitest run` (**447 ijo**) + `next build` (compile + SSG 14/14; gagal cuma di copy standalone karena symlink Windows — lolos di Linux/Dokploy).

---

## 🔴 PUNCH-LIST UNTUK KAMU — jarak 91 → ~95 (butuh tangan/keputusan manusia)

QA konfirmasi ini **tidak bisa autonom**. Estimasi gain dari QA:

1. **[ops] Restore drill** (~+0.3-0.5 overall). Ambil backup volume Convex, **restore beneran** ke environment buang, pastikan data balik utuh. Backup cron udah jalan (`docs/db-backup.md`), tapi backup yang belum pernah di-restore = belum terbukti. → butuh SSH ke prod + spin staging + judgment "data benar".
2. **[ops] Provider auto-snapshot** (~+0.2-0.3 overall). Aktifkan snapshot otomatis di dashboard VPS (backup level-infra, independen dari tar cron). → aksi billing/console pakai akunmu.
3. **[security] Google OAuth Console** (~+0-1 overall). Selesaikan OAuth client + redirect URI prod + consent screen di Google Cloud Console (doc 2026-06-11 udah ada). → kredensial Google-mu, additive (auth sekarang udah aman).
4. **[arsitektur] Keputusan 4-SSOT routing** (~+0.25-0.5 overall). Putusin: konsolidasi `DASHBOARD_VIEWS` + `navConfig` + catch-all + admin-guard jadi satu sumber, ATAU terima duplikasi secara formal. Bisa dieksekusi autonom TAPI medium-risk (nyentuh routing semua halaman) — **butuh arahanmu dulu**. Ini lever tunggal terbesar (arsitektur dimensi terendah).

---

## 🟡 SISA AUTONOM (low/medium — diminishing returns, buat sesi lain kalau mau)

QA `remainingAutonomous` (semua in-stack, gak nahan plafon banyak):
- [perf] Memoize CV live-preview (React.memo + useDeferredValue) — re-render tiap ketik. (M)
- [perf] Harden 6 query super-admin analytics (unbounded `.collect()`, termasuk chatConversations dgn messages[]) → index/take/aggregator. (M)
- [testing] Enforce coverage di pre-push (`--coverage`) — sekarang threshold cuma kepicu di `test:coverage` manual. (S)
- [convex] Caps di `updateApplicationStatus`/`addInterviewDate`, `toggleResource` touched-guard, by_email index. (S-M)
- [security] `verifySecret` empty-salt TypeError guard; `publicLocationShow` toggle privasi; dedup literal 500 URL cap. (S)
- [ux] Satu string auth Indonesia kanonik ("Tidak terautentikasi" vs "Sesi Anda berakhir"). (S)
- [perf] Render/buang `lastMessagePreview` (disimpan tapi belum dipakai UI). (S)
- [docs] `development.md` §8 "3 file, 18 test" → 38 file / 447 test. (S)

## Cara lanjut

- **Review branch:** `git log --oneline main..qa/loop-to-100` (7 fix + 5 scorecard commit).
- **Merge kalau oke** → lalu push (push memicu auto-deploy Convex via pre-push hook — itu kenapa aku tahan).
- **Atau** minta aku eksekusi item sisa-autonom tertentu / keputusan arsitektur kalau kamu udah pilih arah.

## Log

- **2026-06-15** — **83 → 85 → 86 → 89 → 91** (4 iterasi). Loop berhenti di plafon autonom (QA `loopShouldStop=true`). 100 butuh 4 item human-gated di punch-list. Branch `qa/loop-to-100`, push ditahan.
