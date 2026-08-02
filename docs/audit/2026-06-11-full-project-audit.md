# CareerPack — Audit Proyek Menyeluruh

> **Tanggal**: 2026-06-11
> **Cakupan**: progress tracking, kondisi kode, kritik & saran dari tiga sudut pandang — pengguna, investor, QA/developer.
> **Metode**: 4 agent eksplorasi paralel (docs, frontend slices, Convex backend, engineering health) + verifikasi manual git history, workflow CI, dan manifest kitab.
> **Dokumen pendamping**: [progress.md](../progress.md), [launch-runbook.md](../launch-runbook.md), [qa/quality-report-2026-04-23.md](../qa/quality-report-2026-04-23.md)

---

## 0. Ringkasan Eksekutif

CareerPack adalah platform karier all-in-one berbahasa Indonesia (CV generator, job matcher + ATS, roadmap skill, mock interview, personal branding, dll.) di atas Next.js 15 + Convex self-hosted. Dalam ~6 minggu (April–Mei 2026, 165 commit) proyek mencapai **feature-complete untuk 22 slice** dengan disiplin engineering yang di atas rata-rata proyek solo: TypeScript strict tanpa escape hatch, lint zero-warning, guard auth konsisten 100%, pipeline AI ter-rate-limit & ter-sanitasi, 8 cron idempoten, PWA production-grade, dan security hardening sweep yang serius (CSRF origin gate, anti-enumeration, PII redaction, encrypted backup).

**Namun proyek saat ini berada di fase paling berbahaya: "selesai dibangun, belum diluncurkan, dan momentum berhenti."** Commit terakhir 2026-05-28 — dua minggu tanpa aktivitas. Tiga item P1 launch-runbook masih `pending` (backup drill, file storage, observability). CI sudah dimatikan menjadi manual-only sehingga satu-satunya quality gate adalah hook lokal. Test coverage frontend praktis nol. Dan dari kacamata bisnis: belum ada monetisasi, instrumentasi baru sebatas GA4 pageview (belum ada event funnel produk), dan belum ada satu pun pengguna nyata yang terverifikasi.

| Dimensi | Skor | Catatan satu baris |
|---|---|---|
| Kelengkapan fitur | 9/10 | 22/22 slice fungsional dengan data Convex nyata, bukan mock |
| Kualitas kode | 8.5/10 | Strict TS, zero TODO, file terpanjang 773 baris (shadcn generated) |
| Keamanan (dalam stack) | 8/10 | Guard konsisten, rate limit, CSRF, redaction; sisa: image pin, CSP nonce |
| Test & QA otomatis | 4/10 | 527 assertion tapi 0% slice coverage, 0 e2e, CI nonaktif |
| Kesiapan operasional | 5/10 | Backup recipe ada tapi belum pernah di-drill; observability stub |
| Kesiapan bisnis | 3/10 | Tanpa monetisasi, tanpa analytics produk, tanpa traction terukur |
| Dokumentasi | 8/10 | Sangat lengkap, tapi mulai drift dari realita (lihat §7) |

**Rekomendasi inti**: berhenti menambah fitur. 2–3 minggu ke depan dipakai untuk (1) menyalakan kembali quality gate, (2) menuntaskan 3 item P1 launch, (3) meluncurkan ke ≥20 pengguna nyata dengan instrumentasi funnel minimal. Detail di §8.

---

## 1. Snapshot Proyek (2026-06-11)

| Metrik | Nilai |
|---|---|
| Total LOC (frontend + convex, tanpa generated) | ~17.900 |
| Frontend | 546 file TS/TSX (~11.000 LOC), 22 slice |
| Backend Convex | 164 file TS (~6.900 LOC), 17+ domain folder, 40+ tabel |
| Commit | 165 (Apr: 59, Mei: 106) |
| Commit terakhir | **2026-05-28** — `test(convex): add convex-test integration suite` |
| Test | 21 file, ~527 assertion (235 vitest case per progress.md) |
| Dependensi kunci | Next 15.2.5, React 19.2, Convex 1.31.7, @convex-dev/auth 0.0.90 |
| Deploy | Dokploy (Docker Compose), Convex self-hosted, pre-push auto-deploy |
| Status branch | `main` bersih, tidak ada PR terbuka |

**Sinyal momentum**: kecepatan luar biasa di Mei (106 commit, termasuk 11 commit/hari pada 14–15 Mei untuk Engine Moat), lalu **berhenti total sejak 28 Mei**. Untuk produk pre-launch, dua minggu idle adalah risiko #1 — bukan teknis, tapi eksekusi.

---

## 2. Progress Tracking — Timeline Terverifikasi

Direkonstruksi dari `docs/progress/` + git log:

