# CareerPack — QA Scorecard (loop ke 100/100)

> **Dokumen hidup.** "QA alter ego" (review + adversarial re-verify multi-agent)
> menilai; "Builder alter ego" mengerjakan backlog per batch; skor diukur ulang
> tiap putaran. Push ke prod DITAHAN; kerja di branch `qa/loop-to-100`.

**Skor saat ini: 86 / 100** · baseline 83 · iterasi 2 selesai

> ⚠️ **Plafon jujur:** dimensi **ops** mentok ~80 karena 3 item **butuh
> tanganmu, bukan kode** — restore drill, provider auto-snapshot, Google OAuth
> Console. Plus arsitektur (4-SSOT route/nav) butuh keputusanmu (medium-risk).
> Artinya **100 autonom tidak tercapai secara matematis**; plafon realistis
> autonom ~92–94. Sisanya nunggu aksi manualmu (lihat "Out-of-code" di bawah).

## Riwayat skor

| Iterasi | Tanggal | Skor | Catatan |
|---|---|---|---|
| 0 (baseline) | 2026-06-15 | **83** | Audit 9-agent. Headline: fix XSS "C2" masih bisa ditembus (`>`-in-attr). |
| 1 | 2026-06-15 | **85** (+2) | Batch-1 (6 fix verified) → commit `dfd8639`. QA nemu residual XSS baru + klaim auto-deploy palsu di dev/README. |
| 2 | 2026-06-15 | **86** (+1) | Batch-2 (7 fix verified): residual XSS scheme, IP-spoof, Resend webhook, resetPassword DoS, PBKDF2 tests, actionUrl, docs → commit `bc9fda3`. Naik +1 karena dimensi carried (arsitektur/ux/perf/ops) jadi penahan utama; QA nemu open-redirect `//` baru. |

## Scorecard per dimensi (post batch-2)

| Dimensi | Base | Kini | Bobot | Penahan utama |
|---|---|---|---|---|
| Security | 82 | **90** | 20% | open-redirect `//` (batch-3), resetPassword throttle (butuh httpAction), publicLocationShow. |
| Convex backend | 82 | **88** | 19% | validasi createOrUpdateProfile/createApplication/updateCV, ConvexError vs plain Error, aggregator scaling. |
| Frontend (React) | 88 | 91 | 15% | (carry) flush debounce unmount, AISettings dirty, effect deps. |
| UX / a11y / i18n | 82 | 82 | 12% | (carry → batch-3) keyboard-a11y card/header, kontras `text-warning`, mock-interview dead buttons. |
| Performance | 82 | 82 | 10% | (carry → batch-3) calibrator `.take()` non-time-ordered, salary window, listChatSessions. |
| Testing / DX | 82 | **90** | 9% | coverage-gate include sempit (batch-3), aiResolve test (batch-3). |
| **Ops / reliability** | 74 | 80 | 9% | **restore drill + provider snapshot (BUTUH AKSIMU)**, dok restore beda. |
| Arsitektur | 78 | 78 | 6% | (carry) 4 SSOT route/nav tumpang-tindih (medium-risk, butuh keputusan). |

## Batch-2 — landed & verified (commit `bc9fda3`)

7/7 done, 7/7 verified. Gate: typecheck + lint + **363 test** ijo. Residual XSS scheme ditutup, IP-spoof XFF, Resend webhook unsigned-reject, resetPassword DoS amplifier dihapus, PBKDF2 di-extract+test (byte-identik), actionUrl allowlist, doc dev/README. Orchestrator fix 1 type-narrowing (`BufferSource`) match idiom `passwordReset.ts`.

## Batch-3 — dikerjakan sekarang (8 item)

QA-pilih (6) + augmentasi ux (2) buat gerakin dimensi penahan:

1. **Open-redirect `//` & `/\`** di `sanitizeUrl` + `sanitizeActionUrl` — security HIGH.
2. **Validasi caps** `createOrUpdateProfile` + `createApplication` + `updateCV` — convex HIGH.
3. **ConvexError (bukan plain Error)** dari guard + rate limiter — convex (UX/i18n).
4. **Lebarkan coverage-gate include** ke dir yang ada test — testing HIGH.
5. **Calibrator prefer-recent + salary window honesty** — performance.
6. **Test `aiResolve.ts`** (4 jalur kredensial) — testing.
7. **Generalisir keyboard-a11y** (SectionCard/RoadmapNode/QuestionBank/PBSection) — ux. [augment]
8. **Gelapkan token `--warning` text** (WCAG 1.4.3) — ux. [augment]

## Backlog tersisa (20) — kandidat batch berikut

Security: resetPassword throttle (httpAction), publicLocationShow, crypto empty-salt edge. Convex: aggregator/cleanup/digest unbounded collect, engine aggregates, toggleResource guard, email index. Frontend: flush debounce unmount, AISettings dirty, effect deps, Date.now ids. UX: mock-interview dead buttons + fake "Sedang merekam". Perf: listChatSessions over-fetch, CV preview re-render. Arsitektur: 4 SSOT route/nav. Docs: dev.md §8 stale count, test flake robustness.

**Out-of-code (BUTUH TANGANMU — nahan skor):** restore drill (ops), provider auto-snapshot (ops), Google OAuth Console (auth). Ini plafon ke 100.

## Protokol loop

Builder per batch di `qa/loop-to-100`, tiap fix verify adversarial → gate penuh → commit lokal (TANPA push) → QA ukur ulang → batch berikut. Sampai plafon autonom (~92-94) atau kamu kerjain out-of-code.

## Log progres

- **2026-06-15** — Baseline **83** → batch-1 (`dfd8639`) → **85** → batch-2 (`bc9fda3`) → **86**. Batch-3 (8 item) dilempar ke Builder. Plafon autonom ~92-94 karena out-of-code ops items.
