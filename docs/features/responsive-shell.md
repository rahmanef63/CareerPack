# Responsive Shell + Responsive Primitives (Infrastructure)

> **Portability tier:** XL — not a slice. App-level layout (containers + nav SSOT + dashboard registry) plus a 14-component shadcn wrapper family. Every dashboard page and every modal in the project assumes this layer exists.

## Tujuan

Satu komponen untuk dua viewport. Tanpa lapisan ini, tiap consumer ulang
pola `if (isMobile) <Sheet>… else <Dialog>…` — bug-prone, duplikasi,
dan focus-trap berbeda di tiap call-site.

Sekali tulis pakai `ResponsiveDialog`/`ResponsiveSelect`/dst., komponen
otomatis render Drawer (vaul bottom-sheet) di < lg dan primitive shadcn
asli di ≥ lg. API surface identik dengan upstream — drop-in replacement.

## Route & Entry

- N/A (infrastructure). Wired di `frontend/app/(dashboard)/layout.tsx`:
  ```tsx
  <ResponsiveContainer>{children}</ResponsiveContainer>
  ```
- Auth pages (`/login`, `/forgot-password`, `/reset-password/[token]`)
  pakai `AuthShell` — bukan `ResponsiveContainer` — karena tidak butuh
  nav.

## Architecture overview

```
(dashboard)/layout.tsx
    └── ResponsiveContainer            ← picks shell by useIsMobile()
          ├── MobileContainer (<lg)    ← MobileTopBar + main + BottomNav + MoreDrawer
          └── DesktopContainer (≥lg)   ← AppSidebar (collapsible icon) + SiteHeader + main
              └── AIAgentConsole (global, hosted at this level)

(marketing)/login, (auth)/*
    └── AuthShell                      ← centered card, no nav

Modals/popovers anywhere in the tree:
    Responsive<Primitive> → useIsMobile() → renders Drawer | upstream shadcn
```

`useIsMobile()` is a single `matchMedia` hook (`max-width: 1023px`).
`MOBILE_BREAKPOINT = 1024` (matches Tailwind `lg:`). Returns `false`
during SSR + first render — `useState<boolean | undefined>(undefined)`
coerced via `!!isMobile`. Subscribers re-render once `useEffect` lands
the real value.

## Container map

| Container | Picked when | Renders |
|---|---|---|
| `ResponsiveContainer` | wraps `(dashboard)` route group | Switches Mobile/Desktop based on `useIsMobile()`; hosts `AIAgentConsole` so its `open` state is shared between both shells |
| `MobileContainer` | `useIsMobile()` true | `MobileTopBar` (BrandMark + ThemePresetSwitcher + MobileUserMenu) → `<main>` (with `--nav-height` + `--safe-bottom` padding) → `BottomNav` (5 slots: 2 tabs · AI FAB · Calendar · More) → `MoreDrawer` (vaul app-launcher) — wrapped by `PullToRefresh` |
| `DesktopContainer` | `useIsMobile()` false | shadcn `SidebarProvider` (defaultOpen) + `AppSidebar` (collapsible="icon") + `SidebarInset` → `SiteHeader` (breadcrumb + search + theme + AI button + UserMenu) → children → `DashboardFooter` |
| `AuthShell` | `(auth)` route group + `LoginPage` | Centered card on a brand-gradient bg; logo + title + description + content + optional footer. No viewport branching — same layout everywhere |

`MobileContainer` is `next/dynamic({ ssr: false, loading: <LoadingScreen /> })`
inside `ResponsiveContainer` so the desktop bundle never pulls
BottomNav + MoreDrawer + vaul JS.

## Responsive primitive map

All 14 wrappers live in `frontend/src/shared/components/ui/responsive-*.tsx`.
API surface mirrors the upstream component — same `Root`/`Trigger`/
`Content`/`Item` decomposition, prefixed `Responsive*`. Mode switch is
internal, propagated via React Context so child sub-components pick the
correct primitive without prop-drilling.