| Periode | Milestone | Status |
|---|---|---|
| 2026-04 (awal) | Scaffold 22 slice, routing catch-all, nav SSOT, theme preset 36×2×53 token | ✅ |
| 2026-04-20 | Admin role + requireAdmin, forgot-password (dual-agent A/B) | ✅ |
| 2026-04-23 | QA report pertama — verdict "ship-ready" dengan 2 item kuning | ✅ |
| 2026-04-25 | Restructure Convex: flat 50+ file → 17 domain folder | ✅ |
| 2026-05-01 | Hotspot batch: email Resend, rate-limit reset, calendar reminder + ICS, AI import parse, backup recipe | ✅ |
| 2026-05-01 | Slice refactor batch: 22 file panjang dipecah, 340 placeholder URL diganti | ✅ |
| 2026-05-05 | EN i18n discovery (tanpa kode — 4 keputusan masih menggantung) | 📋 discovery only |
| 2026-05-06 | AI dispatch consolidation: 7 zombie action dibunuh (Phase B sengaja ditunda) | ✅ A+C |
| 2026-05-07 | Hardening sweep 7 commit: enumeration plug, CSRF gate, PII redaction, /api/health, encrypted backup, brute-force gate, CSP unsafe-eval drop | ✅ |
| 2026-05-07 | AI idempotency (anti double-charge retry) + QuotaChip + usage stats admin | ✅ |
| 2026-05-07 | Observability internal: error sink 13 outbound fetch, timeout per-purpose, quota refund on 5xx | ✅ |
| 2026-05-14 | GitHub Actions diturunkan ke `workflow_dispatch`-only (`b678c58`, hemat menit; trigger asli → `.yml.bak`) | ⚠️ tanpa gate pengganti — ditutup 2026-06-11 (Addendum §11) |
| 2026-05-14 | **CareerOS Engine Moat 5 fase dalam 1 hari**: Truth Ledger, Career Graph (29 node/36 edge) + Time Machine BFS, Plan Compiler, Outcome Calibrator, DP Aggregator (Laplace + k-anonymity) | ✅ |
| 2026-05-15 | Phase 4.5: Bayesian calibrator cron + calibrated-edge badge — loop end-to-end terlihat user. BSDL kitab bootstrap | ✅ |
| 2026-05-16 | BSDL dideprekasi upstream — `.kitab.json` dihapus sengaja (`75eabcc`); sharing slice kembali manual `cp -r` | ✅ |
| 2026-05-20 | UI/UX audit batch: CV preview overflow, calendar density, grade UX personal-branding | ✅ |
| 2026-05-28 | Guard consistency final + convex-test integration suite (235 vitest) | ✅ |
| **2026-05-29 → 2026-06-11** | **— tidak ada aktivitas —** | ⚠️ |

### Backlog resmi yang masih terbuka (dari progress.md + launch-runbook.md)

| # | Item | Prioritas | Catatan |
|---|---|---|---|
| 1 | Backup drill (deploy backup.sh + cron + 1× recovery test) | **P1 launch** | Butuh SSH ke VPS, ~5 menit + test. Tabel drill di runbook masih `_pending_` |
| 2 | File storage eksternal ATAU risiko diterima eksplisit | **P1 launch** | Risiko: volume prune = foto CV/cover portfolio hilang |
| 3 | Observability nyata (Sentry/GlitchTip) | **P1 launch** | `frontend/instrumentation.ts` masih stub |
| 4 | CSP nonce hardening | P2 | Masih `unsafe-inline` |
| 5 | E2E smoke test (Playwright) | P2 | Belum ada sama sekali |
| 6 | EN i18n fase 1–6 | Ditunda | 4 keputusan produk belum diambil |
| 7 | Library `usedIn[]` — usage map belum mencakup avatar CV & foto profil (portfolio sudah) | Bug kecil | ✅ ditutup 2026-06-11 — `listMyFiles` diperluas (Addendum §11) |
| 8 | Konten roadmap non-tech (konstruksi, pertanian, manufaktur) | Konten | Hospitality sudah |
| 9 | Truth Ledger editor standalone | Ditunda | Akses hanya via Tailor |
| 10 | Pin image Convex ke digest di compose | Ops | Default masih `:latest` |

---

## 3. Status Maturitas per Slice

Semua 22 slice memakai data Convex nyata (69 file dengan `useQuery`/`useMutation`), tanpa mock data, tanpa TODO/FIXME, manifest coverage 22/22, Capabilities (binding AI agent) 18/22.

| Slice | Ukuran | Maturitas | Catatan |
|---|---|---|---|
| personal-branding | 72 file / 514K | 🟢 Matang | Slice terbesar; block builder + public page + iframe export. `usePBForm` 441 baris layak dipecah |
| cv-generator | 35 file / 258K | 🟢 Matang | 3 template, ATS score, PDF export, autosave, AI import |
| admin-panel | 30 file / 290K | 🟢 Matang | Analytics + engine seed UI |
| skill-roadmap | 25 file / 210K | 🟢 Matang | + Career Time Machine, Quest, Outcome Reporter |
| matcher | 18 file / 161K | 🟢 Matang | ATS scan, cover letter, resume tailor (idempotent), salary insights |
| portfolio, document-checklist, financial-calculator, calendar, networking, mock-interview, career-dashboard, settings, notifications, database, dashboard-home | sedang | 🟢 Matang | CRUD lengkap + agent skills |
| library | 7 file / 41K | 🟢 Matang | usage map kini portfolio + avatar CV + foto profil (gap ditutup 2026-06-11) |
| ai-agent, help | kecil | 🟢 Stabil | |
| ai-settings, auth, hero | minimal | 🟢 By design | Entry point / routing |

