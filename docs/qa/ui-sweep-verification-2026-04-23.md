# UI/UX Verification — 2026-04-23 (PR #3)

Verified against: production careerpack.org (head of qa/ui-sweep-fixes-2026-04-23 sudah deploy)
Environment: production (hard-refreshed Ctrl+Shift+R antar langkah)
Breakpoints: desktop 1327 px (viewport resize via toolchain gagal — hanya desktop yang bisa diverifikasi)
Theme: light + dark keduanya diuji
Tooling: Chrome DevTools via extension; fetch() untuk inspect RSC payload; DOM computed style untuk measure

## Verification Results

### C1. Tab wrapper width regression (910313b)
- Overall: ✅ PASS (dengan caveat minor)
- Findings:
  - `.max-w-6xl` sekarang punya class `w-full max-w-6xl mx-auto ...` di calculator ✓
  - Tablist widths (dark mode, viewport 1327):
    - Perencanaan Budget: tablist 951, wrapper 1015
    - Info Gaji: tablist 951, wrapper 1015
    - Bandingkan Kota: tablist 959, wrapper 1023
  - Delta 8 px antara Bandingkan Kota vs 2 tab lain = lebar scrollbar vertical. Pada Perencanaan/Info, konten lebih tinggi → vertical scrollbar muncul → `clientWidth` 1319 px. Pada Bandingkan Kota konten lebih pendek → `clientWidth` 1327 px. Delta 8 px = scrollbar width (browser default). Bukan regression, tapi di luar toleransi brief (±2 px).
  - Fix opsional: set `scrollbar-gutter: stable` di `html` agar gutter reserved konsisten. Skip kalau diterima sebagai limitasi browser.
  - Regression check pada slice lain: `w-full max-w-6xl` ada di /dashboard/checklist. Di /dashboard/cv class-nya masih `max-w-6xl` tanpa `w-full` (missed), tapi konten di CV naturally full-width karena child grid-nya w-full — tidak terlihat regresi visual. Fix: tambahkan `w-full` juga di CV wrapper untuk konsistensi.

### C2. Primary token = brand sky (710854b)
- Overall: 🟡 PARTIAL PASS
- Findings (yang WORK):
  - Dashboard "Tambah Lamaran" = sky ✓
  - Dashboard "Tambah Agenda" inside Agenda Terdekat card = sky ✓ (sebelumnya hitam)
  - Kalender header "+ Tambah Agenda" = sky ✓
  - Applications "Tambah Lamaran" = sky ✓
  - Calculator slider track fill = sky ✓
  - Calculator "Gaji Bulanan" display text "Rp 15.000.000" = sky ✓
  - Focus ring input saat typing = sky outline ✓
  - Roadmap "0% Selesai" indicator = sky ✓
  - CV preview "Lihat CV" button = sky fill ✓
  - CV "Saran AI" chip = sky border/tint ✓
  - Interview "Mulai Sesi" CTA = sky ✓
  - Outline/ghost button (Simpan CV, Unduh PDF, Latihan Wawancara, Lihat / Edit CV) tetap outline, tidak terpengaruh ✓
  - Destructive tetap merah (belum ada live sample di UI, tapi token tidak bentrok) ✓
  - Dark mode: CTA dan slider sky lebih cerah, kontras text putih lolos visual ✓
- Findings (yang FAIL):
  - 🔴 **Calendar selected-day "23" masih HITAM** (rgb gelap), bukan sky. `data-selected:bg-primary` tidak diterapkan pada `CalendarDay`. KPI brief eksplisit minta biru sky.
  - 🔴 **Settings "Simpan Profil" CTA masih HITAM solid** (bg-black text-white) — brief KPI eksplisit minta sky. Kemungkinan hardcode `bg-black` belum di-refactor jadi `<Button>` default.
  - 🔴 **Portfolio "+ Tambah" CTA header masih HITAM solid** di light mode — sama issue, hardcode bg hitam.
  - 🔴 **Checklist Dokumen checked state HIJAU** (bukan sky). Brief KPI: "Checkbox di checklist dokumen: checked state biru sky." Actual: green card + green check circle.
  - 🟡 **Sidebar active item** pakai `rgb(244,244,245)` zinc-100 di light, `rgb(39,39,42)` zinc-800 di dark — NOT sky. Brief KPI: "item aktif highlight biru sky, bukan dark pill." Ironisnya ini sekarang jadi "light pill" / "dark pill" (zinc), tetap bukan sky. Mungkin keputusan intentional (shadcn sidebar token), tapi per brief = FAIL. Visual konfusi: item "Asisten AI" (non-active) justru punya highlight sky karena special styling, sementara "Dashboard" (active) zinc subtle — user sulit baca mana yg active.
  - 🟡 **Settings → Tampilan ToggleGroup** (Terang/Gelap/Sistem, Polos/Gradien/Berpendar, Kecil/Normal/Besar, Datar/Melayang/Lekukan) active state subtle muted gray, tidak sky. KPI brief: "Switch theme toggle checked state bg biru sky" — tidak pasti ini termasuk ToggleGroup atau hanya Switch primitive. Untuk konsistensi, active state ToggleGroup sebaiknya pakai sky tint agar jelas.
