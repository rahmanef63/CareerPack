# CareerPack — QA Scorecard (loop ke 100/100)

> **Dokumen hidup.** "QA alter ego" (review + adversarial re-verify multi-agent)
> menilai; "Builder alter ego" mengerjakan backlog per batch; skor diukur ulang
> tiap putaran. Tujuan: 100/100 — atau penilaian jujur kalau mentok. Push ke prod
> DITAHAN; kerja di branch `qa/loop-to-100`.

**Skor saat ini: 85 / 100** · baseline 83 (2026-06-15) · iterasi 1 selesai

## Riwayat skor

| Iterasi | Tanggal | Skor | Catatan |
|---|---|---|---|
| 0 (baseline) | 2026-06-15 | **83** | Audit awal 9-agent. Headline: fix XSS "C2" ternyata masih bisa ditembus (`>` di dalam attribute). |
| 1 | 2026-06-15 | **85** (+2) | Batch-1 (6 fix, semua terverifikasi adversarial): bypass sanitizer `>`-in-attr, 2 sink XSS main-origin, IDOR `proofStorageId`, toast notifikasi, script ops, `deployment.md`. Commit `dfd8639`. QA nemu **residual XSS BARU** (skema URL whitespace-split) + klaim auto-deploy palsu masih di `development.md`/`README.md` → naik cuma +2. Backlog → 29. |

## Scorecard per dimensi (post batch-1)

| Dimensi | Baseline | Kini | Bobot | Status |
|---|---|---|---|---|
| Security | 82 | **86** | 20% | XSS `>`-attr + 2 sink + IDOR ditutup; sisa: residual XSS whitespace-scheme, XFF spoof, Resend webhook, resetPassword. |
| Convex backend | 82 | **85** | 19% | `proofStorageId` IDOR ditutup; sisa: validasi 3 tabel, aggregator scaling, actionUrl, dll. |
| Frontend (React) | 88 | **91** | 15% | Toast notifikasi beres; sisa: flush debounce unmount, AISettings dirty, dll. |
| UX / a11y / i18n | 82 | 82 | 12% | (carry) keyboard-a11y, kontras warning, mock-interview. |
| Performance | 82 | 82 | 10% | (carry) listChatSessions over-fetch, preview CV re-render. |
| Testing / DX | 82 | **86** | 9% | +19 test (sanitizer regresi + IDOR guard); sisa: test PBKDF2 + `aiResolve`, coverage-gate. |
| **Ops / reliability** | 74 | **80** | 9% | Script ops + `deployment.md` ke-commit; sisa: **restore drill (butuh akses host)**, provider snapshot, dok restore beda. |
| Arsitektur | 78 | 78 | 6% | (carry) 4 SSOT route/nav, field manifest dead-code. |

## Batch-1 — landed & verified (commit `dfd8639`)

6/6 done, 6/6 verified `holds=true`. Gate: typecheck + lint + **313 test** ijo; `next build` compile + SSG 14/14 (gagal cuma di copy standalone karena symlink Windows — lolos di Linux/Dokploy).

1. ✅ Sanitizer `>`-in-attribute bypass + 16 test regresi (kelas `>`-in-attr ditutup).
2. ✅ 2 sink XSS main-origin (BlockRenderer dead-code dihapus, iconHtml di-allowlist, postMessage di-pin).
3. ✅ `assertOwnedStorages` di `proofStorageId` + 3 IDOR guard test.
4. ✅ Toast palsu notifikasi (withMutationToast + .catch).
5. ✅ Script `health-watch.sh` + `install-cron.sh` ke-commit.
6. ✅ `deployment.md` (auto-deploy palsu / `:latest` / SQLite) + `.env.example` pin.

## Batch-2 — dikerjakan sekarang (7 item)

1. **Residual XSS: skema URL whitespace-split** (`java\tscript:`) — `helpers.ts` + test. (HIGH — sink sama, di-flag 3 dimensi)
2. **Rate-limit IP spoof: ambil hop XFF paling kanan**, bukan `[0]` — `clientIp.ts` + test + caller. (HIGH)
3. **Sanitasi `createNotification.actionUrl`** via allowlist URL — `notifications/mutations.ts`. (med)
4. **Gate `resetPassword` + bound legacy `.collect()`** — `passwordReset.ts`. (med, hati-hati: mutation gak punya IP)
5. **Test PBKDF2 `hashSecret`/`verifySecret`** — `auth.ts` + test. (testing — ekstrak ke modul pure tanpa ubah algoritma)
6. **Tolak insert row webhook Resend unsigned** — `admin/webhooks.ts`. (security)
7. **Klaim auto-deploy palsu di `development.md` + `README.md`** (mirror fix `deployment.md`). (docs)

## Backlog tersisa (29) — kandidat batch berikut

Security: residual XSS scheme (→batch-2), XFF spoof (→batch-2), Resend webhook (→batch-2), resetPassword gate (→batch-2), `publicLocationShow` gate. Convex: validasi jobApplications/cvs/profile-create, aggregator/cleanup/digest unbounded collect, engine aggregates `.take()`, `toggleResource` guard, `actionUrl` (→batch-2), ConvexError consistency, email index. Frontend: flush debounce unmount, AISettings dirty, effect deps, Date.now ids. UX: keyboard-a11y, kontras warning, mock-interview dead buttons. Perf: listChatSessions, preview CV. Testing: PBKDF2 (→batch-2) + aiResolve test, coverage-gate. Arsitektur: 4 SSOT route/nav.

**Out-of-code (butuh tanganmu):** restore drill, provider auto-snapshot, Google OAuth Console. Ini nahan skor ops di ~80 sampai dikerjain manual.

## Protokol loop

Builder per batch di branch `qa/loop-to-100`, tiap fix di-verify adversarial → gate penuh → commit lokal (TANPA push) → QA ukur ulang → baris baru di Riwayat skor → batch berikut. Lanjut sampai 100/100 atau plateau jujur.

## Log progres

- **2026-06-15** — Baseline **83**. Batch-1 (6 item) landed + verified, commit `dfd8639`. Re-QA: **85** (+2). Batch-2 (7 item) dilempar ke Builder.