---

## 4. Perspektif #1 — Pengguna (Job Seeker Indonesia)

### Yang sudah bagus

1. **Cakupan fitur satu atap** — CV → cari kerja → ATS check → cover letter → interview practice → roadmap skill → personal branding → tracking lamaran → kalender → keuangan. Tidak ada kompetitor lokal yang menyatukan semua ini.
2. **Bahasa Indonesia penuh**, termasuk pesan error backend — terasa "buatan sini", bukan terjemahan.
3. **PWA serius**: installable, offline fallback, shortcut manifest (CV / AI / Roadmap), update prompt yang tidak menyergap mid-session.
4. **AI yang membumi**: QuotaChip transparan (warna berubah di 75%/95%), idempotency mencegah double-charge saat retry, Truth Ledger mencegah AI mengarang angka di CV — ini *anti-halusinasi by construction*, fitur yang jarang ada bahkan di produk besar.
5. **Demo flow** (`loginAsDemo` + seed otomatis) — calon user bisa merasakan produk tanpa daftar.
6. **Grade UX yang manusiawi** (2026-05-20): huruf A–E diganti label deskriptif ("Premium" … "Mulai Bangun").

### Kritik dari kursi pengguna

1. **Lebar > dalam.** 22 fitur untuk produk yang belum punya pengguna adalah red flag fokus. Pengguna baru akan bingung "mulai dari mana?" — OnboardingWizard ada, tapi value proposition utamanya tenggelam. Seorang job seeker datang untuk **satu** hal: "bantu saya dapat kerja." Financial calculator dan database hub adalah distraksi di sesi pertama.
2. **Sumber lowongan tipis.** Job feed hanya RemoteOK + WeWorkRemotely — keduanya **remote & berbahasa Inggris**, padahal seluruh UI berbahasa Indonesia. Mismatch persona yang serius: pengguna lokal akan membuka Matcher dan menemukan lowongan yang tidak relevan dengan pasarnya. Tidak ada feed lokal (dan integrasi job portal lokal umumnya tidak menyediakan API publik — ini perlu strategi konten, bukan sekadar cron baru).
3. **Tidak ada sinyal offline di komponen.** SW + halaman /offline ada, tapi saat koneksi putus di tengah mengedit CV, tidak ada banner "Anda offline" — mutation gagal diam-diam ke toast error generik.
4. **Kuota AI 10/menit / 100/hari tidak dijelaskan di awal.** Pengguna baru yang antusias mencoba semua fitur AI akan menabrak limit tanpa konteks "kenapa" dan "kapan reset".
5. **Tidak ada jalur feedback → perbaikan yang terlihat.** Slice feedback ada, tapi pengguna tidak melihat changelog atau "fitur yang Anda minta sudah hadir".
6. **Performa belum diverifikasi**: Lighthouse mobile ≥ 85 masih unchecked di runbook; PDF stack (html2canvas + jspdf + pdfjs) berat untuk perangkat low-end yang justru dominan di pasar Indonesia.

### Saran prioritas pengguna

- **Definisikan "aha moment" tunggal** (misal: upload CV lama → skor ATS + 3 perbaikan dalam 60 detik) dan arahkan seluruh onboarding ke sana.
- Tambah `useOnlineStatus` + banner offline global (kecil, 1 hari kerja).
- Tampilkan penjelasan kuota AI di first-touch fitur AI.
- Selesaikan strategi lowongan lokal sebelum memasarkan fitur Matcher.

---

## 5. Perspektif #2 — Investor

### Tesis yang bisa dijual

1. **Moat teknis nyata, bukan jargon.** CareerOS Engine adalah diferensiasi yang sulit ditiru cepat: Career Graph (29 node, 36 transisi berprobabilitas) + Outcome Calibrator Bayesian yang **belajar dari hasil lamaran pengguna nyata** + Differential Privacy aggregator (Laplace, k≥5). Ini *data network effect*: makin banyak pengguna lapor outcome → makin akurat probabilitas transisi karier → makin berharga produknya. Kompetitor bisa meniru UI dalam sebulan; tidak bisa meniru data kalibrasi.
2. **Biaya operasi mendekati nol.** Self-hosted di satu VPS, AI via proxy dengan quota ketat + idempotency cache. Burn rate ≈ biaya VPS + token AI.
3. **Kecepatan eksekusi terbukti**: 5 fase engine dalam 1 hari, hardening sweep 7 commit sehari — kapasitas shipping yang tinggi.
4. **Pasar besar**: angkatan kerja muda Indonesia, fresh graduate yang kesulitan menembus ATS, plus segmen pekerja migran (template dokumen 9 negara: JP/KR/SG/AU/DE/NL/AE/SA adalah sinyal positioning yang menarik — niche TKI/global talent yang underserved).

