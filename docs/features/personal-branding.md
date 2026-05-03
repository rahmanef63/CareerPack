# Personal Branding (Public Profile Builder)

> **Portability tier:** XL — slice + portfolio backend integration + theme system + iframe-template hydrator + public profile route.

## Tujuan

Builder halaman profil publik (`/[slug]`) untuk personal branding —
mode otomatis (auto-build dari CV + Profil + Portofolio) atau manual
(drag-style block builder), pilih theme, atur SEO/indexing, ekspor ke
HTML standalone atau snippet iframe embed. Slug unik global, validasi
real-time.

## Route & Entry

- URL builder: `/dashboard/personal-branding`
- URL public profile: `/[slug]` — page `frontend/app/[slug]/page.tsx` (catch-all marketing route, di-resolve via `api.profile.queries.getBySlug`)
- Slice: `frontend/src/slices/personal-branding/`
- Komponen utama: `PersonalBrandingView.tsx` (~250 baris orchestrator)

## Struktur Slice

```
personal-branding/
├─ index.ts                                       export { PersonalBrandingView }
├─ blocks/
│  └─ types.ts                                    Block, HeaderBg, PersonalBrandingTheme, TEMPLATE_THEMES
├─ builder/                                       Manual block builder
│  ├─ AddBlockMenu.tsx                            Type picker popover
│  ├─ BlockFields.tsx                             Field router per block type
│  ├─ BlockList.tsx                               Re-orderable block tree
│  ├─ BlockPresetsCard.tsx                        Quick-insert preset bundles
│  ├─ HeaderBgPicker.tsx                          Header background editor
│  ├─ ThemePicker.tsx                             Theme card grid
│  ├─ blockDefaults.ts                            Default block payload per type
│  ├─ blockPresets.ts                             Curated block bundles
│  └─ block-fields/
│     ├─ types.ts
│     ├─ simpleFields.tsx                         text/heading/paragraph/divider
│     ├─ linkFields.tsx                           link, button, social
│     ├─ mediaFields.tsx                          image/video (storageId picker)
│     ├─ typeFields.tsx                           type-specific switches
│     ├─ containerField.tsx                       container layout
│     ├─ ContainerChildren.tsx                    nested block tree editor
│     └─ StyleChrome.tsx                          per-block style overrides
├─ components/
│  ├─ PersonalBrandingView.tsx                    Top tab bar (Otomatis/Manual/Impor/HTML/Embed) + sub-tabs
│  ├─ MiniPreviewFrame.tsx                        Sandboxed iframe preview
│  ├─ PreviewDialog.tsx                           Full-screen preview
│  ├─ MobileActionBar.tsx                         Sticky save/preview FAB row
│  ├─ PBSectionNav.tsx                            Sub-section accordion nav
│  ├─ BrandingShowMoreDialog.tsx                  Mobile overflow menu
│  └─ personal-branding-view/
│     ├─ AutoTab.tsx                              Auto mode wrapper (split-pane)
│     └─ ManualTab.tsx                            Manual mode wrapper (split-pane)
├─ form/                                          State machine
│  ├─ defaults.ts                                 DEFAULT_FORM_STATE
│  ├─ slugValidation.ts                           validateSlug()
│  ├─ types.ts                                    FormState, Mode, Bind, SetField
│  ├─ usePBForm.ts                                Big hook — hydrate, dirty-tracking, save, undo, demo overlay
│  └─ usePreviewBranding.ts                       Lazy preview data builder
├─ sections/                                      Auto-mode card sections (one card per concern)
│  ├─ PBSection.tsx                               Reusable accordion-card wrapper
│  ├─ IdentityCard.tsx                            slug + headline + bio
│  ├─ AvailabilityCard.tsx                        availability/status badge
│  ├─ BrandingValidationCard.tsx                  Score + jump links to fix gaps
│  ├─ ContactCard.tsx                             email / linkedin / portfolio
│  ├─ CtaCard.tsx                                 CTA button config
│  ├─ ExportCard.tsx                              Self-hosted HTML / iframe export
│  ├─ HeaderBgCard.tsx                            Header background mode picker
│  ├─ HeroTogglesCard.tsx                         Show/hide hero elements
│  ├─ IdentityCard.tsx
│  ├─ ImportCard.tsx                              Quick Fill (resume / LinkedIn paste)
│  ├─ IndexingCard.tsx                            allowIndex (robots) toggle
│  ├─ ManualBlocksCard.tsx                        Container for manual block list
│  ├─ ManualDesignCard.tsx                        Theme + style for manual mode
│  ├─ ModeWarning.tsx                             Switch-mode confirmation
│  ├─ SaveActions.tsx                             Save / Discard / Reset
│  ├─ SectionLayoutCard.tsx                       Layout density / order tweaks
│  ├─ ShareCard.tsx                               Public URL + copy + open
│  ├─ StatusBanner.tsx                            Published / Unpublished pill
│  ├─ StyleCard.tsx                               Font / radius / density
│  ├─ ThemeCard.tsx                               Theme picker
│  ├─ brandingScore.ts                            Heuristic 0–100 score
│  └─ brandingScore.test.ts                       Unit test
└─ themes/                                        Render layer
   ├─ index.tsx                                   Theme registry + dispatcher
   ├─ BlockRenderer.tsx                           Block → DOM
   ├─ BrandFooter.tsx                             "Powered by" footer
   ├─ FloatingMobileNav.tsx                       Sticky CTA on public page
   ├─ TemplateLayout.tsx                          Wrapper layout
   ├─ TemplateSkeleton.tsx                        SSR skeleton
   ├─ inject.ts                                   Inline CSS variables for theme
   ├─ types.ts
   ├─ templateHydrator.ts                         Top-level hydrate orchestration
   └─ templateHydrator/
      ├─ fillHelpers.ts                           Generic helpers
      ├─ identityFills.ts                         Slug, name, headline injection
      ├─ iframeHelpers.ts                         Sandboxed iframe handling
      ├─ manualBlocks.ts                          Manual block render path
      ├─ pageExtras.ts                            Footer / nav extras
      ├─ preamble.ts                              Pre-render scripts
      ├─ style.ts                                 Per-page style injection
      └─ truncate.ts                              Long-text safe truncation
```

