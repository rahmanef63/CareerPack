# CareerPack — QA Scorecard (loop ke 100/100) — FINAL

> **Loop berhenti.** Mentok di **dua** batas sekaligus: (1) plafon autonom nyata
> (sisa kerja butuh tanganmu), dan (2) **session usage limit** (reset 08:10
> Asia/Makassar) — re-QA putaran terakhir (rescore-5) gagal jalan karena limit.
> Semua kerja aman & ke-commit di branch `qa/loop-to-100`; **push DITAHAN**.

**SKOR: ~92 / 100** · baseline **83** · **+9** · 5 batch fix, semua gate-green
_(angka 92 = ESTIMASI dari hasil verifier batch-5 yang sudah selesai; rescore-5 formal keblok limit — 91 adalah angka terverifikasi terakhir, batch-5 nambah ~+1)._

## Riwayat skor

| Iter | Skor | Commit fix | Inti |
|---|---|---|---|
| 0 | **83** | — | Audit 9-agent. |
| 1 | **85** | `dfd8639` | XSS attr, sinks, IDOR, toast, ops, docs. |
| 2 | **86** | `bc9fda3` | residual XSS scheme, IP-spoof, webhook, resetPassword, PBKDF2, actionUrl. |
| 3 | **89** | `ab67dcb` | open-redirect, validasi, ConvexError, coverage, calibrator, aiResolve, a11y, kontras. |
| 4 | **91** | `86bd7e3`, `3c95d8c` | sanitizer dedup, internalMutation, mock-interview honesty. |
| 5 | **~92** (est) | `e5d87f1` | CV-preview memo, admin-analytics O(1), coverage-gate enforce, validasi convex, security hardening, **arsitektur dead-code cleanup**, restore-docs. |

## Scorecard per dimensi (post batch-5; * = estimasi, rescore-5 keblok limit)

| Dimensi | Base | Kini | Bobot |
|---|---|---|---|
| Security | 82 | **95** | 20% |
| Convex backend | 82 | **95** | 19% |
| Frontend (React) | 88 | 91 | 15% |
| Performance | 82 | **~94** * | 10% |
| UX / a11y / i18n | 82 | 90 | 12% |
| Testing / DX | 82 | **~95** * | 9% |
| **Ops / reliability** | 74 | **~82** * | 9% |
| Arsitektur | 78 | **~87** * | 6% |

Batch-5 verifier: **6/7 hold**; #3 (coverage-gate) benar kecuali angka doc salah → aku fix ke 40 file/463 test. Arsitektur cleanup terbukti **zero runtime consumer** + live routing byte-unchanged + tsc ijo.

## Batch-5 — landed & verified (commit `e5d87f1`, 58 file)

1. ✅ [perf] CV live-preview memo (React.memo + useDeferredValue; export baca LIVE).
2. ✅ [perf/convex] Analytics super-admin baca adminStats O(1); chatConversations lepas dari reactive path; tabel besar di-bound + flag truncated.
3. ✅ [testing] Pre-push jalanin `test:coverage` (threshold beneran nge-gate push) + doc count 40/463.
4. ✅ [convex] Caps app-status/interview-date, toggleResource guard, email index, string auth kanonik.
5. ✅ [security] `verifySecret` empty-salt guard, **`publicLocationShow`** toggle (location default HIDDEN), dedup `MAX_URL_LEN`.
6. ✅ [arsitektur] Hapus field manifest route/nav mati + `NAV_PRIMARY`/`NAV_MORE`; docstring + CLAUDE.md jujur (manifest = AI skill catalog only).
7. ✅ [ops] Rekonsiliasi prosedur restore (tar-volume kanonik).

> ⚠️ **Behavior change batch-5:** profil publik yang sudah ada → lokasinya **tersembunyi** sampai user opt-in `publicLocationShow` (privacy-positive). Kalau mau kembaliin visibilitas lama, backfill `publicLocationShow: true`.

---

## 🔴 Jarak ~92 → 100 = HANYA yang butuh KAMU (gak bisa autonom)

1. **[ops] Restore drill** — restore backup ke staging, pastiin data utuh (butuh SSH prod + judgment). ~+0.5
2. **[ops] Provider auto-snapshot** — toggle di dashboard VPS (billing/akunmu). ~+0.3
3. **[security] Google OAuth Console** — OAuth client + redirect URI prod (akun Google-mu). ~+0-1
4. **[arsitektur] Keputusan restructure 4-SSOT routing** — konsolidasi penuh ATAU terima duplikasi. Dead-code-nya udah aku bersihin; restructure penuh = keputusan desainmu (medium-risk, nyentuh routing semua halaman). ~+0.3-0.5

## 🟡 Sisa autonom — TRIVIAL (sub-0.3 poin, gak layak 1 batch penuh)

- matcher/actions.ts + engine/plan/actions.ts masih "Sesi Anda berakhir" (cv udah kanonik) — kosmetik.
- roadmap/mutations.ts punya `MAX_URL_LEN` sendiri (domain lain) — kosmetik.
- aggregator chatConversations cron memory (acceptable; Convex gak punya column projection).
- `.tsx` 0/0 coverage (limitasi v8/rolldown import-type, pre-existing).

## Cara lanjut
- Review: `git log --oneline main..qa/loop-to-100` (**6 fix + 5 scorecard commit**).
- Merge kalau oke → push (push = auto-deploy Convex prod via pre-push hook; sengaja aku tahan).
- Atau pas limit reset (08:10) & kamu mau: minta aku jalanin rescore-5 formal buat angka presisi, atau kerjain restructure routing begitu kamu pilih arah.

## Log
- **2026-06-15** — **83 → 85 → 86 → 89 → 91 → ~92** (5 batch). Loop berhenti: plafon autonom + session limit (reset 08:10). 100 butuh 4 item human-gated di atas. Branch `qa/loop-to-100`, push ditahan.
