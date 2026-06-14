# CareerPack — QA Scorecard (loop ke 100/100)

> **Dokumen hidup.** Dibuat oleh "QA alter ego" (review multi-dimensi 9 agent,
> adversarial-verify fix 2026-06-11). "Builder alter ego" mengerjakan backlog
> per batch; skor diukur ulang tiap putaran. Tujuan: 100/100 — atau penilaian
> jujur kalau mentok. Push ke prod DITAHAN; kerja dilakukan di branch
> `qa/loop-to-100`.

**Skor saat ini: 83 / 100** · baseline 2026-06-15

## Riwayat skor

| Iterasi | Tanggal | Skor | Catatan |
|---|---|---|---|
| 0 (baseline) | 2026-06-15 | **83** | Audit awal 9-agent. Temuan headline: fix XSS C2 ternyata masih bisa ditembus. |

## Scorecard per dimensi (baseline)

| Dimensi | Skor | Bobot | Ringkasan masalah utama |
|---|---|---|---|
| Security | 82 | 20% | Sanitizer XSS masih bisa ditembus (`>` di dalam attribute); 2 sink main-origin laten. |
| Convex backend | 82 | 19% | `proofStorageId` tanpa cek owner; validasi skip 3 tabel terbesar. |
| Frontend (React) | 88 | 15% | Toast "sukses" palsu di notifikasi; debounced write hilang saat unmount. |
| UX / a11y / i18n | 82 | 12% | Keyboard-a11y belum digeneralisir; kontras `text-warning` gagal WCAG; tombol mati di mock-interview. |
| Performance | 82 | 10% | `listChatSessions` over-fetch; preview CV re-render tiap ketik. |
| Testing / DX | 82 | 9% | PBKDF2 + `aiResolve` nol test; coverage-gate include kesempitan. |
| **Ops / reliability** | **74** | 9% | Script monitoring/self-heal tak ter-commit; restore drill belum pernah; 2 dok restore beda. |
| Arsitektur | 78 | 6% | 4 SSOT route/nav tumpang-tindih; field manifest route/nav = dead code. |

## Vonis eksekutif (QA)

Penghalang terbesar ke 100 bukan bug besar — tapi **klaim "sudah diperbaiki" yang
ternyata belum, tanpa tripwire regresi**. Fix sanitizer C2 (2026-06-11) masih bocor:
tiap langkah regex di `helpers.ts` pakai `[^>]` untuk batas tag, jadi satu `>` di
dalam attribute ber-quote (title/class/rel/target/lang/dir) motong rebuild dan
ngelolosin handler `on*=`. `helpers.test.ts` ijo 12 kasus tapi gak pernah nguji
`>` di dalam attribute → CI buta. Pola yang sama: 2 primitive paling kritis
(`auth.ts` PBKDF2 + `_shared/aiResolve.ts`) nol test, dan coverage-gate cuma
nge-cover `convex/_shared` + `frontend/shared/lib`.

Tapi ini codebase yang **matang, bukan rapuh**: auth-guard hampir seragam (114/116
mutation ter-guard), pipeline AI rapi & konsisten, CSP/header/edge ketat, IDOR
storage sebagian besar sudah ditutup, cascade-delete GDPR menyeluruh, dan
postmortem + backup insiden adalah kerja operator yang teladan. Blast-radius XSS
tertahan karena iframe template sengaja tanpa `allow-same-origin` — tapi keputusan
arsitektur **itu satu-satunya** pembatas antara "insiden medium" dan "ATO penuh",
dan 2 sink main-origin laten makan data mentah yang sama.

Setelah security, sisanya tema "fix dipasang di 1 tempat, gak digeneralisir".
Dimensi terendah (ops 74) paling jelas: otot recovery ada tapi tak teruji & tak
terversioning.

## Kekuatan yang terverifikasi

- Auth-guard seragam (114/116 mutation; 2 pengecualian sengaja publik + IP-throttle).
- Konsolidasi `aiResolve` (fix C1) beneran nutup regresi admin-global-key.
- Pipeline AI: `requireQuota → sanitizeAIInput → wrapUserInput → proxy`, quota token-bucket per-user (Anonymous ikut ke-throttle), refund 60s tak bisa over-refund.
- Iframe publik tanpa `allow-same-origin` = mitigasi penentu XSS.
- Code-split disiplin: 22 view dashboard lazy via `next/dynamic`, Recharts deferred, halaman `/<slug>` ISR.
- Error-boundary lengkap di tiap route group + class ErrorBoundary bungkus catch-all.
- Respons insiden teladan: postmortem presisi, `backup.sh` robust, compose ter-harden.
- Test yang ada substantif (294 test < 1 dtk; `guards.integration.test.ts` nge-drive IDOR/rate-limit beneran).