## Data Flow

Backend: `convex/profile/` (sebagian besar lewat `userProfiles` row
yang sama dengan settings).

| Operasi | Convex |
|---|---|
| Load editor state | `api.profile.queries.getMyPublicProfile` |
| Save / publish | `api.profile.mutations.updateMyPublicProfile` |
| Slug live-check | `api.profile.queries.isSlugAvailable` |
| Public lookup | `api.profile.queries.getBySlug` (by route `/[slug]/page.tsx`) |
| Indexable list | `api.profile.queries.listIndexableSlugs` (sitemap) |
| Quick Fill paste | `api.ai.actions.parseImportText` → `api.onboarding.mutations.quickFill` |
| Avatar upload | `api.files.mutations.{generateUploadUrl, saveFile}` + `api.profile.mutations.updateAvatar` |
| Auto-build inputs | `api.cv.queries.getUserCVs`, `api.portfolio.queries.listPortfolio` (read-only — auto mode only) |

Auto-mode hydrates blocks from CV + portfolio + profile lewat helper
`convex/profile/autoBlocks.ts → DEFAULT_AUTO_TOGGLES` + per-toggle
fillers di `convex/profile/blocks.ts`.

`brandingPayload.ts` server-side memvalidasi block tree sebelum
persist (skema diff strict, max-length, allowed types).

## State Lokal — `usePBForm`

Hook `usePBForm.ts` (~440 lines) is the single source of truth:

- **`state: FormState`** — slug, headline, bioShow, mode, blocks[], theme, style, ctaType, header background, autoToggles, contactEmail, linkedinUrl, portfolioUrl, allowIndex, avatarShow, portfolioShow, …
- **`Bind` helpers** — typed `bind("slug").value` / `bind.boolean("allowIndex")` to wire inputs.
- **Hydration** — pulls `getMyPublicProfile`; merges with `DEFAULT_FORM_STATE`. Demo overlay (`useDemoPBOverlay`) for unauth preview.
- **Dirty tracking** — `isDirty`, `pristineRef`. `submit({ publish? })` validates → calls `updateMyPublicProfile`.
- **Slug validation** — `validateSlug(slug)` regex + `isSlugAvailable` debounced query → `SlugValidation` object (`status: idle|checking|ok|taken|invalid`).
- **Mode switch guard** — switching auto ↔ custom prompts via `<ModeWarning>` if blocks[] != defaults.

`usePreviewBranding.ts` derives a render-ready snapshot for
`MiniPreviewFrame` from the form state + auto-blocks + portfolio
items. Lazy: only re-runs when watched fields change.

## Dependensi