### Kritik dari kursi investor

1. **Zero traction, instrumentasi minim.** GA4 terpasang di root layout (pageview), tapi tidak ada event funnel produk, kohort retensi, atau angka pengguna yang bisa diaudit. `adminStats` menghitung baris tabel, bukan perilaku. **Saya tidak bisa menilai apa pun selain demo.** Engine moat hanya bernilai jika ada outcome events masuk — dan saat ini cold-start: k-anonymity floor 5 berarti fitur kalibrasi tidak menampilkan apa-apa sampai ≥5 pengguna per kohort melapor.
2. **Tidak ada model pendapatan yang diimplementasi.** Tidak ada tier, paywall, atau billing di kode (payment masih stub di tooling). "Nanti dipikirkan" bukan jawaban saat AI cost per-user nyata. Kandidat alami: free = 10 AI call/hari, premium = 100 + template eksklusif + prioritas — infrastruktur quota-nya *sudah ada*, tinggal dipasangi harga.
3. **Bus factor = 1.** Satu developer, satu VPS, satu admin key. Backup *belum pernah di-drill*. Kalau volume Convex korup hari ini, recovery adalah teori. Untuk due diligence, ini menggugurkan klaim "production-ready".
4. **Momentum berhenti 2 minggu pre-launch** — pola klasik "selesai membangun, takut meluncurkan". Bagi investor, builder yang tidak merilis lebih berisiko daripada produk yang buruk.
5. **22 fitur tanpa data penggunaan = 22 hipotesis yang belum diuji.** Biaya pemeliharaan permukaan produk sebesar ini akan menggerus kecepatan saat pengguna nyata mulai melapor bug.
6. **i18n EN ditunda** mengunci TAM ke Indonesia — wajar untuk fokus awal, tapi narasi "regional career OS" butuh jalur EN yang jelas (discovery doc sudah ada, keputusan belum).

### Yang ingin saya lihat dalam 60 hari (investor checklist)

| Minggu | Bukti |
|---|---|
| 1–2 | Launch ke ≥20 pengguna nyata (komunitas kampus/bootcamp), backup drill selesai, Sentry hidup |
| 3–4 | Funnel terukur: signup → CV dibuat → ATS scan → lamaran tercatat. North-star metric dipilih (saran: *lamaran terkirim dengan CV yang di-tailor per minggu*) |
| 5–8 | Retensi W1 ≥ 20%, ≥50 outcome events masuk (mulai memberi makan calibrator), eksperimen harga pertama (pre-order/waitlist premium) |

---

## 6. Perspektif #3 — QA / Developer

### Yang sudah bagus (di atas standar industri untuk proyek solo)

1. **Type safety hampir absolut**: strict mode dua workspace, `as any` = 0, `@ts-ignore` = 1, eslint-disable hanya 12 (semuanya justified).
2. **Guard audit PASS 100%**: setiap mutation pakai `requireUser`, list query pakai `optionalUser`, akses by-id pakai `requireOwnedDoc` (pesan "tidak ditemukan" anti-enumeration). Diverifikasi ulang audit ini — nol pelanggaran.
3. **Pipeline AI PASS 100%**: semua action AI melalui `requireQuota → sanitizeAIInput → wrapUserInput`. Plus idempotency cache + quota refund saat gateway 5xx.
4. **Security headers ketat**: CSP scoped, HSTS 2 tahun, X-Frame-Options DENY, Permissions-Policy. Reset token disimpan sebagai HMAC, bukan raw.
5. **8 cron semuanya idempoten** (timestamp/flag guard), terjadwal staggered.
6. **Hard architecture rules ditegakkan lint**: isolasi antar-slice dicegah ESLint rule custom, bukan sekadar konvensi.
7. **Skema sehat**: index `by_user*` konsisten, hanya 4 `v.any()` dan semuanya berkomentar justifikasi.

### Temuan kritis

#### 🔴 K1 — CI mati total (regresi proses paling serius)

`.github/workflows/ci.yml` dan `convex-deploy.yml` kini **`workflow_dispatch`-only**; versi asli (push + PR trigger) tersimpan sebagai `.bak`. Artinya:

- Tidak ada quality gate otomatis di GitHub. Satu-satunya gate adalah hook lokal (`lint-staged` pre-commit, deploy pre-push) yang **bisa di-bypass dan tidak menjalankan test maupun build**.
- Pre-commit hanya ESLint + `tsc convex` — **`pnpm test` dan `pnpm build` tidak dijalankan otomatis di mana pun**.
- CLAUDE.md §CI masih menulis "runs on PR + push to main" — dokumentasi bohong terhadap realita (lihat K4).

