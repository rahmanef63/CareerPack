# CareerPack — 20 Crucial FAQ (Target Market + Investors)

Generated 2026-07-10 by a multi-agent pass (understand product → draft → score →
rewrite weak answers). Every answer is grounded in the actual shipped product; no
invented metrics or testimonials (matches the app's own no-fabricated-stats policy).

Scoring: each answer graded 1–5 on accuracy / specificity / persuasiveness / honesty.
Only **#14 (market-size)** scored below 4 in draft (3) — it dodged the sizing question;
rewritten to anchor on public demographic facts without fabricating a TAM. All others 4–5.

2026-07-31 sourcing pass: #14 and #17 carried numbers with no source anywhere. Every
figure that survived now names its statistic, publisher, and period — a figure without a
period rots silently, and this doc is public before a launch where the comment thread
checks. #14's "~280 juta" was Indonesia's total population masquerading as a market and
is gone; #17's cost claim is now arithmetic over constants in `convex/_shared/`.

---

## Part A — Job Seekers (target market)

**1. Fresh graduate — "Belum punya pengalaman kerja formal, bisa bikin CV dari nol?"**
Bisa. Isi profil karier sekali, lalu CV Generator menyusunnya jadi CV berstruktur
dengan preview langsung. Untuk yang belum punya pengalaman formal, saran AI per bagian
membantu merumuskan poin dari pengalaman kuliah, organisasi, atau proyek, dan skor ATS
menunjukkan bagian mana yang masih lemah. Begitu daftar, CareerPack menyiapkan CV,
ceklis dokumen, dan roadmap skill awal supaya Anda tidak memulai dari halaman kosong.

**2. Career switcher — "Bagaimana bantu transisi ke bidang berbeda?"**
Alurnya bertahap: petakan kemampuan lewat Roadmap Skill untuk melihat skill yang perlu
ditambah di bidang baru, lalu reposisi profil. Fitur resume-tailor di Pencocok Lowongan
menulis ulang poin CV agar relevan dengan deskripsi pekerjaan bidang tujuan, sehingga
pengalaman lama terbaca nyambung dengan peran baru. Roadmap menandai progres belajar
supaya transisi terukur, bukan menebak-nebak.

**3. Experienced professional — "Melamar banyak posisi sekaligus, cara melacak tanpa berantakan?"**
Pakai Pelacak Lamaran (tabel maupun Kanban) dengan pipeline applied → screening →
interview → offer/ditolak/diterima, plus filter, pencarian, catatan, dan tanggal
wawancara. Setiap lamaran bisa diperbarui lewat UI atau minta asisten AI mengubahnya.
Puluhan lamaran tetap rapi dalam satu papan, bukan tersebar di banyak spreadsheet.

**4. ATS anxiety — "Sering ditolak, curiga CV tersaring ATS. Bagaimana memastikan lolos?"**
Selain template yang dibangun tanpa tabel rumit, kolom ganda, atau grafis yang bikin
parser bingung, ada ATS Scanner di Pencocok Lowongan. Tempel CV + deskripsi lowongan,
dapat skor 0–100 beserta kata kunci yang hilang dan masalah format. Ini alat diagnosis,
bukan janji pasti lolos — tapi Anda tahu persis apa yang harus dibenahi sebelum
mengirim, alih-alih menebak kenapa ditolak.

**5. Application tools — "Bisa bikin surat lamaran dan sesuaikan CV untuk satu lowongan?"**
Bisa keduanya. Di Pencocok Lowongan ada generator surat lamaran berbasis AI dan
resume-tailor yang menulis ulang poin CV agar cocok dengan deskripsi pekerjaan spesifik.
Ada juga insight gaji heuristik sebagai gambaran kisaran. Semuanya bekerja dari profil
dan CV yang sudah tersimpan, jadi tidak perlu menyalin-tempel ulang tiap kali melamar.

**6. Interview prep — "Bagaimana simulasi wawancara AI menilai jawaban?"**
Pilih peran dan tingkat kesulitan, AI membuat pertanyaan, lalu tiap jawaban dievaluasi
dengan rubrik STAR (Situation, Task, Action, Result) plus skor akhir dan umpan balik
terperinci. Kalau kuota AI habis, simulasi tetap jalan memakai bank pertanyaan wawancara
berbahasa Indonesia yang sudah dikurasi. Latihan terstruktur, tahu titik lemah jawaban.

**7. AI trust & safety — "Sejauh apa AI bisa bertindak otomatis di akun saya?"**
Asisten AI bisa menjalankan aksi lintas fitur — membuat/mengubah CV, lamaran, kontak,
jadwal, profil, ceklis — bukan cuma mengobrol. Aksi yang hanya membaca data berjalan
langsung, tetapi setiap aksi yang menulis/mengubah data wajib Anda setujui dulu lewat
kartu konfirmasi. AI tidak pernah diam-diam mengubah data tanpa persetujuan eksplisit.

**8. Data privacy — "Apakah CV dan jawaban wawancara saya dijual/disebar?"**
CareerPack tidak menjual data ke pihak ketiga dan data hanya bisa diakses akun Anda.
Hapus akun sendiri kapan saja lewat Pengaturan → tab "Profil Akun" → Zona Berbahaya;
sekali dikonfirmasi, seluruh data Anda dihapus dari server saat itu juga. Permintaan
salinan data masih manual — email support@careerpack.org sebelum menghapus akun, karena
setelah dihapus tidak ada yang tersisa untuk dikirim. Saat memakai fitur AI,
teks dibersihkan (sanitasi) dulu lalu diproses lewat satu proxy model — bukan disebar
ke banyak layanan. Untuk hal sangat sensitif, Anda bisa memilih tidak memasukkannya dan
tetap memakai fitur non-AI.

**9. Free vs paid — "Apa yang gratis, apa yang nanti berbayar?"**
Saat ini gratis: membuat CV ATS tanpa batas draft, menyimpan & melacak lamaran, akses
dasar asisten AI — tanpa kartu kredit, tanpa tagihan otomatis. Belum ada paket berbayar
aktif; satu-satunya batas nyata hari ini adalah kuota pemakaian AI yang sama untuk semua.
Kalau nanti ada tier berbayar, arahnya menaikkan batas AI, bukan mengunci fitur inti.

**10. AI usage limits — "Ada batasan pakai fitur AI?"**
Ada, sebagai batas pemakaian wajar: maksimal 10 permintaan AI/menit dan 100/hari per
akun. Kalau tercapai, dapat pesan coba lagi sebentar, dan banyak fitur tetap bisa dipakai
mode non-AI (mis. bank pertanyaan wawancara kurasi). Batas ini guardrail pemakaian wajar,
bukan paywall.

**11. CV formats — "Format & template apa saja, bisa ekspor PDF?"**
Dua format: nasional (Indonesia, formal, dengan foto) dan internasional (teks saja, ramah
ATS), plus tiga template — modern, classic, minimal — semua dengan preview langsung.
Bisa ekspor PDF dan menerjemahkan CV antar bahasa (ID ↔ EN) lewat AI. Ceklis dokumen
menempel di dalam editor supaya kelengkapan berkas ikut terpantau.

**12. Relocation documents — "Dokumen apa yang perlu disiapkan, beda dalam vs luar negeri?"**
Ada Ceklis Dokumen dua varian: lokal (Indonesia) dan internasional, masing-masing
menandai status siap/belum, catatan per item, dan tanggal kedaluwarsa. Untuk rencana
pindah kota/relokasi, Kalkulator Keuangan melengkapi dengan skor kesiapan finansial dan
perbandingan biaya hidup antar kota. Bisa dicentang lewat UI atau minta asisten AI.

**13. Product scope — "Untuk perusahaan/rekruter atau hanya pencari kerja individu?"**
Produk untuk pencari kerja individu — satu akun, data pribadi Anda sendiri. Belum ada
fitur tim, dashboard rekruter, atau akun perusahaan; semua alat dirancang untuk perjalanan
karier satu orang dari persiapan sampai tawaran. Bisa dipasang sebagai aplikasi (PWA) dan
data sinkron otomatis di semua perangkat.

---

## Part B — Investors

**14. Market size — "How large is the market?"** *(draft scored 3 → rewritten → sourced)*
Indonesia's labour force is **154.91 million**, of whom **7.24 million** are unemployed —
an open unemployment rate (TPT) of **4.68%** (BPS, Sakernas Februari 2026, released
5 May 2026). The breakdown that carries this product's thesis is TPT by highest education
completed, same release: **6.13% for Diploma IV/S1/S2/S3** and **7.74% for SMK**, against
2.32% for SD-and-below. The credentialed end of the labour force is unemployed at well
above the national rate — having the qualification is not the bottleneck, converting it
into a placement is, and that is the preparation problem this product addresses. Feeding
that band: **2,547,717 higher-education graduates** in academic year 2024/2025
(Statistik Pendidikan Tinggi 2025, Kemdiktisaintek/PDDikti, snapshot Desember 2025).
Those are the only sizing numbers we quote — there is no proprietary TAM here and we
won't invent one. Our wedge is localization depth global tools underserve:
Indonesian-language UI, a national CV format with the formal photo local employers expect,
a curated Indonesian interview bank, and inter-city cost-of-living data — which is why the
seeker segment is worth owning at the *preparation* layer rather than the listing layer.

Sources: [BPS press release, 5 May 2026](https://www.bps.go.id/id/pressrelease/2026/05/05/2574/tingkat-pengangguran-terbuka--tpt--sebesar-4-68-persen--rata-rata-upah-buruh-sebesar-3-29-juta-rupiah-.html)
· [Statistik Pendidikan Tinggi 2025](https://kemdiktisaintek.go.id/library/book/statistik-pendidikan-tinggi-2025)
(graduate total = Tabel/Grafik 6.1, PTN 981,478 + PTS 1,189,924 + PTA 305,147 + PTK 71,168).

**15. Business model — "What's the model, is there revenue today?"**
Today the product is free with no billing wired into the code — no `plan` field on users,
no payment integration, no active paid tier. The model is freemium by design: landing copy
commits to a free plan with no credit card, and the only enforced limits are AI fair-use
quotas (10/min and 100/day per account, plus a 300/hour ceiling across the whole
deployment) — the natural boundary to convert into a paid higher-AI-limits tier.
An honest pre-revenue position — the metering primitive a paywall builds on already exists
in production.

**16. Competitive moat — "How do you defend against Jobstreet, LinkedIn, Kalibrr?"**
Those are primarily job marketplaces — they win by owning the listing. CareerPack sits
upstream as the *preparation layer*: it doesn't fight to own the listing, it makes the
candidate offer-ready before they apply anywhere. Defensibility = a single shared career
profile that auto-feeds every tool (CV, checklist, matcher, personal branding) plus an AI
agent that executes actions across those tools — a data-network effect and workflow
lock-in a job board's isolated features don't reproduce, and positioning that's
complementary rather than head-to-head.

**17. Unit economics — "AI is expensive; how do you keep a free tier alive?"**
AI is the main variable cost, and its ceiling is arithmetic over constants in this repo
rather than a forecast. `convex/_shared/rateLimit.ts`: 10 calls/min and 100/day per
account, plus a 300/hour ceiling across the entire deployment (anonymous demo sessions
shed first, at 150). Anonymous sign-in is open, so accounts are free to mint and the
per-user cap alone would bound nothing — the global ceiling is what makes the total a
number: **300 × 24 = 7,200 model calls/day, whole-product, regardless of user count.**
Per call, output is hard-capped by `max_tokens` at each call site (5–2500; chat 700, ATS
scan 600, CV translate 2500) and input truncated by `sanitizeAIInput`, with chat history
clamped to the last 20 messages × 4,000 chars. The `resolveAI` fallback model at every
call site is the cheap tier (`gpt-4.1-nano` / `gpt-4.1-mini`), reached through one
OpenAI-compatible proxy rather than per-provider SDKs, so the model and its price swap
centrally; AI flows degrade to curated content (the Indonesian interview bank) when quota
is exhausted instead of failing or over-spending. Multiply 7,200 by whatever the
configured model charges for a ≤2500-token completion and that is the worst-case daily
bill. We publish no cost-per-user figure — the price belongs to the provider, changes
without us, and is not in this repo to defend.

**18. Tech scalability — "Is Convex a scale/cost risk?"** *(score 4)*
The stack is deliberately lean: one Convex backend (reactive realtime queries, one data
store) behind a Next.js 15 PWA frontend deployed on Dokploy via Docker Compose.
Production runs on Convex Cloud; a self-hosted Convex stack exists and stays working as
a fallback, so the data is portable rather than locked to a vendor's per-seat pricing.
Convex's reactive model delivers realtime cross-device sync without bespoke websocket
plumbing. The architecture is modular — 20+ feature slices mirrored by Convex domains — so
surface area grows without cross-coupling; operational levers (volume backups, image
pinning, admin-key rotation) are standard, not exotic.

**19. Traction & roadmap — "What's traction and the near-term plan?"** *(score 4)*
Honestly, no public user or revenue metrics to quote — the product's own copy policy
forbids fabricated stats, and we won't invent any. What's real is product breadth: a
working, integrated toolkit across 20+ feature slices (CV, matcher, interview, tracker,
roadmap, financial, portfolio, networking) with an acting AI agent already shipped.
Near-term roadmap: monetization (convert the AI quota into paid tiers) plus operational
hardening (volume-backup cron deployed; provider-level DB snapshots pending).

**20. AI defensibility — "If anyone can call an LLM, what makes your AI defensible?"**
The moat isn't the model — models are commoditized and reached through a swappable proxy —
it's what the AI is wired to do. Most competitors ship an isolated chatbot; CareerPack's
agent executes real CRUD across every slice through an approval-gated action bus, operating
on a shared career profile that gives it structured, user-specific context to act on.
Layered with Indonesia-specific assets (curated local interview bank, national CV
conventions, inter-city cost-of-living data), defensibility is the proprietary workflow and
localized data the AI operates over — not the underlying LLM.

---

## Follow-up recommendation

The landing FAQ (`frontend/slices/hero/sections/faq/`) currently under-covers several of
these. Promote ~6–8 job-seeker items (Mock Interview STAR scoring, Matcher's ATS
Scanner / cover-letter / resume-tailor as distinct tools, the application tracker, the
AI action-approval safety model, CV formats, the AI quota, single-user scope) into the
real `faqItems` so the marketing page answers what buyers actually ask.