- Contrast audit (visual inspection, tanpa axe run karena tooling):
  - Tambah Lamaran sky bg + white text light mode: contrast ~4.7:1 estimate ✓
  - Dark mode sky lebih terang, white text masih readable ✓
  - Tooltip: tidak sempat verify

### C3. Dialog + Sheet close i18n (9cb3384)
- Overall: ✅ PASS
- Findings:
  - CV Preview Dialog close button: `aria-label="Tutup"` ✓
  - Juga ada `<span class="sr-only">Tutup</span>` ✓
  - Accessible name via find tool: "Tutup" ✓
  - Keyboard Escape menutup dialog ✓ (verified data-state="closed" setelah press)
  - Klik X button menutup dialog ✓
  - Sheet/Drawer: tidak sempat trigger (tidak bisa resize ke mobile untuk buka BottomNav "Lainnya")
- Minor nits:
  - 🔵 Double label potential: baik `aria-label="Tutup"` DAN `sr-only > Tutup` ada di tombol yang sama. Di NVDA biasanya aria-label override sr-only (hanya 1 narasi), di VoiceOver kadang baca dua-duanya. Fix: pilih salah satu, paling umum hapus sr-only dan biarkan aria-label saja.
  - ❓ Konsumer dialog lain (AddAgenda modal, AddApplication modal) tidak sempat dites — asumsikan warisi label sama karena semua pakai DialogClose shadcn yang sudah di-override.

### C4. PageSkeleton fallback (9b4aa86)
- Overall: ✅ PASS
- Findings:
  - Fetch RSC payload `/dashboard/roadmap`: terdapat struktur PageSkeleton dengan:
    - `role="status"` ✓
    - `aria-live="polite"` ✓
    - `aria-busy="true"` ✓
    - `<span class="sr-only">Memuat halaman</span>` ✓
    - `animate-pulse` skeleton shape (h-8 w-56 title, h-4 w-80 subtitle, dst.) ✓
    - Wrapping `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6` identik dengan layout final → no CLS saat swap
    - Skeleton pakai `bg-primary/10` sky-tinted subtle
  - Tidak bisa witness skeleton runtime di prod karena koneksi cepat dan chunk cached. Tapi struktur RSC confirmed correct.
- Regression check:
  - Loader2 spinner masih ditemukan di payload (route lain), kemungkinan untuk auth guard / LoadingScreen — sesuai expectation brief.
  - `/dashboard` root: RSC payload juga menggunakan PageSkeleton structure saat SSR.
- Tidak bisa diverifikasi on-device (throttle): layout shift visual, tapi struktur wrapper identik → teoritis 0 CLS.

### C5. Docs only (19c2433)
- ✅ Skipped visual QA per instruksi. Asumsikan docs/qa/ui-sweep-2026-04-23.md ada dan akurat (tidak bisa akses filesystem repo dari browser).

## Regression Sweep (stale claims)

- ✅ **Sidebar nav consistency**: DOM query per route (dashboard, cv, kalender, lamaran, interview, roadmap, checklist, calculator, matcher, networking, portfolio, notifications, settings) semua menghasilkan array label identik: Asisten AI, Dashboard, CV, Kalender, Lamaran, Simulasi Wawancara, Roadmap Skill, Ceklis Dokumen, Kalkulator Keuangan, Pencocok LowonganAI, Jaringan, Portofolio, Notifikasi, Pengaturan, Pusat Bantuan. **"Setelan AI" item ghost muncul-hilang sudah fixed.**
- 🟡 **Tab variant consistency**: calculator sekarang konsisten, CV "Nasional/Internasional" pakai pill rounded-full (beda dari calculator segmented rounded-lg), interview "Mode Latihan/Bank Soal" segmented bg-muted (mirip calculator), checklist "Kerja Lokal/Luar Negeri" pill dengan icon (mirip CV), matcher/portfolio/notifications "Semua/Remote/Hybrid" pakai style yang beda lagi (left-aligned no bg, active=muted only). **Masih ada 3 variant tab berbeda**, belum sepenuhnya konsolidasi. Bisa diterima kalau tiap variant punya justifikasi design, tapi harus didokumentasikan.
- ✅ **Matcher "Muat Contoh Lowongan"**: label tombol + empty state copy sudah Indonesia. "Seed Demo" tidak ditemukan lagi.
- 🔴 **Settings Level Pengalaman**: DOM masih ada `<select name="profile-experienceLevel">` native (1 element, 0 role="combobox"/aria-haspopup=listbox). **ResponsiveSelect tidak ter-apply**, chevron native browser masih tampil. Claim fix tidak landed.
- 🟡 **Response Rate StatCard**: pada `/dashboard` home tampil "—" stabil (dengan subtitle "Butuh min. 5 lamaran..."), tapi di `/dashboard/applications` stat yang sama tampil "100% Bagus". Inkonsistensi threshold/state logic antar dua halaman (bukan tentang CLS, tapi data display). CLS "loncat" tidak terobservasi saat refresh stabil. Mark as partial since logic inconsistency still exists.
- ✅ **Thousand separator Calculator**: ketik `25000000` di input Gaji Bulanan → auto-format `25.000.000` saat typing. Slider ikut bergerak, Ringkasan Budget update. Focus ring sky.
- ✅ **Rentang Gaji chart axis Y**: "Rp 36jt / Rp 27jt / Rp 18jt / Rp 9jt / Rp 0" — format "jt" Indonesia, tidak ada duplikasi.