| Wrapper | Desktop renders | Mobile renders | Use when |
|---|---|---|---|
| `ResponsiveDialog` | shadcn `Dialog` | vaul `Drawer` (bottom) | Modal forms / detail views. `size` prop with `sm:max-w-*` presets up to `5xl` + `content` + `full`. Optional `stickyHeader` / `stickyFooter` regions that don't scroll with body |
| `ResponsiveAlertDialog` | shadcn `AlertDialog` | vaul `Drawer` | Destructive confirmations. `Action` button has `variant="destructive"` shorthand; on mobile wraps in `DrawerClose asChild` so swipe/tap closes after handler fires |
| `ResponsiveSelect` | Radix `Select` | vaul `Drawer` w/ checked-mark list | Dropdowns w/ many options. Tracks option labels via internal context so the mobile Trigger shows selected label |
| `ResponsiveCombobox` | `Popover` + `cmdk` `Command` | `Drawer` + `cmdk` `Command` (full-height) | Searchable selects (autocomplete). Opinionated: takes `options[]` array, optional `keywords[]` per option for fuzzy match |
| `ResponsiveDropdownMenu` | `DropdownMenu` | `Drawer` (ActionSheet-style) | Action menus. Subset only: Trigger, Content, Item, Label, Separator, RadioGroup, RadioItem. Sub-menus intentionally unsupported — flatten before using |
| `ResponsiveContextMenu` | Radix `ContextMenu` (right-click) | `Drawer` triggered by `contextmenu` event | Long-press / right-click menus. Trigger listens to `onContextMenu` (fires for both mouse right-click + touch long-press) and preventDefaults the native menu |
| `ResponsiveTooltip` | Radix `Tooltip` (hover) | Radix `Popover` (tap) | Help hints. Touch devices have no hover, so tooltip downgrades to a small tap-trigger Popover instead of being dead UI |
| `ResponsiveHoverCard` | Radix `HoverCard` (hover) | Radix `Popover` (tap, `w-72`) | Profile/entity rich previews. Bigger payload than Tooltip |
| `ResponsivePopover` | Radix `Popover` | vaul `Drawer` | Date pickers, complex inline panels. Centered flex on mobile so calendar grids don't get clipped |
| `ResponsiveFilterBar` | Inline flex-wrap row | `Drawer` w/ vertical stack + Reset/Apply footer | Filter chips/dropdowns row. Mobile button shows active-count `Badge` |
| `ResponsiveDataTable<T>` | shadcn `Table` (rows × cols) | Stacked `<dl>` cards (one per row, header text → `<dt>`, cell → `<dd>`) | Tabular data. Pure renderer — no built-in sort/filter/pagination, wrap with TanStack or local state. Per-column `hideOnMobile` + `hideMobileLabel` flags |
| `ResponsiveCarousel` | Same horizontal scroll-snap row + `<` `>` arrow buttons | Same row, swipe-scroll, scrollbar hidden, edge "peek" | Card carousels (top picks, browse rows). Custom — does NOT branch on viewport, single render adapts via Tailwind `lg:` classes. No embla dep |
| `ResponsiveHoverCard` (dup row above — single component) | — | — | — |
| `ResponsivePageHeader` | Inline title + actions row (`compact`); brand-gradient banner with display font (`greeting`); banner + companion card (`split`) | Same — no viewport branch | Page titles + actions. Three variants share one prop API so 10+ existing call-sites keep working. Decorative `ParangPattern` + glow orbs in greeting/split |

**Two of the wrappers don't actually branch on `useIsMobile()`** —
`ResponsiveCarousel` and `ResponsivePageHeader`. They earn the
"Responsive" prefix because their single render adapts via Tailwind
breakpoint utilities; they're co-located so consumers find the whole
family in one folder. Catalog them honestly when porting; don't assume
every `responsive-*` is viewport-branching.

`ResponsiveDialogContent` has a non-trivial detail: shadcn's
`DialogContent` ships `sm:max-w-lg` baked in. If a caller passes
`className="max-w-3xl"` (no `sm:` prefix), `twMerge` keeps both — and
`sm:max-w-lg` wins in the cascade. The `size` prop emits the proper
`sm:max-w-*` token so dedup actually fires.

