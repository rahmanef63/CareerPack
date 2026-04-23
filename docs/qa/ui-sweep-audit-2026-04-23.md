# UI/UX Audit — 2026-04-23 (Desktop + Mobile, Combined Report)

**Auditor:** Claude (browser-extension agent)
**Environment:** production https://careerpack.org
**Commit SHA verified:** CSS bundle `a02fafd3715178a7.css` — `--primary:199 89% 48%` (light) / `199 89% 55%` (dark). Zero solid `.bg-black` on buttons; only overlay variants `\/40 \/50 \/80`. ✅
**Breakpoints covered:**
- **Desktop:** 1327×806 and 1372×870 (Win64 Chromium)
- **Mobile:** 414×896 viewport, iOS Safari UA, dpr=2, in-page CSS viewport 373×806 after sidebar/scrollbar deltas
- **Tablet 768:** still **DEFERRED** — tooling can switch between two viewports but not into a precise iPad portrait; verify in DevTools Responsive Mode before release.
**Tools used:** Chrome (Win64) v147 + simulated iOS Safari, JS console, fetch-based CSS/RSC inspection. axe DevTools / NVDA / Lighthouse not available — those KPIs deferred.
**Time spent:** ~50 min combined.

## Pre-flight

- [x] Cache-bust verified: every route appended `?_=mN` query string. (Initial Settings desktop pass returned a stale native `<select>` for `experienceLevel`; after cache-bust it's the correct `<button>` ResponsiveSelect — same trap as §0.1 of the prompt warns about.)
- [x] Deploy verified: prod CSS exposes correct sky token in both modes.
- [x] Logged in as Demo User `rahmanef63@gmail.com` with seed data (1 Tokopedia application, 9-item checklist, 3 skills, CV ~67%).

## Summary

**Verdict: 🟡 CONDITIONAL.** Desktop passes cleanly — all 9 known regressions in §1 verified clean. Mobile passes the macro layout (sidebar→BottomNav swap, drawers, responsive table, 1-col stat stacks) and key tokens (sky CTA, Calendar selected day, dialog→bottom-sheet swap) but introduces **2 🔴 layout/accessibility blockers** and **5 🟡 risks** that did not exist on desktop. Recommend follow-up PR before tagging release for mobile-first traffic.

Counts:
- 🔴 bug: **2 desktop-clean, 4 mobile-only** = 4 mobile blockers
- 🟡 risk: **4 desktop, 5 mobile-additional** = 9 total
- 🔵 nit: **3 desktop, 2 mobile-additional** = 5 total
- ❓ q: 2 design-call questions

## Findings — Mobile (NEW, not in desktop sweep)

### 🔴 bug

`🔴 bug: calculator:TabsList mobile 414 — "Perencanaan Budget" overflows its 122px tab cell and is visually clipped on the left ("erencanaan Budget"); "Bandingkan Kota" same treatment on the right ("Bandingkan Kot"). Tab has whitespace-nowrap + min-w-0 + auto-cols-fr grid-cols-3, but text-overflow:clip and tablist scrollWidth equals clientWidth so no scroll affordance either. → Add truncate (text-ellipsis) to TabsTrigger when variant=equal AND container width / cols < 140px, OR shorten labels on mobile ("Budget" / "Gaji" / "Kota"), OR switch this 3-tab to variant=pills below sm breakpoint.`

`🔴 bug: cv:Editor cards mobile 414 — body.scrollWidth=392 on viewport=373 → 19px horizontal page overflow visible as bottom scrollbar. Offending elements: the rounded-xl border bg-card section cards (Informasi Pribadi, Pengalaman Kerja, Pendidikan) report rightEdge=392 inside a 365px wrapper. → Audit those Card children for fixed min-width or grid-cols that don't collapse below sm. Add overflow-x:hidden on <main> as a stop-gap.`

`🔴 bug (a11y): matcher:HeaderCTA mobile 414 — "Muat Contoh Lowongan" is reduced to icon-only download button at 41w × 32h. Both dimensions < WCAG 2.5.5 minimum 44×44. The empty-state copy "Klik 'Muat Contoh Lowongan'" then refers to a button whose label is no longer visible on mobile. → Either keep the text label (it fits 414w easily), or expand padding to ≥44×44 and add aria-label="Muat contoh lowongan" (currently null aria-label, label only via visually-hidden inner text).`

`🔴 bug (a11y): portfolio + jaringan + (likely) other slices:HeaderCTA mobile 414 — "Tambah" is reduced to icon-only "+" button at 40w × 32h. Same WCAG fail as Matcher. Empty-state copy "Klik Tambah di atas untuk mulai" breaks the same way. → Same fix; this is systemic — likely one Button component in shared HeaderCTA primitive.`

### 🟡 risk

`🟡 risk (a11y): all pills TabsList mobile 414 — Pills tab buttons measure 28px tall across Matcher, Portfolio, Jaringan, Notifikasi (consistent: variant=pills produces h-7 ~28px). WCAG 2.5.5 minimum 44×44. Width is fine (67-95). → Bump pills variant to min-h-11 (44px) on mobile, or wrap each tab in a 44-tall pressable area while keeping the visual pill compact.`

`🟡 risk: drawer + sheet:CloseButton mobile 414 — Lainnya bottom-sheet drawer's Tutup close X is 16×16 (the icon size; class="absolute right-4 top-4 rounded-sm" with padding:0). The visible "ring" around it is the focus-visible ring, not padding. WCAG fail. Same Sheet/Drawer primitive likely affects every slice that uses ResponsiveDialog → drawer mode. → Wrap close icon in a 44×44 hit-area button.`

`🟡 risk: header:ThemeToggle mobile 414 — Desktop SiteHeader exposes a one-tap "Ganti tema" button. On mobile the SiteHeader is replaced with the page h1 area only — no theme toggle anywhere except 3 taps deep (Lainnya → Pengaturan → Tampilan). Feature parity loss. → Add the theme toggle to the mobile top-bar or to the BottomNav AI-FAB long-press menu.`

`🟡 risk: cv:PratinjauCV bottom-sheet mobile 414 — Drawer opens with drag handle but no visible close X. Drag-to-dismiss is iOS/Android-native but motor-impaired or one-handed users have no alternative close affordance. Escape key works (verified) but mobile keyboards rarely have it. → Add a visible Tutup button in the sheet header.`

`🟡 risk: home + applications:Tingkat Respons cross-page (carries over from desktop) — Dashboard shows "—" + "Butuh min. 5 lamaran"; Applications shows "100%" for the same metric. Same on mobile. → Centralize in one selector with one threshold rule.`

### 🔵 nit

`🔵 nit: settings:Level Pengalaman option label mismatch mobile 414 — Trigger displays raw value "junior" (lowercase) instead of the matching option label. None of the 4 popover options ("Entry (0-2 thn)" / "Menengah (2-5 thn)" / "Senior (5+ thn)" / "Lead / Principal") match the seeded value "junior", so the trigger falls back to the raw value. Same on desktop; just more obvious on mobile because the field is the focal element. → Either map "junior" to "Entry" in the value set, or update demo seed.`

`🔵 nit: settings:Skill chip "Tambah minat" placeholder mobile 414 — Placeholder "Tambah minat (contoh: Open Source)" truncates to "Tambah minat (contoh: Open Sourc…" because the input width (paired with the +-icon button) is too narrow on 414. → Either shorten the placeholder ("Tambah minat (contoh: AI)") or stack the + button below the input on < sm.`

### ❓ q

`❓ q: applications:Table mobile 414 — Tanggal + Catatan columns are display:none, but data is preserved in the row's action menu (Lihat catatan opens drawer with notes). Should there also be a row-tap-to-expand to show Tanggal inline, or is action-menu access sufficient? Confirm with product.`

`❓ q: checklist:Optimistic check persistence mobile 414 — KTP item was checked on desktop (stats moved 0%→17%); after a hard navigation to mobile it reset to 0%. Either Convex didn't persist (test data caveat) or the optimistic write was rolled back silently. → Reproduce with logging; if real, file as 🔴.`

## Findings — Desktop (carried from prior report)

### 🟡 risk
- `🟡 risk: home + applications:StatCard "Tingkat Respons" desktop — same metric, divergent thresholds (already listed above for mobile cross-cut).`
- `🟡 risk: home:StatCard icon-wrap inconsistency desktop — "Wawancara" uses bg-accent while siblings use bg-{semantic}/20.`
- `🟡 risk: notifications:Header copy — informal "Kamu sudah pantau semua" vs formal "Anda" elsewhere.`
- `🟡 risk: home:Tren Lamaran chart desktop — flat baseline at 0 with 1 lamaran reads as broken. Add empty-data overlay.`

### 🔵 nit
- `🔵 nit: home:Chart axis labels desktop — Recharts ticks not locale-aware (en short month names).`
- `🔵 nit: settings:Profile Bio seed text — English seed in id-locale UI (demo fixture).`
- `🔵 nit: applications:row "Catatan" desktop — English seed "Second interview scheduled.".`

### ❓ q (carried)
- `❓ q: cv:Format toggle vs other tab variants — segmented-pill canonical for compact 2-choice?`
- `❓ q: roadmap:Category chip English/Indonesian naming policy?`

## Per-commit / per-fix verification (KPI scorecard for the §1 exclusion list)

| ID | Expected | Desktop | Mobile | Notes |
|---|---|---|---|---|
| SIDEBAR-SSOT | Full MORE_APPS list consistent | ✅ | ✅ | Mobile equivalent: Lainnya drawer renders all 11 MORE_APPS items in 4-col grid with proper labels + AI badge on Pencocok Lowongan. |
| CTA-BLACK | Buttons sky never black | ✅ | ✅ | Verified: Tambah Lamaran (home + applications), Tambah (portfolio + jaringan), Tambah Agenda (calendar), Simpan Profil (settings), Mulai Sesi (interview), Calendar selected day "23"/"25" sky in dark. |
| TAB-VARIANT-API | 3 variants only | ✅ | 🟡 | Variants honored (equal/pills/segmented). But equal-variant clipping on Calculator at 414 → 🔴 above. |
| CALC-TAB-WIDTH | ±2px across sub-tabs | ✅ (951/951/951) | 🔴 | Tablist 382, tabs 122/122/122 — equal width holds, BUT longest label "Perencanaan Budget" overflows visually. The desktop fix (910313b) didn't account for narrow viewports. |
| DIALOG-CLOSE-EN | aria-label="Tutup" | ✅ | 🟡 | Desktop dialog has aria-label="Tutup" + sr-only "Tutup". Mobile bottom-sheet (CV preview) has NO visible close X, only drag handle. Escape key still works. |
| SKELETON-SPINNER | PageSkeleton not Loader2 | ✅ inferred | ✅ inferred | No spinner observed during navigation between any of the 13 dashboard routes on either viewport. |
| LEVEL-SELECT-NATIVE | ResponsiveSelect | ✅ (after hard-refresh) | ✅ | Custom-chevron trigger button on both. Popover opens with 4 typed options. Note: mobile shows raw value "junior" (🔵 above). |
| SCROLLBAR-JITTER | ±2px across sub-pages | ✅ | ✅ | Mobile has its own ~17px page overflow on CV (🔴 above) but unrelated to scrollbar-gutter. |
| MATCHER-SEED-DEMO | "Muat Contoh Lowongan" | ✅ full text | 🔴 | Desktop renders full label. Mobile reduces to icon-only download glyph at 41×32 with no aria-label — copy in empty state then becomes confusing. |

## Per-slice mobile breakdown

- **/dashboard** — 4 stat cards stack 1-col, each 364×88. BottomNav 5-slot (Dashboard / CV / AI-FAB 56×56 / Kalender / Lainnya), all aria-labeled in Indonesian. AI FAB ✅. Chart present, same empty-data risk.
- **/dashboard/cv** — Format CV pills fit. PageSkeleton not seen. **🔴 19px horizontal overflow** from card sections. Pratinjau CV opens as bottom-sheet drawer (drag handle, ✅) but no close X (🟡). Format-Nasional (Indonesia) badge in preview, name + summary + experience + education render correctly.
- **/dashboard/calendar** — Tambah Agenda sky CTA full label. Calendar grid 7-col day labels Sen-Min, selected day "23" sky in dark mode ✅. "Kamis, 23 April" + Tambah Agenda inline. "Akan Datang" stacks below.
- **/dashboard/applications** — 4 stats stack. Tambah Lamaran sky ✅. Daftar Lamaran table responsive: Tanggal + Catatan columns display:none on mobile, data still in DOM. Aksi `…` opens bottom-sheet drawer with 6 status radios + "Lihat catatan" + "Hapus Lamaran" (destructive). Touch targets ~70h ✅.
- **/dashboard/roadmap** — 15 chips reflow 2-col, ~155×110 each. Frontend Development active sky outline ✅.
- **/dashboard/checklist** — 2-tab equal Kerja Lokal / Kerja Luar Negeri fits cleanly. 4 stat cards stack 1-col with semantic colors. Filter Kategori sidebar collapses ABOVE the document list (was beside on desktop). Pengingat callout card ✅.
- **/dashboard/interview** — Mode Latihan / Bank Soal 2-tab fits. (Visual not re-captured; same equal-variant short-label = OK.)
- **/dashboard/calculator** — 3-tab 122/122/122. **🔴 label clipping** on "Perencanaan Budget" + "Bandingkan Kota". Sliders sky, currency `Rp 15.000.000`, semantic Ringkasan Budget cards stack 1-col.
- **/dashboard/settings** — 3-tab Profil Akun / Tampilan / AI & Integrasi at 116/116/116, no clip. Inputs stack 1-col. Level Pengalaman ResponsiveSelect ✅ (raw value "junior" 🔵). Skill / Minat chip inputs work, placeholder truncation 🔵. Simpan Profil sky CTA bottom-right above BottomNav. Tampilan tab: Mode Tampilan / Gaya Tombol AI / Ukuran Huruf 3-button ToggleGroups stack vertically with Pratinjau preview card.
- **/dashboard/matcher** — Pills tab Semua/Remote/Hybrid/On-site fits. **🔴 icon-only Muat Contoh Lowongan**. Empty state ✅.
- **/dashboard/networking** — 4 stat cards 2-col grid (was 4-col desktop). Search + 5-pill tab. **🔴 icon-only "+" Tambah** same as Portfolio. Empty state ✅.
- **/dashboard/portfolio** — 4 stat cards 2-col. Pills tab. **🔴 icon-only "+" Tambah**.
- **/dashboard/notifications** — Pills tab Semua / Belum dibaca / Penting (28h 🟡). Bell-off empty icon ✅. "Kamu" subtitle 🟡.
- **/dashboard/help** — not specifically re-captured; sidebar/Lainnya entry "Pusat Bantuan" present in drawer.

## Per-commit / per-fix verification (Desktop, carried from prior pass)

All 9 items in §1 exclusion list verified clean on desktop. Tablist widths: Calculator 951/3=312, Settings 768/3=251, Checklist 951/2=470 — all equal-variant uniform. Pills auto-width on Matcher / Notifikasi / Jaringan. Segmented rounded-full on CV Format. Sidebar 14 items + brand link, aria-current="page" correct.

## Lighthouse / axe DevTools / NVDA

**Not available in extension.** Required before tagging release:
- Lighthouse Performance + A11y + Best Practices + SEO per slice on mobile profile (target ≥90).
- axe DevTools full scan per slice on both viewports (target 0 critical/serious, ≤2 moderate). The 🔴 touch-target findings above will likely show up as serious in axe.
- NVDA / VoiceOver keyboard-only walk on Settings + CV editor (highest density) on both viewports.

## Tablet 768 — still DEFERRED

Tooling can switch between desktop 1372 and mobile 414, but not into a precise iPad portrait. Re-run before merge. Specific 768 invariants to verify:
- Sidebar: collapsed icon-rail or hidden? (Tailwind `lg:` breakpoint = 1024 — at 768 the mobile BottomNav should still render.)
- StatCard layout: probably still 2-col (md breakpoint switch).
- Tablist labels: "Perencanaan Budget" should fit at 768 (each tab ~250px), so the clipping is mobile-only.
- Pratinjau CV dialog: at 768 should switch back to centered Dialog instead of bottom-sheet — verify.

## Mobile invariants that PASSED

- BottomNav fixed at y=733 (just above safe area), 5 slots, all aria-labeled Indonesian ✅
- AI FAB 56×56 sky, centered, accessible ✅
- `<main>` paddingBottom = 88px clears BottomNav + FAB safely ✅
- Lainnya bottom-sheet drawer with 11 MORE_APPS items in 4-col grid + AI badge ✅
- Aksi-row dropdown swaps to bottom-sheet drawer with row-status radios + Lihat catatan + Hapus Lamaran destructive ✅
- Pratinjau CV dialog swaps to bottom-sheet drawer with drag handle ✅
- Sidebar Filter Kategori (Checklist) collapses ABOVE content list — proper responsive stack ✅
- Calendar grid full-width with selected day sky ✅
- Stat-card layouts: 4-col → 2-col (Portfolio, Jaringan), 4-col → 1-col (Dashboard, Lamaran, Checklist) — all preserve semantic colors ✅
- Roadmap 15-chip grid: 7-col → 2-col, all chips ≥110h ✅
- Form fields: 2-col → 1-col stacks, full-width inputs ✅
- Sky brand color holds across both viewports in dark mode ✅
- Indonesian copy preserved everywhere ✅
- Currency / date formatting preserved (Rp 15.000.000, Kamis 23 April) ✅

## Recommendation

- [ ] Ready to tag release: **NOT YET** for mobile-first traffic. **YES** if traffic is desktop-only.
- [x] Blocking items (must fix before release on mobile):
  1. **🔴 calculator:TabsList equal-variant text overflow** — minimal fix is `truncate` class on TabsTrigger when narrow; ideal fix is variant-pills swap below sm.
  2. **🔴 cv:Editor 19px horizontal overflow** — track down the offending Card section min-width.
  3. **🔴 matcher / portfolio / jaringan icon-only HeaderCTA** — restore visible label OR expand to 44×44 with proper aria-label. This is one shared component, one fix for all 3 slices.
- [x] Strongly-recommended (a11y compliance):
  4. **🟡 pills TabsList 28h** — bump to min-h-11 on mobile.
  5. **🟡 Sheet/Drawer Tutup close X 16px** — wrap in 44×44 hit area.
  6. **🟡 mobile theme toggle missing** — add to mobile top-bar.
  7. **🟡 Pratinjau CV mobile no visible close X** — add Tutup button to sheet header.
- [x] Follow-up PR (carry-over from desktop, can land separately):
  - Centralize Tingkat Respons threshold rule.
  - Normalize StatCard icon-wrap to consistent `bg-{semantic}/20`.
  - Notifikasi subtitle "Kamu" → "Anda".
  - Tren Lamaran empty-data overlay.
  - Recharts axis `id-ID` locale.
  - Demo fixture cleanup: Indonesian Bio + Catatan + Level Pengalaman value mapping.
- [x] Next audit: after the 7 items above land + after Tablet 768 sweep + after axe/Lighthouse run.

**Lessons recorded for future runs:**
1. **Always cache-bust every navigation** during a deploy QA — `?_=ts` query string on every URL. Settings native-`<select>` desktop ghost would have been a false 🔴.
2. **Mobile vs desktop are different audits, not subsets.** All 9 known regressions in §1 were verified clean on desktop, but 4 NEW 🔴 bugs surfaced on mobile that no desktop pass would have caught — the icon-only HeaderCTA, the Calculator tab clipping, the CV horizontal overflow, and the Matcher empty-state copy mismatch. Don't merge mobile-relevant changes from desktop-only verification.
3. **Touch-target audits need both viewport sweeps + WCAG measurement.** The 🟡 systemic 28h pills tab + 16px Sheet close X were invisible on desktop where pointer accuracy is high; on mobile they're real-world failures.
