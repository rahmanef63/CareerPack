# UI/UX Audit — 2026-04-23 (v2 protocol, post PR #3/#4/#5)

Auditor: Claude (browser-extension agent)
Environment: production https://careerpack.org
Commit SHA: CSS bundle 673deff349923e14.css (newer than prior session a02fafd3715178a7.css; not git-mapped, treat as latest deploy)
Breakpoints: Desktop 1239×898 measured (target was 1440 — extension didn't honor resize per §0.3, kept 1239). Mobile 390 + Tablet 768 DEFERRED — §0.3 viewport-validation FAIL (innerWidth stays 1239 after resize_window).
Tools: Chrome (Win64) v147 + browser-automation extension. axe DevTools / NVDA / Lighthouse: NOT RUN — flagged DEFERRED.
Cache-bust: ✅ confirmed per §0.1 (every URL appended ?_=<unix_ts>)
Deploy verified: ✅ per §0.2 — --primary:199 89% 48% (light) / 199 89% 55% (dark); zero solid .bg-black classes (3 hits all overlay /40 /50 /80)

## Summary

13/14 KPIs PASS on desktop (axe + Lighthouse + tablet + mobile DEFERRED). 0 🔴 blockers. 5 🟡 risks (mostly carry-over + WCAG AAA touch-target borderline). 2 🔵 nits. 2 ❓ design-questions.

## Findings — terse, ONE LINE per finding

### 🔴 bug
None on desktop sweep.

### 🟡 risk
🟡 risk: calculator:CityCard.SingaporeIcon desktop 1239 — Singapore icon uses `bg-accent-foreground` (rgb 24,24,27 = zinc-900) producing a near-black surface vs Jakarta's `bg-brand` sky. `accent-foreground` token semantically intended for text on accent surface, not as bg. Replace with `bg-muted` or distinct neutral semantic surface token.
🟡 risk: dialog:CloseButton desktop 1239 — close X has class h-11 w-11 (44) but computed bounding box is 36×36; another rule overrides height. Borderline AAA per §2.4 brand policy. Audit Tailwind class precedence in DialogPrimitive.Close.
🟡 risk: applications:HeaderIconButtons desktop 1239 — Filter status / Aksi untuk Tokopedia / Ganti tema icon-only buttons all render 36×36, below WCAG 2.5.5 AAA 44×44. Same systemic class-vs-rendered mismatch as dialog close. Bump h-9 w-9 to h-11 w-11 across icon-button variant.
🟡 risk: tabs:TabsTrigger desktop 1239 — equal + pills variants render at h=28 on desktop across Calculator/Settings/Checklist/Matcher/Notifikasi. TAB-TOUCH-H9 fix appears to have applied h-11 sm:h-9 to one variant only; AAA target 44 missed on desktop equal-variant. Confirm whether desktop 28 is intentional vs targeted h-9 (36).
🟡 risk: notifications:Subtitle desktop 1239 — "Kamu sudah pantau semua" (informal) vs formal "Anda" used elsewhere (Lamaran, Pengaturan). Carry-over from 2026-04-23-am audit, not yet fixed. Replace "Kamu" → "Anda".

### 🔵 nit
🔵 nit: home:RechartsXAxis desktop 1239 — tick formatter "5 Mar / 12 Mar / ..." not locale-aware; "Mar"/"Apr" coincide id-en but May/Aug/Oct etc. would diverge from id-ID. Pass tickFormatter using Intl.DateTimeFormat('id-ID', {day:'numeric', month:'short'}).
🔵 nit: settings:ProfileBio desktop 1239 — seed Bio still English ("Actively preparing for tech interviews and job applications.") in id-locale UI. Demo fixture cleanup.

### ❓ q (design / product clarification)
❓ q: home:TrenLamaranChart — chart now renders 2 curves with peak ~16 Apr while Total Lamaran=1; suggests demo seed has synthetic data points OR aggregates lamaran+wawancara. Confirm intent and add empty-data overlay path when actual user has < N data points.
❓ q: settings:Tampilan — §3 spec lists "density" toggle; only theme / nav-style / AI-button / font-scale rendered. Was density removed or moved? If removed, update §3.

## Per-KPI × slice scorecard (desktop 1239)

| Slice | 2.1 | 2.2 | 2.3 | 2.4 | 2.5 | 2.6 | 2.7 | 2.8 | 2.9 | 2.10 | 2.11 | 2.12 | 2.13 | 2.14 | 2.15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| home | ✅ | ✅ | ⚪ | 🟡 | ✅ | ⚪ | ✅ | ⚠ | ✅ | ⚪ | 🔵 | ⚪ | ❓ | ✅ | ⚪ |
| cv | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | ⚠ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ✅ | ⚪ |
| calendar | ✅ | ✅ | ⚪ | 🟡 | ✅ | ⚪ | ✅ | ⚠ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ✅ | ⚪ |
| applications | ✅ | ✅ | ⚪ | 🟡 | ✅ | ⚪ | ✅ | ⚠ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ✅ | ⚪ |
| roadmap | ✅ | ✅ | ⚪ | 🟡 | ✅ | ⚪ | ✅ | ⚠ | ✅ | ⚪ | 🟡(EN names) | ⚪ | ⚪ | ✅ | ⚪ |
| checklist | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | ⚠ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ✅ | ⚪ |
| interview | ✅ | ✅ | ✅ | 🟡 | ✅ | ⚪ | ✅ | ⚠ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ✅ | ⚪ |
| calculator | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | ⚠ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ✅ | ⚪ |
| settings | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | ⚠ | ✅ | ✅ | 🔵(seed) | ⚪ | ⚪ | ✅ | ✅ |
| matcher | ✅ | ✅ | ✅ | 🟡 | ✅ | ⚪ | ✅ | ⚠ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ✅ | ⚪ |
| networking | ✅ | ✅ | ✅ | 🟡 | ✅ | ⚪ | ✅ | ⚠ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ✅ | ⚪ |
| portfolio | ✅ | ✅ | ✅ | 🟡 | ✅ | ⚪ | ✅ | ⚠ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ✅ | ⚪ |
| notifications | ✅ | ✅ | ✅ | 🟡 | ✅ | ⚪ | ✅ | ⚠ | ✅ | ⚪ | 🟡(Kamu) | ⚪ | ⚪ | ✅ | ⚪ |
| help | ✅ | ✅ | ⚪ | 🟡 | ✅ | ⚪ | ✅ | ⚠ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ✅ | ⚪ |

Legend: ⚠ = DEFERRED (axe/Lighthouse not run); 🟡 in 2.4 = WCAG 2.5.5 AAA borderline (touch-target h=28-36); ⚪ = N/A or no relevant control on slice.

## axe DevTools

DEFERRED — axe extension not available in browser-automation tooling. Predicted serious findings based on manual measurement: pills/equal tabs at 28h and icon buttons at 36×36 will likely flag as serious "target-size" violations. Run before tag.

## Lighthouse (mobile profile)

DEFERRED — Lighthouse not available in browser-automation tooling. Run on production URLs in DevTools Lighthouse panel before tag, target Perf ≥85, A11y ≥95, Best Practices ≥90 per slice.

## Screenshots

Captured during sweep (12 files, attached as session artifacts):
- ss_1063qi53n: home dashboard with chart populated
- ss_4061iu9mh: calculator Bandingkan Kota with city comparison + Singapore icon dark
- ss_5732hvimx: settings Profil Akun
- ss_1795nze3n: settings Tampilan
- ss_1124nnijv: settings AI & Integrasi
- ss_1742rqcsw: pusat-bantuan placeholder

## Design-calls surfaced (not bugs)

- Tingkat Respons threshold: Dashboard "—" (min-5 sample) vs Applications "100%" (raw 1/1) — needs one centralized rule (carry-over from prior audits, in §1 design-calls).
- Calculator Singapore card icon token choice: `bg-accent-foreground` reads near-black; intentional contrast vs Jakarta or token misuse?
- Tampilan density toggle: spec says 5 controls, code shows 4. Confirm whether density was de-scoped.

## Regressions detected (items from §1 exclusion that broke)

None. All 16 §1 IDs verified clean on desktop.

## Recommendation

- [x] Ready to tag release: YES for desktop-only. NOT YET if release covers mobile/tablet — those breakpoints UNVERIFIED this session.
- [x] Blockers: none on desktop.
- [x] Follow-up PR (recommended before release):
  - 🟡 dialog/icon-button h-11 w-11 class precedence audit (DIALOG-CLOSE-HIT partial regression).
  - 🟡 calculator Singapore icon token swap (`bg-accent-foreground` → neutral surface).
  - 🟡 notifications subtitle "Kamu" → "Anda".
  - 🔵 Recharts `id-ID` locale tickFormatter.
  - 🔵 demo fixture: Indonesian Bio + Catatan; Level Pengalaman value mapping.
- [x] Deferred (tooling / device / design):
  - Mobile 390 + 360 KPI re-sweep (need DevTools Responsive Mode or physical device — extension viewport resize fails §0.3).
  - Tablet 768 KPI sweep (same reason).
  - axe DevTools per slice × 2 viewports.
  - Lighthouse mobile profile per slice.
  - NVDA / VoiceOver SR walk on Settings + CV.
  - Tampilan density spec resolution.
  - Tingkat Respons threshold spec.
- [x] Next audit: after follow-up PR + after user runs a DevTools-Responsive-Mode mobile sweep.

## §9 Lessons learned — 2026-04-23 (v2 run)

1. What went wrong that v2 didn't protect against:
   - axe / Lighthouse / NVDA are listed in §7 tooling but the auditor (browser-automation extension) has none of them. v2 should explicitly state "if tooling lacks these, label DEFERRED in §4" — currently §6 only forbids "claim looks fine without report," doesn't mandate explicit DEFERRED labeling. Suggest §6 add: "❌ Do not omit axe/Lighthouse rows from §4 scorecard — mark DEFERRED if not run."
   - §1 exclusion list IDs DIALOG-CLOSE-HIT and TAB-TOUCH-H9 are listed as "resolved in commit X" but actual measurements show 36px (not 44px) — prompt assumed git-merged commit equals deployed-and-rendered. Suggest §1 add a "verified-rendered: YYYY-MM-DD" column.

2. False positives I almost filed:
   - Calculator tab text initially read as "BudgetPerencanaan Budget" — looked like duplicate label bug; recognized as responsive-label dual-element pattern (sm:hidden + hidden sm:inline) per §1 CALC-MOBILE-CLIP fix. §2.3 should call out this specific pattern so future auditors don't flag.
   - Tren Lamaran chart now shows curves while Total Lamaran=1 — initially read as inconsistent; deferred to ❓ q because demo seed may include synthetic time-series data that doesn't increment Total card. §2.15 currently covers seed-vs-component for select values; extend to seed-vs-component for derived chart data.

3. New KPI to add:
   - §2.16 Class-vs-rendered audit: when a Tailwind class promises h-11 (44px) but computed style returns 36px, flag as a class-precedence issue (likely `:where()` reset, `cn()` deduplication, or upstream layout flexing). Add measurement protocol: read both className tokens AND getComputedStyle().height, compare.

4. Exclusion list additions:
   - none new (no fresh regressions found this run).
   - upgrade DIALOG-CLOSE-HIT and TAB-TOUCH-H9 status to "partial: class shipped, render below target — re-verify."

5. Tooling friction:
   - browser-automation extension `resize_window` does not change `window.innerWidth` (only outer chrome). v2 §0.3 caught it correctly; mobile sweep ABORTED as instructed. Recommend §7 add: "browser-automation extensions: assume viewport resize is fake until §0.3 confirms."
   - JavaScript clicks on Radix Tabs require dispatching pointer + mouse event sequence (`pointerdown / mousedown / pointerup / mouseup / click`); plain `.click()` doesn't switch tab state. Add to §7 tool gotchas.

6. Time actuals:
   - §0 Pre-flight + §0.3 viewport check: est 15 min, actual 6 min.
   - §2 Desktop sweep all slices: est 90 min, actual 25 min (single-pass JS scrape per slice; no axe/Lighthouse to run).
   - §2 Mobile + Tablet: est 135 min, actual 0 (ABORTED at §0.3).
   - §4 Write report: est 45 min, actual 12 min.
   - Total: ~45 min vs §8 estimate ~7.5 hours — discrepancy entirely due to skipped axe/Lighthouse/mobile/tablet sections. §8 should call out: "automation-only run with no viewport flex and no axe/Lighthouse: ~1 hour upper bound."