- `@/shared/hooks/useAuth`, `useDemoOverlay` (`useDemoPBOverlay`, `useDemoProfileOverlay`).
- `@/shared/components/files/FileUpload`, `useFileUpload`.
- `@/shared/components/onboarding/QuickFillButton`.
- `@/shared/components/brand/Logo` → `BrandMark`.
- `@/shared/components/layout/{PageContainer, PreviewSplitLayout}`.
- `@/shared/components/ui/{button,badge,card,input,label,textarea,switch,popover,progress,select,skeleton,tabs}`, `responsive-{dialog,select,page-header}`.
- `@/shared/lib/{notify, utils}`.
- `convex/react` — `useQuery`, `useMutation`.
- `convex/profile/{autoBlocks, brandingPayload, blocks}` — shared types/helpers imported from frontend (relative path `../../../../convex/profile/...`).
- `lucide-react`.

## Catatan Desain

- **Two-mode dichotomy.** "Otomatis" (computed from canonical sources) vs "Manual" (full block control). User can switch; switching from manual back to auto offers to discard custom block tree.
- **Iframe template caveat.** `themes/templateHydrator.ts` injects state via sandboxed iframe — caution when refactoring; broken hydrator means white-screen public pages. The `iframeHelpers.ts` keeps allowed origins + sandbox attrs strict.
- **Slug = global namespace.** Single index `userProfiles.by_public_slug` enforces uniqueness across all users. Reserved slugs (`/login`, `/admin`, `/dashboard`, …) blocked in `validateSlug`.
- **`brandingScore`** drives `BrandingValidationCard`: heuristic over identity completeness, contact channels, theme + media. Score < 50 surface jump-link CTA ("Isi headline") that emits `pb-jump` event → `PersonalBrandingView` opens matching accordion section.
- **Public render = pure server.** `app/[slug]/page.tsx` is fully SSR; uses `getBySlug` + `inject.ts` for theme variables. No client JS for SEO.
- **Allow-index respected.** When `allowIndex=false`, page emits `noindex` meta + Convex `listIndexableSlugs` skips it for sitemap. R3 (privacy default).
- **Block tree depth-capped.** `containerField` + `ContainerChildren` allow nesting but `brandingPayload.ts` rejects > 3 levels.
- **`ExportCard` dual export.** "HTML" produces standalone file (inline CSS, no JS). "Embed" produces `<iframe src="…/[slug]?embed=1">` that hides nav + footer.

## Extending

- Custom domains (CNAME → Convex HTTP route).
- Analytics widget (page views per public slug — table `publicProfileViews`).
- AI-driven theme suggestion based on detected role.
- More themes (currently 4: minimal / modern / bold / serif).
- Animation presets (fade / slide on scroll).

---

## Portabilitas

**Tier:** XL

**Prereq:**
- `auth.md` ported (auth + userProfiles).
- `file-upload.md` ported (avatar + media uploads).
- `portfolio.md` ported (auto-mode reads portfolio items).
- `cv-generator.md` ported (auto-mode reads CV).
- AI agent (`ai-agent.md`) recommended for Quick Fill resume parse, optional otherwise.

**Files untuk dicopy:**

```
# Slice (large)
frontend/src/slices/personal-branding/

# Public route
frontend/app/[slug]/page.tsx
frontend/app/[slug]/error.tsx       # if exists

# Shared
frontend/src/shared/hooks/useDemoOverlay.ts
frontend/src/shared/components/onboarding/QuickFillButton.tsx
frontend/src/shared/components/layout/PreviewSplitLayout.tsx
frontend/src/shared/components/brand/Logo.tsx

# Backend
convex/profile/                                            # adds public-slug fields + autoBlocks + brandingPayload
convex/onboarding/                                         # Quick Fill batch hydrator
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

mkdir -p "$DST/frontend/src/slices" \
         "$DST/frontend/app/[slug]" \
         "$DST/frontend/src/shared/hooks" \
         "$DST/frontend/src/shared/components/onboarding" \
         "$DST/frontend/src/shared/components/layout" \
         "$DST/convex/profile" "$DST/convex/onboarding"

cp -r "$SRC/frontend/src/slices/personal-branding" "$DST/frontend/src/slices/"
cp "$SRC/frontend/app/[slug]/page.tsx"             "$DST/frontend/app/[slug]/"
cp "$SRC/frontend/app/[slug]/error.tsx"            "$DST/frontend/app/[slug]/" 2>/dev/null || true
cp "$SRC/frontend/src/shared/hooks/useDemoOverlay.ts"               "$DST/frontend/src/shared/hooks/"
cp "$SRC/frontend/src/shared/components/onboarding/QuickFillButton.tsx" "$DST/frontend/src/shared/components/onboarding/"
cp "$SRC/frontend/src/shared/components/layout/PreviewSplitLayout.tsx"  "$DST/frontend/src/shared/components/layout/"

cp -r "$SRC/convex/profile/."    "$DST/convex/profile/"
cp -r "$SRC/convex/onboarding/." "$DST/convex/onboarding/"
```