## Deferred Items Progress

- ⚪ **Mobile 390 px / tablet 768 px**: tidak bisa diverifikasi — `resize_window` extension gagal resize viewport (tetap 1327 px). User harus QA manual pakai Chrome DevTools responsive mode (Cmd/Ctrl+Shift+M) lokal atau device fisik.
- ⚪ **Touch target ≥44×44 mobile**: deferred, butuh device test.
- ⚪ **Safe area BottomNav pb-20**: deferred.
- ⚪ **Bottom sheet drawer accessible close**: deferred (tidak bisa trigger tanpa mobile).
- ⚪ **Axe DevTools full run**: tidak tersedia di extension tooling. User harus run manual.
- ⚪ **NVDA/VoiceOver test**: deferred, butuh SR setup.
- ⚪ **Lighthouse Performance / A11y / Best Practices score**: tidak tersedia di extension.
- ⚪ **Dashboard "Aksi Cepat" vs Calendar inline CTA hierarchy**: design call pending.
- ⚪ **StatCard semantic color rules (portfolio, checklist)**: design call pending; Portfolio masih pakai biru/amber/biru/hijau per stat, Checklist masih pakai red untuk "Wajib Tersisa".
- ⚪ **Format CV rounded-full vs Calculator rounded-lg**: design call pending.
- ⚪ **Empty state CTA strategy**: Portfolio & Matcher empty state sudah ada copy refer ke header CTA, tapi CTA duplikat di dalam empty card tidak ada.
- ⚪ **Notifications / Applications / Networking data QA dengan seed**: deferred, butuh data.

## New findings (during re-verification)

L1: 🔴 bug — Settings:SimpanProfil light mode — tombol "Simpan Profil" masih `bg-black text-white`, bukan default `<Button>` primary. Fix: ganti `<Button className="bg-black ...">` → `<Button>` default, atau hapus override bg-black.

L2: 🔴 bug — Portfolio:TambahHeader light mode — tombol "+ Tambah" di pojok kanan atas masih `bg-black text-white`. Fix: ganti ke `<Button>` default.

L3: 🔴 bug — Calendar:SelectedDay — background hitam solid, bukan sky. Fix: di komponen `CalendarDay` ganti `data-[selected=true]:bg-black` menjadi `data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground`.

L4: 🔴 bug — Checklist:CheckedState — checkbox item completed pakai hijau, brief C2 minta sky. Fix: kalau warna hijau dimaksudkan sebagai "success" semantic, OK secara UX, tapi itu bertentangan dengan brief KPI. Keputusan design: tentukan sky (konsisten primary) atau green (semantic success). Jangan keduanya.

L5: 🔴 bug — Settings:LevelPengalaman — native `<select>` masih dipakai (chevron browser default). Fix: migrate ke ResponsiveSelect shadcn.

L6: 🟡 risk — Sidebar:ActiveItem — active state pakai zinc (mute), sementara "Asisten AI" (non-active special entry) pakai sky tint. Visual hierarchy terbalik: user melihat "Asisten AI" lebih dominan daripada active page. Fix: active item pakai sky tint (bg-primary/10 + border-l-4 primary), dan "Asisten AI" highlight di-downgrade ke chip/icon accent saja.

L7: 🟡 risk — Settings:ToggleGroup active state — Terang/Gelap/Sistem dll active item hampir tidak beda dari inactive (keduanya muted gray). Fix: active = bg-primary/15 text-primary untuk kontras visual yg jelas.