## `useIsMobile()` hook contract

```ts
// frontend/src/shared/hooks/use-mobile.ts
const MOBILE_BREAKPOINT = 1024; // === Tailwind `lg`
export function useIsMobile(): boolean
```

- **Breakpoint:** `(max-width: 1023px)` — strictly < 1024, identical to
  Tailwind's `lg:` cutoff so component code reading `useIsMobile()`
  matches CSS-only utilities like `lg:hidden`.
- **SSR-safe:** initial state `undefined`, returned coerced to `false`
  via `!!isMobile`. So **server render + first client render = desktop
  layout**. Hydration mismatches don't fire because the markup matches;
  the post-mount `useEffect` re-renders to the real viewport.
- **API:** `boolean`. No options, no breakpoint override. 16 consumers
  in the codebase (slices + responsive-*).

## Nav SSOT

`frontend/src/shared/components/layout/navConfig.ts` is the **single
source of truth** for every nav surface in the app:

- `PRIMARY_NAV` — 3 entries (`home`, `cv`, `calendar`). Tabs in mobile
  BottomNav (with AI FAB inserted at slot 3, More slot 5) AND main
  group in desktop Sidebar (`<NavMain>`).
- `MORE_APPS` — 14 entries with `hue` (Tailwind gradient class), optional
  `badge` ("AI" etc.), optional `superAdminOnly`. Mobile MoreDrawer grid
  AND desktop Sidebar `<NavSecondary label="Alat Lainnya">`.
- `ALL_NAV_ITEMS = [...PRIMARY_NAV, ...MORE_APPS]`.
- `activeNavForPath(pathname)` — exact match → fall back to longest
  `startsWith(href + "/")` prefix. Both BottomNav and Sidebar use this.
- `labelForPath(pathname)` — used by `SiteHeader` breadcrumb.

Adding a dashboard page = exactly two files:
1. `dashboardRoutes.tsx` `DASHBOARD_VIEWS` map (lazy-load via `next/dynamic`)
2. `navConfig.ts` `PRIMARY_NAV` or `MORE_APPS` entry (`href` slug must
   match `DASHBOARD_VIEWS` key)

## Data Flow

N/A — this is rendering infrastructure. No queries, no mutations, no
backend. Children components drive their own data. The shell only owns
nav state (`activeNavForPath`), AI agent open-state, and the More
drawer's open-state.

## Dependensi

**Internal:**
- `@/shared/hooks/use-mobile` — viewport hook
- `@/shared/lib/utils` (`cn`)
- `@/shared/components/ui/{dialog,sheet,drawer,alert-dialog,select,tooltip,popover,dropdown-menu,hover-card,context-menu,command,table,sidebar}` — upstream shadcn primitives
- `@/shared/components/layout/*` — BottomNav, MoreDrawer, SiteHeader,
  app-sidebar, nav-main, nav-secondary, nav-user, MobileUserMenu
- `@/shared/components/interactions/{MicroInteractions,PullToRefresh}` —
  Ripple, useHapticPress, PullToRefresh wrap on mobile shell
- `@/shared/components/feedback/LoadingScreen` — fallback while
  MobileContainer chunk loads
- `@/shared/components/theme/ThemePresetSwitcher` — top-bar theme menu
- `@/shared/components/ai/AIFab`, `@/slices/ai-agent` (`AIAgentConsole`)
- `@/shared/components/pwa/InstallSidebarButton`, `@/shared/hooks/usePWAInstall`

**npm:**
- `vaul ^1.1.2` — the bottom-sheet engine all responsive-* wrappers use
- `cmdk ^1.1.1` — combobox / Command palette
- `@radix-ui/react-{dialog,alert-dialog,select,tooltip,popover,hover-card,context-menu,dropdown-menu}` — upstream shadcn primitives
- `@tanstack/react-table ^8.21.3` — only listed as a baseline dep; the
  `ResponsiveDataTable` primitive itself does NOT import TanStack.
  Caller wraps if they need sort/filter