Konteks: ini kemungkinan hasil penghematan menit GitHub Actions (tooling `sc-git` ada di repo). Penghematan valid, tapi **harus diganti gate ekuivalen**, misal pre-push menjalankan `typecheck + test` (cepat, lokal) sebelum auto-deploy Convex — saat ini deploy backend ke produksi bisa terjadi **tanpa satu test pun berjalan**.

#### 🔴 K2 — Test coverage timpang ekstrem

- 527 assertion terdengar sehat, tapi distribusinya: hampir semua di `_shared` utilities + engine pure-lib.
- **22/22 slice frontend: nol test.** 16 domain Convex (cv, applications, calendar, financial, …): nol test logika bisnis.
- Nol E2E. Smoke test Playwright di runbook masih wacana.
- `vitest.config.ts` hanya meng-cover `_shared` + `shared/lib` di coverage report dan **tanpa threshold** — angka coverage tidak bisa regresi karena memang tidak diukur.
- Konsekuensi praktis: refactor di slice mana pun (mis. CVGenerator 447 baris, CalendarView 708 baris) tidak punya jaring pengaman selain typecheck.

#### 🟡 K3 — Operasional pre-launch belum tuntas

- Backup: script + enkripsi ada, **belum pernah dijalankan di VPS, belum pernah recovery test**. Backup yang belum di-restore = belum punya backup.
- Observability: error sink internal bagus (13 outbound fetch), tapi `instrumentation.ts` frontend masih stub — error client-side produksi tidak ke mana-mana.
- Image Convex di compose default `:latest` — drift silent saat container recreate.

#### 🟡 K4 — Dokumentasi mulai drift dari realita

| Klaim dokumen | Realita |
|---|---|
| CLAUDE.md: "CI runs on PR + push to main" | Workflow `workflow_dispatch`-only sejak 2026-05-14 (`b678c58`); trigger asli → `.yml.bak` |
| CLAUDE.md §BSDL: slice "should each ship a `.kitab.json`" + workflow `/rr-prep`/`/rr-send` | BSDL dideprekasi upstream 2026-05-16; `.kitab.json` dihapus sengaja (`75eabcc`) — tidak ada tool yang membacanya lagi |
| CLAUDE.md: "InstallChip" di providers tree, providers di-mount langsung di `app/layout.tsx` | Sudah diganti `InstallSidebarButton` di sidebar desktop; providers pindah ke `shared/providers/Providers.tsx` (+GA4 di root layout) |
| CLAUDE.md §Auth: login flow "query `userExistsByEmail` first" | Query itu dihapus 2026-05-07 (plug enumeration); diganti fetch `/api/auth/check-email` |

> Keempat drift di atas **sudah disinkronkan 2026-06-11** — lihat Addendum §11.

Drift kecil hari ini = AI agent dan kontributor baru mengambil keputusan dari premis salah besok. Repo ini sangat bergantung pada docs sebagai SSOT — justru karena itu drift lebih mahal di sini.

#### 🟡 K5 — Lain-lain

- ~~Tidak ada `ErrorBoundary` generik~~ — **koreksi audit**: `shared/components/error/ErrorBoundary.tsx` (class boundary + fallback retry) ada dan sudah membungkus setiap slice view di catch-all `dashboard/[[...slug]]/page.tsx`. Klaim awal audit salah.
- Tidak ada plugin `eslint-plugin-jsx-a11y`; a11y bergantung pada Radix (309 atribut aria) — kuat untuk primitive, tidak menjaga komponen custom.
- Gap library `usedIn[]` (avatar CV + foto profil tidak masuk usage map; portfolio sudah) — ditutup 2026-06-11.
- `sw.js` cache version manual bump (`careerpack-v23-…`) — rawan lupa saat rilis; pertimbangkan derive dari build ID.

### Saran QA konkret (urut dampak/biaya)

1. **Pulihkan gate** (½ hari): tambahkan `pnpm typecheck && pnpm exec vitest run` ke `scripts/pre-push.sh` *sebelum* langkah deploy Convex. CI GitHub boleh tetap manual untuk hemat menit, asal gate lokal wajib lewat.
2. **Sinkronkan docs** (1 jam): perbaiki klaim CI di CLAUDE.md, putuskan nasib `.kitab.json` (re-commit atau hapus klaim di progress.md).
3. **Smoke E2E 5 skenario** (2–3 hari): login demo → buat CV → ATS scan → tambah lamaran → export ICS. Playwright, jalan lokal via pre-push opsional atau manual pre-release. Ini menutup 80% risiko regresi dengan 5 test.
4. **Coverage threshold bertahap** (½ hari): mulai 30% di scope yang sudah diukur, naikkan per kuartal; perluas `coverage.include` ke `convex/**` dan `frontend/slices/**`.
5. **Banner offline global** (`useOnlineStatus` hook + indikator di shell — SW/offline page sudah ada, sinyal komponen belum) (½–1 hari).
6. **Pin image Convex ke digest** + catat prosedur upgrade (½ hari).
7. Test integrasi convex-test untuk 5 domain transaksional teratas: cv, applications, financial, calendar, documents (1 minggu, bisa dicicil).