**Schema additions** — `userProfiles` extends with public-profile
fields (copy verbatim from `convex/profile/schema.ts`):

```ts
// inside userProfiles
publicEnabled: v.optional(v.boolean()),
publicSlug: v.optional(v.string()),
publicHeadline: v.optional(v.string()),
publicMode: v.optional(v.string()),               // "auto" | "custom"
publicBlocks: v.optional(v.any()),                // serialized block tree
publicTheme: v.optional(v.string()),
publicStyle: v.optional(v.object({ font: v.string(), radius: v.string(), density: v.string() })),
publicHeaderBg: v.optional(v.any()),
publicAutoToggles: v.optional(v.any()),
publicContactEmail: v.optional(v.string()),
publicLinkedinUrl: v.optional(v.string()),
publicPortfolioUrl: v.optional(v.string()),
publicCtaType: v.optional(v.string()),
publicCtaLabel: v.optional(v.string()),
publicCtaUrl: v.optional(v.string()),
allowIndex: v.optional(v.boolean()),
avatarShow: v.optional(v.boolean()),
bioShow: v.optional(v.boolean()),
skillsShow: v.optional(v.boolean()),
targetRoleShow: v.optional(v.boolean()),
portfolioShow: v.optional(v.boolean()),
```

Add unique index: `.index("by_public_slug", ["publicSlug"])`.

**Convex api.d.ts** — `profile`, `onboarding`, plus auto-block helpers
re-exported via `convex/profile/blocks.ts`.

**npm deps:** none. (Themes are inline-styled; iframe sandbox is browser-native.)

**Env vars:**
- `NEXT_PUBLIC_APP_URL` — used by `ShareCard` to build the public URL.

**Nav registration:**

`dashboardRoutes.tsx`:
```ts
const PERSONAL_BRANDING: View = dynamic(
  () => import("@/slices/personal-branding").then((m) => m.PersonalBrandingView),
  { loading: loadingFallback },
);
DASHBOARD_VIEWS["personal-branding"] = PERSONAL_BRANDING;
```

`navConfig.ts`:
```ts
{ id: "personal-branding", label: "Branding", icon: Sparkles, href: "/dashboard/personal-branding", hue: "from-fuchsia-400 to-pink-600" }
```

Also wire the public route at `app/[slug]/page.tsx` — keep it OUTSIDE
the `(marketing)` and `(dashboard)` route groups so it matches at the
root.

**i18n:** Indonesian throughout — section titles ("Identitas",
"Konten", "Tampilan", "Bagikan"), validator messages
("Slug minimal 3 karakter"), button labels, tooltips.

**Common breakage after port:**

- **Public page white-screen** — `templateHydrator.ts` sandbox iframe
  depends on `inject.ts` running before block render. Check `preamble.ts`
  emits style vars BEFORE `BlockRenderer` mounts.
- **Slug "always taken"** — `isSlugAvailable` query doesn't exclude
  the current user's slug. Verify `userId` parameter compares with caller.
- **Save button always disabled** — dirty tracking bug; ensure
  `pristineRef` populates AFTER first hydration, not on initial render.
- **`autoBlocks` reads CV that has no template** — fallback empty list.
  Check `convex/profile/autoBlocks.ts → DEFAULT_AUTO_TOGGLES` defaults
  match target's CV schema.
- **Quick Fill not parsing** — server `parseImportText` action requires
  `convex/ai/actions.ts` ported + AI provider configured. Without AI,
  hide ImportCard.
- **Reserved slug clash** — keep `RESERVED_SLUGS` in `slugValidation.ts`
  in sync with target's other root routes (`/help`, `/admin`, `/api`).
- **Iframe `embed=1` mode missing styles** — `app/[slug]/page.tsx` must
  read `searchParams.embed` and conditionally hide `BrandFooter` /
  `FloatingMobileNav`.

**Testing the port:**

1. Open `/dashboard/personal-branding` → Auto tab default; status
   banner says "Belum dipublikasikan".
2. Set slug, headline → live `IsSlugAvailable` indicator turns green.
3. Toggle `publicEnabled` → Save → reload → state persists.
4. Visit `/<slug>` in incognito → public page renders; theme matches.
5. Toggle `allowIndex=false` → reload public page → `<meta name="robots" content="noindex">` present.
6. Switch to Manual → add 3 blocks → reorder → save → public page reflects manual blocks.
7. Click Quick Fill, paste resume text → AI parses → form fields populated → batch row added in `database/batches`.
8. Export HTML → file downloads, opens standalone (no broken refs).
9. Switch back to Auto → ModeWarning prompts; confirm → manual blocks discarded.

Run `_porting-guide.md` §9 checklist.