- `lucide-react` — icons (Check, ChevronDown, X, etc.)

## Catatan Desain

- **Drawer-on-mobile** = vaul bottom-sheet, not Radix Sheet. vaul
  natively handles drag-down-to-dismiss, momentum, safe-area inset,
  iOS dvh quirks. Sheet has no gestures — losing thumb-reach UX. Side
  Sheet still exists for cases where you want a side panel on desktop
  too (`<Sheet>` upstream); responsive-sheet is intentionally NOT in
  the family because the mental model "left/right side panel that
  becomes a bottom sheet" is unusual; consumers go through
  `ResponsiveDialog` instead.
- **Why one wrapper file per primitive** instead of one polymorphic
  `<Responsive type="dialog" | "select" | …>`:
  1. Tree-shaking — only the wrappers a slice actually uses get
     bundled. Polymorphic = always pay for all 14.
  2. Prop fidelity — each upstream primitive has different props
     (Tooltip's `delayDuration`, Select's `value`/`onValueChange`,
     Combobox's `options[]`). Polymorphic forces a union type that's
     awkward at every call-site.
  3. Sub-component pairing — each wrapper has its own
     `Trigger`/`Content`/`Item` etc. that share a Context. One
     polymorphic root would need a different Context discriminator
     scheme.
- **Sheet vs Drawer decision:** "Sheet" in shadcn = side panel (Radix
  Dialog with edge animation). "Drawer" = bottom sheet (vaul). The
  responsive-* family always picks Drawer for mobile because the
  bottom edge is thumb-reachable; side sheets force one-hand reach
  across the screen.
- **SSR / hydration:** `useIsMobile()` returns `false` during SSR and
  the very first client render, so initial hydrated markup = desktop.
  Then `useEffect` flips state and the wrapper re-renders into a
  Drawer if the viewport is narrow. Trade-offs:
  - Pro: no hydration mismatch warnings (DOM matches what the server
    sent)
  - Con: a < lg viewport visibly flashes the desktop variant for one
    paint frame on first navigation. Mitigated for the **shell** by
    making `MobileContainer` a `dynamic({ ssr: false })` import with
    a `<LoadingScreen />` fallback — so mobile users see a loading
    splash instead of a flash of desktop chrome. Individual
    responsive-* wrappers don't bother — modals only render when a
    user opens them, by which time the hook has settled.
- **Active state matching:** `activeNavForPath` does exact-match first,
  then longest-prefix-match (`/applications/abc123` → `/applications`).
  The longest-prefix fallback is critical so deep links don't drop nav
  highlight.
- **AIAgentConsole hoisted:** Both `MobileContainer` and
  `DesktopContainer` get `onAITap` prop because the console itself is
  rendered one level up (in `ResponsiveContainer`) so its open-state
  survives a viewport resize across the breakpoint without remount.
- **Two non-branching wrappers** (`ResponsiveCarousel`,
  `ResponsivePageHeader`) — the prefix is a co-location convention,
  not a behaviour guarantee. Don't refactor them to add `useIsMobile()`
  branching unless you have a UX reason; CSS handles it.

## Extending

**Adding a new responsive-* wrapper:**

1. Pick the upstream primitive(s). Identify desktop variant
   (`@/shared/components/ui/<thing>`) and mobile variant (almost always
   `Drawer` from `@/shared/components/ui/drawer`).
2. Create `frontend/src/shared/components/ui/responsive-<thing>.tsx`.
3. Boilerplate:
   - `"use client"`
   - `type Mode = "<desktop>" | "drawer";`
   - `const ModeContext = React.createContext<Mode>("<desktop>");`
   - Root component reads `useIsMobile()` (or accepts `forceMode`),
     wraps children in `ModeContext.Provider`.
   - Each sub-component reads `useContext(ModeContext)` and renders
     the matching primitive.
4. Mirror the upstream API exactly — prefix names with `Responsive`,
   keep prop signatures compatible. Don't invent new props that don't
   exist upstream unless they're mode-specific (`drawerClassName`,
   `drawerTitle`, `forceMode` are the conventional escape hatches).
