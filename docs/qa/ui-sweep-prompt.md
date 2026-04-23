# QA UI/UX Audit Prompt — CareerPack (v2)

**Target:** UI/UX regression audit per deploy or per major PR on `careerpack.org`.
**Auditor:** human tester or UI-focused agent with browser access.
**Session-based:** copy the section below into the auditor context. Re-use as-is; append lessons learned at the end after each run (§9).

**Change log vs v1:** this version codifies lessons from the 2026-04-23 audits (PR #3/#4/#5). Major adds: §0.3 viewport-innerWidth validation; §0.5 horizontal-overflow element-identification protocol; §1 expanded exclusion list; §2.3 responsive-tab-label math; §2.8 WCAG 2.5.5 vs 2.5.8 explicit; §2.14 feature-parity checklist desktop↔mobile; §4 terse-finding enforcement; §9 lessons-learned template.

---

```
============================================================
COPY EVERYTHING BELOW THIS LINE INTO THE AUDITOR PROMPT
============================================================

# QA UI/UX Audit — CareerPack

**Target:** `https://careerpack.org` (or preview URL)
**Session convention:** append `?_=<timestamp>` to every URL you visit to defeat CDN caching. Skip this and you WILL file ghost bugs (verified twice).

## §0. Pre-flight (mandatory, do not skip any sub-step)

### §0.1 Cache bust
- Clear site data for `careerpack.org`: Chrome DevTools → Application → Clear storage → Clear site data.
- Open a fresh Incognito/Private window.
- Every route navigation: include `?_=<unix_ts>` query string to bypass edge cache.
- If using an automation extension, set `Cache-Control: no-cache` on the fetch.

### §0.2 Confirm deploy is live
```bash
# Get current prod CSS bundle URL
curl -s https://careerpack.org/ | grep -oE '/_next/static/css/[^"]+\.css' | head -2

# Verify token values in compiled CSS
curl -s https://careerpack.org/_next/static/css/<hash>.css | grep -oE '\-\-primary:[^;]+'
# Expected light: --primary:199 89% 48%  (brand sky)
# Expected dark:  --primary:199 89% 55%

# No solid bg-black buttons:
curl -s https://careerpack.org/_next/static/css/<hash>.css | tr '}' '\n' | grep -E 'bg-black[^\\]|background-color:#000'
# Expected: ONLY overlay /40 /50 /80 matches. Zero solid.
```
If CSS bundle hash does NOT match `git rev-parse origin/main` commit artifact → deploy not propagated → **ABORT** and retry later. Do not file bugs against an unverified deploy.

### §0.3 Viewport validation — THIS IS WHERE AUDITS FAIL
After resizing to a target breakpoint:
```js
// Paste in DevTools Console
console.log({
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
  devicePixelRatio: window.devicePixelRatio,
  matchMedia_sm: matchMedia('(min-width: 640px)').matches,
  matchMedia_md: matchMedia('(min-width: 768px)').matches,
  matchMedia_lg: matchMedia('(min-width: 1024px)').matches,
});
```
`innerWidth` MUST match the target (±15 for scrollbar). If it shows your desktop width while you think you're in "mobile mode," **your tool is lying**. Automation extensions that resize only the outer browser chrome produce this failure. Abort and switch to DevTools Responsive Mode or a physical device.

### §0.4 Login + seed data
Login as test user. Verify seed data loaded: 1+ applications, 1 CV with content, 5+ skills, 5+ roadmap items checked, 1+ notification. Sparse data hides empty-state + overflow bugs.

### §0.5 Horizontal overflow — identify the offender, don't just measure
If `document.body.scrollWidth > window.innerWidth`, do NOT file a bug that says "19px horizontal overflow" alone. Walk the DOM:
```js
// Paste in DevTools Console — lists elements that extend past viewport
const vw = window.innerWidth;
[...document.querySelectorAll('*')]
  .filter(el => el.getBoundingClientRect().right > vw + 1)
  .map(el => ({
    el: el.tagName + (el.className ? '.' + (typeof el.className === 'string' ? el.className.split(' ')[0] : '') : ''),
    right: Math.round(el.getBoundingClientRect().right),
    width: Math.round(el.getBoundingClientRect().width),
  }))
  .slice(0, 10);
```
Name the offending element(s) in the bug. A finding without a named offender is an observation, not a bug.

### §0.6 Breakpoints you MUST cover
- Desktop 1440×900 (baseline)
- Desktop 1920×1080 (widescreen)
- Tablet 768×1024 portrait
- Mobile 390×844 (iPhone 12-class)
- Mobile 360×740 (Android baseline)

Tools that actually resize viewport:
- ✅ Chrome/Firefox DevTools Responsive Mode (`Cmd/Ctrl+Shift+M`)
- ✅ Physical device via USB + Safari/Chrome Remote Inspect
- ❌ Any extension that fails §0.3 check

Theme: cover **light AND dark** per slice. Do not sample.
Font-scale: verify `lg` once per slice (biggest layout stress).

---

## §1. Known-issue exclusion — DO NOT re-file these as bugs

Regressions only. If one of these broke again, report with "REGRESSION of <ID>" prefix.

| ID | Finding | Resolved in |
|---|---|---|
| SIDEBAR-SSOT | Sidebar items changing across routes | 021bc18 |
| CTA-BLACK | Default Button renders black instead of sky | 710854b (token cascade) |
| TAB-VARIANT-API | Raw TabsList className overrides | 4112d9b + 2b3db6e |
| CALC-TAB-WIDTH | Bandingkan Kota tablist shrinking 775→481px | 910313b |
| DIALOG-CLOSE-EN | "Close" announced to screen readers | 9cb3384 + 79e1573 |
| SKELETON-SPINNER | Generic Loader2 as route fallback | 9b4aa86 |
| LEVEL-SELECT-NATIVE | Settings experienceLevel native `<select>` | f4496e6 |
| SCROLLBAR-JITTER | ~15px width delta across subpages | e08b980 |
| MATCHER-SEED-DEMO | "Seed Demo" English label | eb2d257 |
| CALC-MOBILE-CLIP | "Perencanaan Budget" clipped in 3-col tabs at 414px | c82a238 |
| CV-MOBILE-OVERFLOW | CV editor 19px horizontal overflow at 414px | c82a238 (stop-gap `overflow-x-hidden`) |
| HEADERCTA-ICONONLY | "+ Tambah" / "Muat Contoh Lowongan" icon-only on mobile | c82a238 |
| TAB-TOUCH-H9 | Pills TabsList 28px fails WCAG 2.5.5 | 7dfcbf0 (h-11 sm:h-9) |
| DIALOG-CLOSE-HIT | Dialog/Sheet close icon 16×16 fails WCAG | 7dfcbf0 |
| DRAWER-NO-CLOSE | Mobile bottom-sheet no visible close X | 7dfcbf0 |
| MOBILE-THEME-PARITY | Theme toggle 3 taps deep on mobile | 3979a6e (slim top bar) |

### Design-calls deferred — escalate to product, do NOT file as bugs
- Checklist checked state semantic green vs brand sky.
- Sidebar active token (zinc vs sky; shadcn default vs brand continuity).
- Settings ToggleGroup active-state subtlety.
- Marketing routes 15px scrollbar gutter right-edge (accepted tradeoff for layout stability).
- Tingkat Respons threshold logic (Dashboard "—" vs Applications "100%") — cross-slice, needs one spec.

---

## §2. KPI matrix

Score each KPI per slice: ✅ PASS / 🟡 PARTIAL / 🔴 FAIL / ⚪ N/A.

### §2.1 Visual consistency
- Typography scale followed. No arbitrary px.
- Colors via tokens only (`primary`, `secondary`, `muted`, `destructive`, `brand`, `career-*`, semantic `success`/`warning`/`info`). No hex in components.
- Radius: input/button `rounded-md`, card `rounded-lg`, badge/avatar `rounded-full`.
- Icon size rules: 16 inline-text, 20 inside button, 24 section header.
- Max 3 shadow levels (sm/md/lg).

### §2.2 Container & layout
- Every slice root wrapper: `w-full max-w-<N>xl mx-auto px-4 sm:px-6 lg:px-8 py-*`. Missing `w-full` → report.
- Max-width: dashboard pages `max-w-6xl`, Settings `max-w-3xl`, Calendar `max-w-5xl`, hero/admin `max-w-7xl`.
- Vertical rhythm via `space-y-*` / `gap-*`, not ad-hoc margins.
- Mobile: paddingBottom clears BottomNav + FAB (var(--nav-height) + var(--safe-bottom) + 1rem pattern).

### §2.3 Tab consistency + responsive-label math
- Every `<TabsList>` uses `variant="equal|pills|segmented"`. Raw className overrides = bug.
- For `variant="equal" cols=N`: measure longest label width at worst-case viewport:
  ```
  label_px_needed < (viewport - 2×horizontal_padding) / N - trigger_padding(~24px)
  ```
  If fails on any target breakpoint, require responsive short labels OR variant swap to `pills` below that breakpoint.
- Pills tab height: 44px mobile, 36px desktop (post TAB-TOUCH-H9 fix).

### §2.4 Responsive
- `< lg (1024)`: MobileContainer renders slim top bar (brand + theme) + BottomNav + FAB + MoreDrawer.
- `≥ lg`: DesktopContainer renders Sidebar + SiteHeader.
- Transition smooth on live resize.
- Touch target per WCAG:
  - **AA (2.5.8):** 24×24 minimum for all interactive elements.
  - **AAA (2.5.5):** 44×44 target. CareerPack brand policy = **AAA**.
  - Measure via DevTools Inspect → Computed width/height. Flag if any < 44 on mobile.
- Landscape mobile (812×390) survives.

### §2.5 Navigation
- `PRIMARY_NAV` sidebar items: Dashboard, CV, Kalender. `MORE_APPS`: 11 items. No others.
- Active state (`aria-current="page"`) on exactly one item per route.
- Nav item labels identical across all 13 dashboard routes — hard-refresh each, screenshot, compare.
- Breadcrumb in SiteHeader matches `labelForPath(pathname)`.

### §2.6 Form & input
- Label above input, required `*` in `text-destructive`.
- Input height uniform `h-10` default.
- Error state: `border-destructive` + helper text `text-destructive text-sm` below.
- Disabled: `opacity-50 cursor-not-allowed`.
- Selects: `ResponsiveSelect` only. Verify: `document.querySelectorAll('select').length === 0` in slices.
- Chip inputs: Enter adds, X removes, no dup.

### §2.7 Feedback states
- Loading: shape-aware `PageSkeleton` for route-level; inline `Skeleton` for sub-sections. Auth/guard still uses LoadingScreen.
- Empty: icon + Indonesian copy + optional CTA. No blank screens.
- Error: actionable Indonesian message.
- Toast: bottom-right, 3-5s auto-dismiss.
- Optimistic: no flash-rollback.

### §2.8 Accessibility (WCAG AA floor, AAA target)
- **Run axe DevTools per slice on BOTH viewports**. 0 critical, 0 serious, ≤2 moderate. Attach JSON export per slice.
- Contrast: text ≥4.5:1, large text ≥3:1 (DevTools Inspect → Accessibility → Contrast).
- Focus ring visible: tab through entire slice.
- Icon-only buttons: all have `aria-label` (Indonesian).
- Dialog: focus trap + Escape close + focus returns to trigger.
- Drawer/bottom-sheet dismiss trio: visible close X + drag handle + Escape. Drag-only = FAIL.
- Landmark roles: header/nav/main/aside clear.
- `prefers-reduced-motion`: respect.

### §2.9 Dark mode
- Every slice rendered in dark — full KPI re-run.
- No hardcoded white/black in slices.
- Borders visible (not blending).
- Recharts palette readable both modes.

### §2.10 Font scale & density
- Test `sm | md | lg` in Settings.
- At `lg`: no overflow, no CTAs wrapping 2 lines.

### §2.11 i18n
- All UI Indonesian. Grep leaks: "Close", "Open", "Save", "Cancel", "Submit", "Search", "Filter", "Edit", "Delete", "Add", "Remove", "Update", "Loading", "Saved", "Error".
- Date `id-ID` ("23 April 2026").
- Number `id-ID` ("1.234.567,89").
- Currency: "Rp 15.000.000" (space + dots).
- Recharts `tickFormatter` with Intl.NumberFormat('id-ID') for axis labels.

### §2.12 Performance signals
- **Lighthouse per slice on mobile profile, attach HTML/JSON.** Target: Perf ≥85, A11y ≥95, Best Practices ≥90.
- CLS < 0.1 on initial load.
- LCP < 2.5s on Fast 3G throttle.
- PageSkeleton visible on Slow 3G throttle.

### §2.13 Edge cases
- Empty: new user — every slice renders meaningful state.
- Long text: 500-char name/bio paste — truncate via `line-clamp-*`, no overflow.
- Broken image URL: avatar fallback.
- Offline: WebSocket drops, reconnect indicator.
- 100+ items list: scroll perf, no jank.

### §2.14 Feature parity desktop ↔ mobile (NEW in v2)
Enumerate equivalents. Mobile must expose the feature in ≤2 taps OR flag as parity gap.

| Feature | Desktop location | Mobile expected |
|---|---|---|
| Theme toggle | SiteHeader | MobileContainer top bar ✓ |
| User menu | SiteHeader | ?? (currently missing — design-call if flagged) |
| Breadcrumb | SiteHeader | page h1 substitutes |
| AI assistant entry | SiteHeader + Sidebar | AI FAB ✓ |
| Sidebar nav | Desktop Sidebar | BottomNav + MoreDrawer |
| Admin link | UserMenu (role=admin) | ?? (design-call) |
| Search | ?? (future) | ?? |

### §2.15 Seed data vs component bug (NEW in v2)
Before filing a bug on "wrong value displayed":
1. Check `convex/seed*.ts` / demo fixture for the current value.
2. If seed has invalid value (e.g., `experienceLevel: "junior"` vs EXPERIENCE_OPTIONS `entry|mid|senior|lead`), file as **seed-fixture bug**, not component bug.
3. Component is correct if it falls back to raw value when no option matches.

---

## §3. Per-slice deep dive

Run KPI 2.1–2.15 + slice specifics:

### `/dashboard` (home)
- 4 stat cards: desktop 4-col, tablet 2-col, mobile 1-col.
- CTAs: "Tambah Lamaran" + "Tambah Agenda" brand sky.
- Tren Lamaran chart: empty-data overlay if < N data points.

### `/dashboard/cv`
- Editor accordion sections.
- Preview Dialog (desktop) / Drawer (mobile) with visible close X both modes.
- Ctrl+P native print still works.
- Export PDF → `cv-<name>.pdf`.
- Drag reorder experience + skills: smooth.
- `variant="segmented"` Nasional/Internasional tab.
- Mobile: no horizontal scroll (overflow-x-hidden stop-gap applies).

### `/dashboard/calendar`
- Calendar selected day: brand sky (not black).
- Event list grouped by day.

### `/dashboard/applications`
- Filter icon-only has `aria-label="Filter status"`.
- Status badge semantic colors.
- Response rate matches Dashboard home value (or explicit threshold spec).
- Add-application via ResponsiveDialog.
- Mobile: Tanggal + Catatan hidden, row-action drawer accessible.

### `/dashboard/roadmap`
- 13 category chips contrast pass per chip.
- Progress card (streak + completion).
- `PageSkeleton` on throttle load.

### `/dashboard/checklist`
- `variant="equal" cols=2`: Kerja Lokal / Kerja Luar Negeri.
- Filter Kategori: desktop sidebar, mobile stacks above.
- Checked state color = per design call (not auto-flagged sky).

### `/dashboard/interview`
- Start-session gate, timer accurate.
- Mulai Rekam primary sky, Aktifkan Kamera outline.
- Refresh mid-session: resume or reset (confirm spec).

### `/dashboard/calculator`
- `variant="equal" cols=3`: Perencanaan Budget / Info Gaji / Bandingkan Kota (responsive short labels mobile: Budget/Gaji/Kota).
- Tablist width identical ±2px across 3 subpages.
- Gaji auto-format `15000000` → `15.000.000`.
- Rentang Gaji chart axis: "Rp Njt".
- Slider sky.

### `/dashboard/settings`
- `variant="equal" cols=3` tabs.
- Profile: Level Pengalaman = ResponsiveSelect, skill/minat chip, bio Textarea.
- **Settings → Tampilan expected to include**: theme, nav style, AI button style, font scale, density. Live-update.
- API key warning + reset confirm dialog.

### `/dashboard/matcher`
- `variant="pills"`: Semua/Remote/Hybrid/On-site.
- "Muat Contoh Lowongan" full label both viewports.

### `/dashboard/networking` / `/portfolio` / `/notifications`
- "+ Tambah" / "Bersihkan" / etc. labels visible both viewports.
- Pills tabs min-h-11 mobile.

### Admin + marketing
- `/admin` role-gated.
- `/`, `/login` logout first to audit.

---

## §4. Output format (enforced terse)

Save to `docs/qa/ui-sweep-audit-YYYY-MM-DD.md`:

```markdown
# UI/UX Audit — YYYY-MM-DD

**Auditor:** <name>
**Environment:** <prod/preview/local>
**Commit SHA:** <from §0.2 verified>
**Breakpoints:** <list with innerWidth measurements>
**Tools:** <browser version / axe version / NVDA version / device>
**Cache-bust:** ✅ confirmed per §0.1
**Deploy verified:** ✅ per §0.2

## Summary

X/Y KPIs PASS. N blockers (🔴), M risks (🟡), K polish (🔵), Q design-calls (❓).

## Findings — terse, ONE LINE per finding

Format: `[severity] <slice>:<component> <breakpoint> — <problem>. <fix>.`

Severity:
- 🔴 bug: broken user flow, incident-class.
- 🟡 risk: fragile / inconsistency / WCAG AA borderline.
- 🔵 nit: polish.
- ❓ q: design question (NOT a bug — escalate).

Examples:
🔴 bug: calculator:TabsList mobile 390 — "Perencanaan Budget" clipped at tab width 122px. Add responsive short labels or variant="pills" below sm.
🟡 risk: cv:AISaranChip dark 1440 — contrast 3.2:1 < WCAG AA 4.5:1. Darken bg-brand-muted or lighten text.
🔵 nit: home:HeroEmoji mobile — wave emoji flat rendering in dark. Non-blocking.
❓ q: checklist:CheckedState — semantic green or brand sky? Confirm with product.

No narrative paragraphs per finding. Group by severity, then by slice.

## Per-KPI × slice scorecard

| Slice | 2.1 | 2.2 | 2.3 | 2.4 | 2.5 | 2.6 | 2.7 | 2.8 | 2.9 | 2.10 | 2.11 | 2.12 | 2.13 | 2.14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| home | ✅ | ✅ | ⚪ | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | 🟡 | ⚪ | ✅ |
| cv | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |
(...13 rows)

## axe DevTools

| Slice × breakpoint | Critical | Serious | Moderate | Minor |
|---|---|---|---|---|
| home desktop | 0 | 0 | 2 | 5 |
| home mobile 390 | ... | ... | ... | ... |
(...26 rows)

Attach JSON exports.

## Lighthouse (mobile profile)

| Slice | Perf | A11y | Best Pr | SEO |
|---|---|---|---|---|
| home | 94 | 100 | 92 | 100 |
(...)

Attach HTML reports.

## Screenshots

Before/after for any tablist width, color/contrast, or mobile layout finding.
Store `docs/qa/screenshots/YYYY-MM-DD/<slice>-<label>.png`.

## Design-calls surfaced (not bugs)

- ...

## Regressions detected (items from §1 exclusion that broke)

- ...

## Recommendation

- [ ] Ready to tag release: YES / NO
- [ ] Blockers: <list with severity IDs>
- [ ] Follow-up PR: <list>
- [ ] Deferred (tooling / device / design): <list>
- [ ] Next audit: <YYYY-MM-DD> (after <condition>)
```

---

## §5. Escalation rules

- 🔴 bug → GitHub issue immediately, labels `bug` + `qa`.
- 🟡 risk → GitHub issue, labels `risk` + `qa`. Can bundle.
- 🔵 nit → issue `polish`. Low priority.
- ❓ q → comment on QA doc, do NOT file issue until answered.
- Design-calls → product owner on the triage doc.

---

## §6. What NOT to do

- ❌ Do not file "bg-black button" bugs without curling prod CSS per §0.2. 3/3 prior audits showed 100% cache ghosts.
- ❌ Do not file "sidebar item missing" without hard-refreshing + cache-bust per §0.1.
- ❌ Do not file "tab style inconsistent" if slices use different `variant` prop legitimately — pills vs equal vs segmented are INTENTIONAL.
- ❌ Do not audit mobile via any tool that fails §0.3 viewport check.
- ❌ Do not file "horizontal overflow" without naming the offending element per §0.5.
- ❌ Do not re-file §1 exclusion items without "REGRESSION" prefix.
- ❌ Do not paste multi-paragraph narratives per finding. One line only. Group by severity.
- ❌ Do not flag "raw value displayed" without §2.15 seed check first.
- ❌ Do not merge desktop-only verification as sufficient for mobile-relevant changes.
- ❌ Do not claim axe/Lighthouse "looks fine" without attached report. If you can't run it, label DEFERRED.

---

## §7. Tooling checklist

- [ ] Chrome (latest) + Chrome DevTools
- [ ] axe DevTools extension (free tier)
- [ ] Lighthouse (built into DevTools)
- [ ] NVDA (Windows) or VoiceOver (Mac)
- [ ] Firefox (cross-browser sanity)
- [ ] Safari (macOS + iOS Simulator for edge CSS cases)
- [ ] Physical device: one iPhone + one Android (optional but strong)
- [ ] `curl` + `jq` on CLI for §0.2 + §0.5
- [ ] Screenshot tool (native OS)
- [ ] Optional: Playwright/Puppeteer for automated visual regression

### Tool gotchas
- **Extension viewport claims**: always verify §0.3 `window.innerWidth`. Multiple extensions resize only outer chrome.
- **CDN cache on production**: Dokploy / Cloudflare serve stale CSS for up to 5 min after deploy. Verify §0.2 hash.
- **Browser cache on auditor side**: Incognito + `?_=<ts>` mandatory.
- **axe "needs review" !== pass**: treat as serious until manually verified.

---

## §8. Time budget

| Section | Time |
|---|---|
| §0 Pre-flight + §0.3 viewport check | 15 min |
| §2 Desktop KPI sweep all slices | 90 min |
| §2 Mobile 390 KPI sweep | 90 min |
| §2 Tablet 768 KPI sweep | 45 min |
| §2.8 axe per slice × 2 viewports | 60 min |
| §2.12 Lighthouse per slice × mobile | 30 min |
| §3 Per-slice deep dive + edges | 60 min |
| §4 Write report + attach artifacts | 45 min |
| §9 Lessons-learned append | 10 min |
| **Total** | **~7.5 hours** |

Skip breakpoints your tool can't verify. Label those sections DEFERRED explicitly. Do not infer mobile layout from desktop DOM.

---

## §9. Lessons-learned template (auditor appends after each run)

Append to bottom of the audit report. These feed the next iteration of this prompt.

```markdown
## §9 Lessons learned — <YYYY-MM-DD>

1. **What went wrong that v2 didn't protect against:**
   - e.g., "viewport resize worked via DevTools but touch events didn't fire on hover-only elements — need § to require real touch events"

2. **False positives I almost filed:**
   - e.g., "Settings experienceLevel appeared as native select at first visit — §0.1 cache-bust caught it second visit"

3. **New KPI to add:**
   - e.g., "PWA manifest validity + install prompt"

4. **Exclusion list additions:**
   - <commit SHA> <finding>

5. **Tooling friction:**
   - e.g., "Lighthouse throttle didn't simulate Indonesian 3G baseline accurately; used Fast 3G as proxy"

6. **Time actuals:**
   - Section: <est vs actual>
```

============================================================
COPY EVERYTHING ABOVE THIS LINE INTO THE AUDITOR PROMPT
============================================================
```

## How to use this file

1. **Before deploy:** auditor pulls this prompt, copies the block inside the fence.
2. **During audit:** auditor runs per sections. Saves findings to `docs/qa/ui-sweep-audit-YYYY-MM-DD.md`.
3. **After audit:** auditor appends §9 lessons.
4. **Next iteration:** maintainer folds §9 into this prompt's §1 exclusion list and/or §2 KPIs. Bump version in header. Commit.

## Version history

- **v2** (2026-04-23): after PR #3/#4/#5. Adds §0.3 viewport validation, §0.5 overflow offender-naming protocol, §2.3 tab-label math, §2.8 WCAG AA/AAA split, §2.14 feature-parity table, §2.15 seed vs component distinction, §4 terse-finding enforcement, §9 lessons template. Expanded §1 exclusion list with 7 new IDs.
- **v1** (2026-04-23 earlier): initial prompt after PR #3 merge. Basic KPI matrix, per-slice dive, output format.