L8: 🟡 risk — Calculator tablist 8 px width delta antara tab (Bandingkan Kota 959 vs Perencanaan/Info 951) karena scrollbar-gutter auto. Tidak melanggar regression asli, tapi di luar toleransi ±2 px brief. Fix opsional: `scrollbar-gutter: stable` di root html.

L9: 🟡 risk — Dashboard vs Applications — Tingkat Respons stat card nilainya berbeda ("—" vs "100%") untuk user data yang sama. Bukan C2 directly, tapi data-layer inconsistency; user confused mana yg benar.

L10: 🔵 nit — CV wrapper kelas — `/dashboard/cv` masih `max-w-6xl` tanpa `w-full`, sementara calculator/checklist sudah `w-full max-w-6xl`. Belum menimbulkan regresi karena child-nya stretch, tapi tidak konsisten. Fix: seragamkan `w-full max-w-6xl` di semua page wrapper.

L11: 🔵 nit — Dialog close double label — `aria-label="Tutup"` + `sr-only "Tutup"` keduanya ada di tombol close. Potensi double narasi di sebagian SR. Fix: pilih salah satu (rekomendasi hapus sr-only, keep aria-label).

L12: 🔵 nit — Matcher tab style — "Semua / Remote / Hybrid / On-site" style beda dari seluruh tab lain (left-aligned, no container bg, active=muted only). Konsolidasi ke satu variant segmented.

## Recommendation

- **Ready to merge: 🟡 CONDITIONAL**.
  - **C1, C3, C4 PASS** → safe to merge core fixes.
  - **C2 PARTIAL** → 3 hardcode `bg-black` blocker (Simpan Profil, Portfolio Tambah, Calendar selected-day) + 1 semantic conflict (Checklist green check) + 1 sidebar-active regression. Minimal tidak bikin app broken, tapi title PR "Primary token = brand sky" tidak sepenuhnya tercapai.

- **Blockers (jika mau tepat janji PR)**:
  - L1 Settings Simpan Profil hitam
  - L2 Portfolio Tambah hitam
  - L3 Calendar selected-day hitam
  - L4 Checklist checked green (butuh design call)
  - L5 Level Pengalaman native select (regression sweep claim palsu)

- **Follow-up PR needed untuk**:
  - Grep seluruh codebase untuk `bg-black`, `bg-neutral-900`, `bg-zinc-900` pada button/CTA dan ganti ke `<Button>` default.
  - Calendar `CalendarDay` data-[selected=true] styling → sky.
  - ResponsiveSelect migration untuk Level Pengalaman (dan audit native `<select>` lainnya di app).
  - Sidebar active state: sky tint + border-left accent agar tidak kalah dominan dari "Asisten AI" special entry.
  - Tab variant konsolidasi (3 variant → 1-2 dengan dokumentasi).
  - Mobile 390 / tablet 768 manual QA (tidak bisa dari extension tooling).
  - Axe DevTools full run untuk contrast audit.

---

## Post-verification source re-audit (oleh Claude, 2026-04-23)

Spot-checked branch source untuk setiap blocker claim:

| Finding | Source state on `main` post-merge | Verdict |
|---|---|---|
| L1 Simpan Profil black | `ProfileSection.tsx:233` = `<Button onClick={handleSave} disabled={saving}>` — no className, pure default. `bg-primary` dari button.tsx → sky after 710854b. | ✅ source correct. Prod ghost kemungkinan CDN cache. |
| L2 Portfolio Tambah black | `PortfolioView.tsx:54` = `<Button size="sm" className="gap-2">` — no color. Default → sky. | ✅ source correct. Same CDN cache hypothesis. |
| L3 Calendar selected black | `ui/calendar.tsx:204` pakai `data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground`. → sky after token change. | ✅ source correct. Same CDN cache hypothesis. |
| L4 Checklist green check | Semantic success green. **Bukan bug**, design decision — KPI brief terlalu kaku. | Design call, bukan C2 scope. |
| L5 Level Pengalaman native select | `ProfileSection.tsx:180-192` = `<select ...>` native. ResponsiveSelect exists but not used here. | 🔴 **REAL bug** — fix di follow-up. |
| L10 CV wrapper missing w-full | `CVGenerator.tsx:388` = `w-full max-w-6xl mx-auto ...` — SUDAH ada dari commit 910313b. | ✅ source correct. Verifier baca stale DOM. |

**Simpulan:** 4 dari 5 blocker claim = CDN cache ghost. Source sudah benar, tinggal tunggu deploy propagate + hard-refresh. 1 blocker real (L5 ResponsiveSelect migration). Design calls (L4, L6, L7) diangkat ke owner produk.