5. For Items in a menu/list: wrap the mobile variant in
   `<DrawerClose asChild>` so tapping closes the drawer (or accept a
   `closeOnSelect={false}` opt-out).
6. A11y: drawer mobile = mandatory `DrawerTitle` (sr-only fallback if
   no visible title). Accept a `drawerTitle` prop for non-trivial
   cases.

**Adding a new dashboard page:** see "Nav SSOT" above (two files).

**Customising the breakpoint:** edit `MOBILE_BREAKPOINT` in
`use-mobile.ts`. Keep it equal to `tailwind.config.ts`'s `lg` value
or every `lg:hidden` / `hidden lg:block` utility in the layout will
desync from the JS branch.

---

## Portabilitas

**Tier:** XL

This is the platform layer. Nothing else in CareerPack works without
it.

### Files untuk dicopy

```
# Containers (4 files)
frontend/src/shared/containers/ResponsiveContainer.tsx
frontend/src/shared/containers/MobileContainer.tsx
frontend/src/shared/containers/DesktopContainer.tsx
frontend/src/shared/containers/AuthShell.tsx

# Hook
frontend/src/shared/hooks/use-mobile.ts

# Responsive primitive wrappers (14 files)
frontend/src/shared/components/ui/responsive-alert-dialog.tsx
frontend/src/shared/components/ui/responsive-carousel.tsx
frontend/src/shared/components/ui/responsive-combobox.tsx
frontend/src/shared/components/ui/responsive-context-menu.tsx
frontend/src/shared/components/ui/responsive-data-table.tsx
frontend/src/shared/components/ui/responsive-dialog.tsx
frontend/src/shared/components/ui/responsive-dropdown-menu.tsx
frontend/src/shared/components/ui/responsive-filter-bar.tsx
frontend/src/shared/components/ui/responsive-hover-card.tsx
frontend/src/shared/components/ui/responsive-page-header.tsx
frontend/src/shared/components/ui/responsive-popover.tsx
frontend/src/shared/components/ui/responsive-select.tsx
frontend/src/shared/components/ui/responsive-tooltip.tsx
# (no responsive-sheet — see "Sheet vs Drawer" in Catatan Desain)

# Upstream shadcn primitives the wrappers depend on
# (install via `npx shadcn add` — see commands below)
frontend/src/shared/components/ui/dialog.tsx
frontend/src/shared/components/ui/sheet.tsx
frontend/src/shared/components/ui/drawer.tsx
frontend/src/shared/components/ui/alert-dialog.tsx
frontend/src/shared/components/ui/select.tsx
frontend/src/shared/components/ui/tooltip.tsx
frontend/src/shared/components/ui/popover.tsx
frontend/src/shared/components/ui/dropdown-menu.tsx
frontend/src/shared/components/ui/hover-card.tsx
frontend/src/shared/components/ui/context-menu.tsx
frontend/src/shared/components/ui/command.tsx
frontend/src/shared/components/ui/table.tsx
frontend/src/shared/components/ui/sidebar.tsx

# Layout pieces (mobile + desktop nav shell)
frontend/src/shared/components/layout/BottomNav.tsx
frontend/src/shared/components/layout/MoreDrawer.tsx
frontend/src/shared/components/layout/SiteHeader.tsx
frontend/src/shared/components/layout/app-sidebar.tsx
frontend/src/shared/components/layout/nav-main.tsx
frontend/src/shared/components/layout/nav-secondary.tsx
frontend/src/shared/components/layout/nav-user.tsx
frontend/src/shared/components/layout/MobileUserMenu.tsx
frontend/src/shared/components/layout/DashboardFooter.tsx
frontend/src/shared/components/layout/Breadcrumb.tsx        # used by SiteHeader

# Nav SSOT + dashboard registry
frontend/src/shared/components/layout/navConfig.ts
frontend/src/shared/lib/dashboardRoutes.tsx
```

### Transitive shared deps (already documented in their own files)