---

## 7. Temuan Lintas-Perspektif: Drift Dokumentasi vs Realita

Satu temuan layak bab sendiri karena menyentuh ketiga perspektif: **repo ini menjadikan docs sebagai SSOT operasional (untuk AI agent & kontributor), tapi tiga klaim docs sudah tidak benar** (detail di K4). Pola risikonya:

- **Pengguna** terdampak tidak langsung: keputusan rilis dibuat di atas asumsi "CI menjaga main" yang tidak lagi benar.
- **Investor** melihatnya sebagai integritas data ruangan: kalau progress report internal saja drift, angka traction nanti dipercaya bagaimana?
- **QA** kehilangan baseline: audit berikutnya harus re-verifikasi semua klaim, bukan delta saja.

Mitigasi murah: tambahkan langkah "docs reconciliation" ke ritual `/ship` — setiap perubahan workflow/struktur wajib menyentuh CLAUDE.md/progress.md di commit yang sama.

---

## 8. Rekomendasi Terpadu — Roadmap 30 Hari

> Prinsip: **tidak ada fitur baru sampai ada pengguna nyata.** Semua di bawah ini adalah launch-enablement.

### Minggu 1 — Pulihkan fondasi (gate + ops)

- [x] Pre-push hook: tambah `typecheck + vitest run` sebelum deploy Convex (**K1**) — ✅ 2026-06-11
- [ ] Backup drill: deploy `backup.sh` + cron ke VPS, **lakukan 1× recovery test**, isi tabel drill di runbook (**P1**)
- [ ] Aktifkan Sentry/GlitchTip di `instrumentation.ts` (**P1**) — stub sengaja menunggu keputusan provider/DSN
- [ ] Pin image Convex ke digest
- [x] Sinkronkan CLAUDE.md + progress.md dengan realita (CI, BSDL/.kitab.json, InstallChip, login flow) — ✅ 2026-06-11

### Minggu 2 — Jaring pengaman rilis

- [ ] Playwright smoke 5 skenario inti
- [ ] Banner offline global (`useOnlineStatus`) — ErrorBoundary per slice view ternyata sudah terpasang
- [ ] Putuskan file storage: eksternal atau terima risiko (tulis keputusannya) (**P1**)
- [ ] Jalankan Lighthouse mobile, capai ≥ 85 di landing
- [ ] Checklist pre-launch runbook: centang semua atau tulis alasan skip

### Minggu 3–4 — Luncurkan & ukur

- [ ] Soft launch ke ≥20 pengguna nyata (komunitas kampus / bootcamp / grup pencari kerja)
- [ ] Instrumentasi funnel minimal (event Convex sendiri cukup: signup, cv_created, ats_scan, application_added) + dashboard di admin-panel
- [ ] Pilih north-star metric dan review mingguan
- [ ] Kumpulkan ≥50 outcome events → calibrator mulai hidup → moat mulai bekerja
- [x] Tutup gap library `usedIn[]` — ✅ 2026-06-11 (`listMyFiles` kini scan avatar CV + foto profil)

### Setelah ada sinyal (bulan 2+)

- Keputusan i18n EN (4 keputusan menggantung di discovery doc)
- Eksperimen monetisasi di atas infrastruktur quota yang sudah ada
- Konten roadmap non-tech + strategi lowongan lokal
- Test integrasi domain Convex bertahap

---

## 9. Lampiran A — Status Checklist Pre-Launch (dari launch-runbook.md, per 2026-06-11)

| Item | Status |
|---|---|
| DNS A record → Dokploy host | ⬜ belum tercentang |
| TLS auto-renew | ⬜ |
| Admin key dirotasi post-handover | ⬜ |
| `ADMIN_BOOTSTRAP_EMAILS` diisi email asli | ⬜ |
| Backup drill selesai | ⬜ `_pending_` |
| File storage eksternal ATAU risiko diterima | ⬜ `_pending_` |
| SW cache version di-bump | ⬜ |
| Lighthouse mobile ≥ 85 | ⬜ |
| Demo flow end-to-end di browser anonim | ⬜ |
| CSP tidak memblokir aset pihak ketiga | ⬜ |

## 10. Lampiran B — Sumber & Metode

- 4 agent Explore paralel: `docs/` lengkap; 22 slice frontend + shared infra; 17+ domain Convex + compose stack; test/CI/lint/deps/security/a11y.
- Verifikasi manual: `git log` (165 commit, terakhir 2026-05-28), `Glob frontend/slices/**/.kitab.json` (kosong), `Grep .github/workflows` (workflow_dispatch-only + `.bak`).
- Semua temuan keamanan berada **di dalam stack yang ada** sesuai hard constraints CLAUDE.md — tidak ada rekomendasi penggantian engine/framework/provider.

---