## Backlog terprioritas (18)

| # | Temuan | Dimensi | Sev | Effort | Risk |
|---|---|---|---|---|---|
| 1 | Bypass sanitizer `>`-in-attribute (stored XSS) | security | high | S | low |
| 2 | Matikan 2 sink XSS main-origin laten | security | med | S | low |
| 3 | `proofStorageId` tanpa cek owner (blob deletion lintas-tenant) | convex | med | S | low |
| 4 | Toast "sukses" palsu + unhandled rejection notifikasi | frontend | med | S | low |
| 5 | Validasi jobApplications / cvs / profile-create | convex | med | M | low |
| 6 | Version-control `health-watch.sh` + `install-cron.sh` | ops | high | M | low |
| 7 | Restore drill + rekonsiliasi dok restore + provider snapshot | ops | high | M | med |
| 8 | `deployment.md` basi (auto-deploy palsu / `:latest` / SQLite) | ops | med | S | low |
| 9 | Test PBKDF2 + `aiResolve` + lebarkan coverage-gate | testing | high | M | low |
| 10 | Generalisir keyboard-a11y ke card/header klik | ux | med | M | low |
| 11 | Flush debounced-write saat unmount (data loss) | frontend | med | M | med |
| 12 | Beresin 4 SSOT route/nav tumpang-tindih | arch | high | M | med |
| 13 | `listChatSessions` over-fetch — denormalisasi ringkasan | perf | med | M | low |
| 14 | Debounce preview CV + memoize subtree template | perf | med | M | low |
| 15 | Gelapkan token `--warning` text (kontras WCAG 1.4.3) | ux | med | S | low |
| 16 | Tombol mati + "Sedang merekam" palsu di mock-interview | ux | med | M | low |
| 17 | Batch fix kecil (AISettings dirty, actionUrl, ConvexError, email index) | convex | low | S | low |
| 18 | Header precedence rate-limit + insert webhook Resend | security | low | S | med |

## Batch "kerjain sekarang" (iterasi 1)

1. **Tutup bypass sanitizer** — `convex/profile/blocks/helpers.ts` + `helpers.test.ts`. Kriteria: `<a title="x>"onmouseover=...>` keluar tanpa `onmouseover` (juga class/rel/target/lang/dir + double-`>`); rebuild gak lagi andalkan `[^>]`; test regresi ditambah; vitest + typecheck ijo.
2. **Matikan 2 sink main-origin** — `BlockRenderer.tsx`, `FloatingMobileNav.tsx`, `iframeHelpers.ts`. Kriteria: HtmlBlock gak render HTML mentah di main-origin (dihapus / re-sanitize); `iconHtml` di-allowlist ke `<svg>`+attr aman; listener postMessage di-pin ke origin; build+typecheck ijo; 3 template tak regresi visual.
3. **`assertOwnedStorages` di `proofStorageId`** — `engine/atoms/mutations.ts` + `cascadeDelete.ts`. Kriteria: `add`/`supersede` cek owner, throw `Berkas tidak ditemukan` untuk id asing; test cross-user ditolak; typecheck+vitest ijo.
4. **Benerin toast palsu notifikasi** — `useNotifications.ts` + `NotificationsView.tsx`. Kriteria: `markAllRead`/`dismiss`/`dismissAll` lewat `withMutationToast`; `markRead` punya `.catch`; `notify.success` tak kondisional dibuang; lint+typecheck ijo.
5. **Version-control script ops** — `backend/convex-self-hosted/ops/health-watch.sh` + `install-cron.sh` (+ dokumen di `deployment.md`/`progress.md`). Kriteria: kedua script ter-commit, cek freshness backup terlipat, `bash -n` lolos. (Author dari postmortem; TANPA SSH.)
6. **Beresin `deployment.md`** — + `.env.example`. Kriteria: deskripsi alur nyata (Actions dispatch-only; pre-push hook = gate), ganti `:latest` → pointer digest pinned, baris SQLite dinyatakan ulang di level abstraksi Convex; `.env.example` default = digest prod nyata.

## Protokol loop

- Builder kerja per batch di branch `qa/loop-to-100`. Tiap fix diverifikasi adversarial sebelum dianggap selesai.
- Setelah batch: gate penuh (`pnpm typecheck` + `pnpm lint` + `pnpm exec vitest run` + `pnpm build`), lalu commit lokal (TANPA push).
- Skor diukur ulang oleh QA → baris baru di "Riwayat skor".
- Lanjut batch berikut dari backlog sampai 100/100 atau plateau jujur.

## Log progres

- **2026-06-15** — Baseline 83. Batch-1 (6 item) dilempar ke Builder alter ego.