These are imported by the layout files; port them too if missing:

```
frontend/src/shared/components/interactions/MicroInteractions.tsx   # Ripple, useHapticPress
frontend/src/shared/components/interactions/PullToRefresh.tsx
frontend/src/shared/components/feedback/LoadingScreen.tsx
frontend/src/shared/components/feedback/PageSkeleton.tsx
frontend/src/shared/components/brand/Logo.tsx                         # BrandMark
frontend/src/shared/components/decor/ParangPattern.tsx                # used by ResponsivePageHeader
frontend/src/shared/components/theme/ThemePresetSwitcher.tsx          # used in both top bars
frontend/src/shared/components/ai/AIFab.tsx                           # mobile FAB
frontend/src/shared/components/pwa/InstallSidebarButton.tsx
frontend/src/shared/hooks/usePWAInstall.ts
frontend/src/shared/hooks/useVisibleMoreApps.ts                       # super-admin gate
frontend/src/shared/hooks/useAuth.tsx                                 # transitive via NavUser
frontend/src/shared/lib/utils.ts                                      # cn()
frontend/src/shared/lib/routes.ts                                     # ROUTES used by MobileUserMenu
```

### cp commands

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

# Containers + hook
mkdir -p "$DST/frontend/src/shared/containers"
mkdir -p "$DST/frontend/src/shared/hooks"
cp "$SRC/frontend/src/shared/containers/ResponsiveContainer.tsx" "$DST/frontend/src/shared/containers/"
cp "$SRC/frontend/src/shared/containers/MobileContainer.tsx"     "$DST/frontend/src/shared/containers/"
cp "$SRC/frontend/src/shared/containers/DesktopContainer.tsx"    "$DST/frontend/src/shared/containers/"
cp "$SRC/frontend/src/shared/containers/AuthShell.tsx"           "$DST/frontend/src/shared/containers/"
cp "$SRC/frontend/src/shared/hooks/use-mobile.ts"                "$DST/frontend/src/shared/hooks/"

# All 13 actual responsive-* wrapper files
mkdir -p "$DST/frontend/src/shared/components/ui"
cp "$SRC/frontend/src/shared/components/ui/responsive-"*.tsx     "$DST/frontend/src/shared/components/ui/"

# Layout shell + nav SSOT + dashboard registry
mkdir -p "$DST/frontend/src/shared/components/layout"
mkdir -p "$DST/frontend/src/shared/lib"
cp "$SRC/frontend/src/shared/components/layout/BottomNav.tsx"      "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/components/layout/MoreDrawer.tsx"     "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/components/layout/SiteHeader.tsx"     "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/components/layout/app-sidebar.tsx"    "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/components/layout/nav-main.tsx"       "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/components/layout/nav-secondary.tsx"  "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/components/layout/nav-user.tsx"       "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/components/layout/MobileUserMenu.tsx" "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/components/layout/DashboardFooter.tsx" "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/components/layout/Breadcrumb.tsx"     "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/components/layout/navConfig.ts"       "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/lib/dashboardRoutes.tsx"              "$DST/frontend/src/shared/lib/"
```

### shadcn install (upstream primitives the wrappers wrap)

If the target is freshly initialised, install the underlying shadcn
components first:

```bash
cd "$DST/frontend"
npx shadcn@latest add dialog sheet drawer alert-dialog select tooltip \
  popover dropdown-menu hover-card context-menu command table sidebar \
  card button avatar badge breadcrumb separator scroll-area input
```

Then overwrite with CareerPack's versions if they diverge (CareerPack
customises a few — e.g. `dialog.tsx` adds the `sm:max-w-lg` default
that `ResponsiveDialog` then overrides via the `size` prop).

### npm deps

```bash
pnpm -F frontend add vaul cmdk \
  @radix-ui/react-dialog @radix-ui/react-alert-dialog \
  @radix-ui/react-select @radix-ui/react-tooltip @radix-ui/react-popover \
  @radix-ui/react-hover-card @radix-ui/react-context-menu \
  @radix-ui/react-dropdown-menu \
  @tanstack/react-table lucide-react