## 11. Addendum — Koreksi & Tindakan (sesi lanjutan, 2026-06-11)

Audit di atas ditulis dari laporan agent; sesi lanjutan di hari yang sama
memverifikasi ulang klaim-klaim kunci terhadap kode & git history. Hasil:

### 11.1 Koreksi klaim audit (temuan agent yang terbukti salah/tidak presisi)

| Klaim awal | Fakta terverifikasi |
|---|---|
| `.kitab.json` "dihapus atau tidak pernah di-commit" | Dihapus **sengaja** di `75eabcc` (2026-05-16) karena upstream rr menderepkasi BSDL. Drift sebenarnya: CLAUDE.md & backlog progress.md masih mengiklankan workflow yang sudah mati. |
| "Tidak ada ErrorBoundary generik membungkus slice view" | Salah — `ErrorBoundary.tsx` (class boundary + fallback retry) sudah membungkus `<View />` di catch-all dashboard. |
| "Library `usedIn[]` selalu kosong (known issue)" | Tidak presisi — teks itu adalah *porting guidance* untuk repo target di `docs/features/library.md` §Common breakage. Di CareerPack, portfolio (cover + media) sudah ter-scan; gap nyata hanya avatar CV + foto profil. |
| "Tanpa analytics produk" | GA4 (`G-P1B124M70R`) terpasang di root layout. Yang absen: event funnel produk, bukan analytics sama sekali. |
| (drift tambahan, baru ditemukan) CLAUDE.md login flow "query `userExistsByEmail` first" | Query dihapus 2026-05-07; flow nyata pakai `fetch /api/auth/check-email`. |

### 11.2 Tindakan yang dieksekusi hari ini

1. **Pre-push quality gate** (`scripts/pre-push.sh`): `pnpm typecheck` + `pnpm exec vitest run` berjalan di setiap push, sebelum step deploy Convex; bypass darurat `SKIP_PUSH_CHECKS=1`. Menutup K1 sisi gate (workflow GitHub tetap manual sesuai keputusan hemat menit 2026-05-14).
2. **Rekonsiliasi docs**: CLAUDE.md (§Commands/pre-push, §Providers tree, §Auth login flow, §CI, §BSDL→legacy) + `docs/progress.md` (entry 2026-06-11, backlog kitab di-obsolete-kan, Last updated).
3. **Fix `usedIn[]`**: `convex/files/queries.ts → listMyFiles` kini juga scan `cvs.personalInfo.avatarStorageId` (label `CV: <judul>`) + `userProfiles.avatarStorageId` (label `Foto profil`), keduanya via index `by_user`.
4. **Coverage floor**: `vitest.config.ts` dapat `coverage.thresholds` (23/23/18/23 — tepat di bawah baseline 24.81/25.35/19.70/24.72) + script baru `pnpm test:coverage`.
5. **Regresi lint di main terdeteksi & diperbaiki** — bukti empiris K1: `pnpm lint` ternyata **merah di main** (`app/[slug]/opengraph-image.tsx:152` melanggar `no-img-element`) dan tidak ada yang tahu, karena pre-commit hanya me-lint file yang di-stage dan CI manual-only. Ditutup dengan `eslint-disable` berjustifikasi (next/og `ImageResponse` render off-DOM, `next/image` tidak didukung — pola yang sama dengan disable existing di `BrandingShowMoreDialog`). Gate pre-push baru akan mencegah kelas regresi ini ke depan (typecheck+test; lint penuh tetap disarankan masuk ritual `/ship`).

### 11.2b Hasil verifikasi gate (2026-06-11, mesin dev Windows)

| Gate | Hasil |
|---|---|
| `bash -n scripts/pre-push.sh` | ✅ syntax OK |
| `pnpm typecheck` (frontend + convex) | ✅ exit 0 |
| `pnpm lint` (zero-warning) | ✅ exit 0 (setelah fix `opengraph-image.tsx`) |
| `pnpm exec vitest run --coverage` | ✅ 235 case lulus; coverage 24.81/25.35/19.70/24.72 ≥ threshold baru 23/23/18/23 |
| `pnpm build` | ⚠️ compile + typecheck + prerender 14/14 halaman **sukses**; gagal hanya di langkah packaging `output: "standalone"` — Windows menolak symlink (`EPERM` errno -4048, terjadi juga di luar sandbox). **Environmental, bukan kode**: butuh Windows Developer Mode/elevation untuk symlink; CI Linux & build Docker Dokploy tidak terdampak. |

### 11.3 Yang sengaja TIDAK dikerjakan (butuh keputusan/akses user)

- Wiring Sentry/GlitchTip — `instrumentation.ts` stub-nya eksplisit menunggu pilihan SDK/DSN.
- Backup drill — butuh SSH ke VPS.
- Pin digest image Convex — digest produksi harus dibaca dari VPS yang berjalan.
- Re-enable trigger CI GitHub — keputusan biaya yang sudah diambil user; gate lokal jadi pengganti.
- E2E smoke (Playwright) — **diblokir hard-constraint CLAUDE.md** ("Test runner: Vitest. Never propose Playwright migrations"). Penguatan test dilakukan via Vitest + convex-test, bukan Playwright.