```

`@tanstack/react-table` is not directly imported by
`responsive-data-table.tsx` but is the expected consumer-side wrapper.
Skip it if you don't plan to add sort/filter on top.

### Wire-up

1. Create the dashboard route group + layout:

   ```tsx
   // frontend/app/(dashboard)/layout.tsx
   import type { ReactNode } from "react";
   import { ResponsiveContainer } from "@/shared/containers/ResponsiveContainer";

   export default function DashboardLayout({ children }: { children: ReactNode }) {
     return <ResponsiveContainer>{children}</ResponsiveContainer>;
   }
   ```

2. Create the catch-all dashboard page:

   ```tsx
   // frontend/app/(dashboard)/dashboard/[[...slug]]/page.tsx
   import { resolveDashboardView } from "@/shared/lib/dashboardRoutes";
   import { notFound } from "next/navigation";

   export default async function DashboardPage({
     params,
   }: { params: Promise<{ slug?: string[] }> }) {
     const { slug } = await params;
     const View = resolveDashboardView(slug);
     if (!View) notFound();
     return <View />;
   }
   ```

3. For auth pages — add `(auth)/layout.tsx` and consume `AuthShell`
   inside each page (see `LoginPage.tsx` as reference).

4. Mount `<TooltipProvider>` near the app root (required by
   `ResponsiveTooltip` desktop mode).

### Env vars

None — pure UI infrastructure. The shell consumes `useAuth` for the
user menu, which transitively requires the auth env (covered in
`auth.md`).

### i18n strings

Indonesian copy embedded in shell/wrappers — search-and-replace per
locale:

| String | File |
|---|---|
| `"Lewati ke konten utama"` | MobileContainer, DesktopContainer |
| `"Navigasi utama"` (`aria-label`) | BottomNav, app-sidebar |
| `"Lainnya"` | BottomNav (More tab), MoreDrawer ("Semua Fitur") |
| `"Geser ke bawah untuk tutup · pilih menu untuk membuka"` | MoreDrawer |
| `"Cari fitur…"` placeholder, `"Tidak ada fitur cocok dengan…"` | MoreDrawer |
| `"Pasang Aplikasi CareerPack"`, `"Akses lebih cepat, mode offline, notifikasi push."`, `"Pasang"` | MoreDrawer InstallBanner |
| `"Cari fitur, halaman, aksi…"`, `"Asisten AI"`, `"Buka Asisten AI"`, `"Tutup Asisten AI"` | SiteHeader, NavMain |
| `"Profil & Tampilan"`, `"Admin Dashboard"`, `"Keluar"`, `"Pengaturan"`, `"Notifikasi"`, `"Profil Saya"`, `"Profil"` | SiteHeader, MobileUserMenu, NavUser |
| `"Lipat / buka sidebar"` | SiteHeader |
| `"Kembali"` (default `backLabel`) | ResponsivePageHeader |
| `"Filter"`, `"Reset"`, `"Terapkan"` (defaults) | ResponsiveFilterBar |
| `"Pilih opsi"`, `"Pilih…"`, `"Cari…"`, `"Tidak ada hasil."`, `"Menu"` | ResponsiveSelect, ResponsiveCombobox, ResponsiveDropdownMenu, ResponsiveContextMenu |
| `"Tutup"` | ResponsiveDialog |
| `"Sebelumnya"`, `"Berikutnya"` | ResponsiveCarousel arrow buttons |
| `"Informasi tambahan"` | ResponsivePageHeader split variant `<aside aria-label>` |
| Nav labels: `"Dashboard"`, `"CV"`, `"Kalender"`, `"Lamaran"`, `"Simulasi Wawancara"`, etc. | navConfig.ts |
| `"Alat Lainnya"` | app-sidebar `<NavSecondary label>` |
| `"Pengguna"` (avatar fallback name) | NavUser, MobileUserMenu, MoreDrawer |
| `"Kembali ke beranda"` (`aria-label`) | AuthShell |

### Common breakage after port

- **Hydration flash on mobile** — first paint shows desktop chrome for
  one frame. Mitigation already wired: `MobileContainer` is
  `next/dynamic({ ssr: false })` with `<LoadingScreen />` fallback. If
  you see the desktop sidebar flash, verify the `dynamic` import is
  intact in `ResponsiveContainer.tsx`.
- **Drawer doesn't close on route change** — vaul keeps the drawer
  mounted unless `open` flips. `MoreDrawer` calls `onOpenChange(false)`
  in its tile click handler explicitly. New consumers need the same
  pattern; don't rely on Next.js navigation to close it.
- **Z-index stacking conflict with sidebar** — desktop Sidebar sits at
  `z-10` (shadcn default), `SiteHeader` at `z-20`, BottomNav at
  `z-40`, vaul Drawers at `z-50`. If you add a custom overlay that
  needs to sit above the drawer, use `z-[60]` or higher.
- **`useIsMobile()` returns false in tests** — `matchMedia` is undefined
  in jsdom by default. Add `vi.stubGlobal('matchMedia', …)` mock in
  `test/setup.ts`, or use Vitest's `@vitest/web-worker` env.
- **Tooltip mobile = blank** — verify `<TooltipProvider>` is mounted
  near the app root. ResponsiveTooltip desktop path uses Radix
  `Tooltip` which requires the provider; mobile path uses Popover
  which doesn't.
- **Combobox mobile drawer doesn't filter** — `cmdk`'s `Command`
  component does the filtering internally based on each
  `CommandItem`'s `value` prop. ResponsiveCombobox sets `value` to
  `[label, ...keywords].join(" ")`; if you customise `renderOption`
  but forget to keep the `value` prop, search breaks.
- **Active nav highlight wrong on deep links** — `activeNavForPath`
  uses prefix match. Routes that share a prefix (e.g. `/dashboard/cv`
  vs `/dashboard/cv-2`) need either exact-match-only nav or unique
  href prefixes.
- **DataTable mobile has no labels** — by default each row card pairs
  `<dt>` (column header) with `<dd>` (cell). If a column has only an
  icon/avatar, set `hideMobileLabel: true` on the column or it'll
  render an empty label.
- **AlertDialog destructive button doesn't auto-close mobile** — you
  used `<AlertDialogAction>` directly. Use
  `<ResponsiveAlertDialogAction>` so the mobile path wraps in
  `DrawerClose`.
- **Sheet wrapper missing** — there's no `responsive-sheet.tsx`
  intentionally. If you want a side-panel-on-desktop / bottom-sheet-
  on-mobile pattern, use `ResponsiveDialog` instead. If you specifically
  want a side panel on both viewports, use upstream `Sheet` directly.

### Testing the port

1. Open `/dashboard` on a desktop window → see Sidebar (collapsible
   icon button works) + SiteHeader + breadcrumb.
2. Resize the window through 1024px → shell swaps to BottomNav +
   MobileTopBar instantly. Sidebar disappears.
3. Tap "Lainnya" on mobile → MoreDrawer opens, swipe-down closes it.
4. Tap a tile → routes + drawer auto-closes.
5. Open any page that uses `ResponsiveDialog`, resize across breakpoint
   while open → modal swaps from centred Dialog to bottom Drawer
   (state preserved via React reconciliation, not a remount).
6. Cmd/Ctrl+K opens command palette (CommandPalette consumer of
   `cmdk` — separate file but same dep).
7. Tab through BottomNav with keyboard → focus rings render, Enter
   navigates, blur fires before nav (critical for vaul aria-hidden).
8. iOS PWA standalone: status-bar safe-area inset honored
   (`paddingTop: var(--safe-top)` on MobileTopBar).
9. Long-press a `ResponsiveContextMenu` trigger on touch → drawer
   opens (browser fires `contextmenu`).
10. `ResponsiveTooltip` on touch device → tap reveals popover (not
    dead UI).
11. `ResponsiveDataTable` resizes → cards on mobile, table on desktop.

Run `_porting-guide.md` §9 checklist.