---

## 12. Bug Hunt & Fixes (sesi lanjutan, 2026-06-11)

Setelah audit, sebuah agent adversarial menyisir modul logika (matcher, engine,
calendar, crons, passwordReset, rate-limit, files, DP, format). Setiap temuan
**diverifikasi manual byte-per-byte** sebelum disentuh — satu "critical" ternyata
false positive akibat karakter tak terlihat. Hasil: **5 bug nyata diperbaiki + 1
landmine dibersihkan + 22 test regresi ditambah** (235 → 257 vitest).

### 12.1 Bug yang diperbaiki

| # | Severity | Lokasi | Inti masalah | Dampak | Perbaikan |
|---|---|---|---|---|---|
| 1 | 🔴 Critical (IDOR) | `convex/matcher/queries.ts` `_getOwnedCV` + `actions.ts` `scanCVImpl` | `db.get(cvId)` tanpa cek kepemilikan; komentar mengklaim cek yang tak ada | User A bisa `scanCV({cvId: milik B})` → CV B di-scan, keyword-nya tersimpan ke `atsScans` milik A (kebocoran isi CV lintas-tenant) | Tambah arg `userId` + `return null` bila `cv.userId !== userId`; caller kirim `userId`. Guard: convex-test baru |
| 3 | 🔴 Critical | `convex/calendar/reminders.ts` `parseEventStart` | Parse `date`+`time` sebagai UTC (`…Z`) padahal ICS export memperlakukannya floating WIB | Reminder meleset ~7 jam untuk **seluruh** basis pengguna ID | Anchor ke `APP_UTC_OFFSET="+07:00"`; fungsi diexport; `reminders.test.ts` baru |
| 6 | 🟡 Medium | `getSalaryInsights` | Midpoint IDR+USD dicampur dalam satu distribusi persentil | "p50 = 30.000.000 USD" — salah ~15.000× di kategori bercampur (seed IDR + feed USD) | Persentil hanya dari currency dominan; logika diekstrak ke `matcher/salaryStats.ts` (pure) |
| 7 | 🟡 Medium | `percentile()` | `Math.floor((n-1)·p)` — bias ke bawah; p75 dari 2 nilai = minimum | Widget gaji understate p50/p75 di sampel kecil | `Math.round`; unit test di `salaryStats.test.ts` |
| 8 | 🔵 Low | `frontend/shared/lib/formatCurrency.ts` `formatShortIDR` | "Rp 1000,0 rb" di batas pembulatan + docstring usang | Kosmetik | Margin promosi unit 0.99995 → "Rp 1,0 jt"; `formatCurrency.test.ts` baru |

### 12.2 False positive yang dicegat (nyaris "memperbaiki" kode yang benar)

Bug-hunt melaporkan `engine/graph/edgeKey` + `outcomes/calibrator` sebagai
**"loop kalibrasi mati total"** (`k.indexOf("")` selalu 0). Verifikasi byte
mentah menunjukkan kode sebenarnya `k.indexOf("\x01")` — **karakter kontrol 0x01
yang tak terlihat** dipakai sebagai delimiter (1× di `graph/lib.ts`, 2× di
`calibrator.ts`). Loop **bekerja benar**; agent (dan grep, dan editor) cuma tak
bisa melihat 0x01-nya.

Pelajaran: kalau auditor teliti pun tertipu, itu hazard maintainability serius.
Karakter 0x01 ditukar ke `|` yang terlihat (behaviour-identik — baik 0x01 maupun
`|` tak pernah muncul di slug kebab-case), plus test round-trip/collision `edgeKey`.
**Tidak ada perubahan logika kalibrasi.**

### 12.3 Sengaja tidak diubah

- **DP `cohortStatsDP`** hanya gating di `apply` count: dipertahankan. Laplace
  mechanism sudah memberi jaminan privasi formal untuk count kecil; k-anonymity
  floor di `apply` adalah pertahanan tambahan, bukan satu-satunya. Mengubah
  semantik DP tanpa arahan user berisiko. Didokumentasikan sebagai peluang
  hardening, bukan bug.

### 12.4 Verifikasi gate (setelah bug-fix batch)

| Gate | Hasil |
|---|---|
| `pnpm typecheck` | ✅ exit 0 |
| `pnpm lint` (zero-warning) | ✅ exit 0 |
| `pnpm exec vitest run` | ✅ 257 case (was 235) — +22 regresi (IDOR, calendar WIB, salary, format, edgeKey) |
| `pnpm exec vitest run --coverage` | ✅ 26.77/27.59/21.18/26.64 ≥ threshold 26/26/21/26 (di-ratchet dari 23) |
| `pnpm build` | ⚠️ environmental Windows symlink `EPERM` saja (lihat §11.2b) — compile + prerender sukses |
