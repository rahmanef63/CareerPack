# PWA Shell (Infrastructure)

> **Portability tier:** L — cross-cutting platform layer. Not a slice; needs Providers wiring + a few `app/` additions + a `public/` payload (manifest, sw.js, icons).

## Tujuan

Membuat aplikasi terasa native di mobile (installable, offline-capable,
status-bar terwarnai sesuai tema, tab bar bawah mirip app), dan membuat
deploy baru ter-pickup secara otomatis tanpa user perlu hard-reload.
Empat user-facing behaviour:

1. Installable — banner "Pasang Aplikasi" muncul saat browser fire
   `beforeinstallprompt`.
2. Offline fallback — saat sinyal hilang, navigasi yang belum di-cache
   jatuh ke halaman `/offline` yang sudah di-precache.
3. Auto-update — dua lapis (SW activation + bundle-id mismatch) yang
   diam-diam reload tab ke versi terbaru begitu ada deploy.
4. Theme-color sync — Android address bar + iOS status bar (PWA mode)
   ikut warna tema/preset aktif, bukan warna statis dari metadata.

## Architecture overview

Empat sub-sistem independen, semua di-mount sekali di `Providers.tsx`
dan sisanya bekerja di module scope.

```
                 Providers.tsx (root)
                        │
   ┌──────┬──────┬──────┼────────┬──────────┐
RegisterSW  SWUpdate  ThemeColor  UpdateChecker
   │        Prompt     Sync         │
   ▼          │          │          ▼
sw.js     SKIP_WAITING  <meta>     /api/build-id
(cache)   ↻ reload     theme-color (poll 5min)
                                    │
                                    ▼
                              forceFreshReload()
                              (purge SW + caches)
```

Lifecycle per layer:

- **Service worker** — `sw.js` (handwritten) registered by
  `RegisterSW` via `registerServiceWorker()` from
  `shared/lib/pwa.ts`. Browser caches static GETs (stale-while-
  revalidate); navigations are network-first w/ `/offline` fallback.
- **SW activation** — `SWUpdatePrompt` listens for the new SW reaching
  `installed` state while an old one still controls the page →
  `postMessage("SKIP_WAITING")` → on `controllerchange` reload. No
  toast (silent; matches PWA best practice for non-destructive
  updates).
- **Bundle-id mismatch** — `UpdateChecker` reads
  `process.env.NEXT_PUBLIC_BUILD_ID` (frozen at build), polls
  `/api/build-id` every 5 min + on tab-focus, on mismatch calls
  `forceFreshReload()` from `shared/lib/staleBundle.ts` (unregister
  all SWs + delete every named cache + `location.replace?_v=…`).
- **Install flow** — `shared/lib/pwa.ts` is the SSOT: one global
  `beforeinstallprompt` listener stores the deferred event in a
  module-level singleton; React reads via `useSyncExternalStore`
  (`usePWAInstall` hook). UI triggers in two places:
  - **Desktop sidebar:** `<InstallSidebarButton>` in
    `app-sidebar.tsx` SidebarFooter.
  - **Mobile More drawer:** `<InstallBanner>` (inline in
    `MoreDrawer.tsx`) — full-width promo card at top of the sheet.
- **Theme-color** — `ThemeColorSync` mounts a `MutationObserver` on
  `<html>` (watches `class` / `data-theme` / `data-preset` / `style`)
  + a `prefers-color-scheme` media query listener. Each event reads
  `getComputedStyle(document.body).backgroundColor` and writes it to
  `<meta name="theme-color">`. Defers one rAF so preset injectors
  finish first.

## Update behavior — two layers

The two layers catch different failure modes; you need both.

| Layer | Detects | Trigger | Recovery |
|---|---|---|---|
| **SW activation** (`SWUpdatePrompt`) | New `sw.js` deployed → browser installs new SW, queues it as `waiting`. | `updatefound` event on existing registration. | `postMessage SKIP_WAITING` → SW activates → `controllerchange` → `location.reload()`. |
| **Bundle-id check** (`UpdateChecker`) | Next.js chunks rotated (different `BUILD_ID`) but the SW happens to still serve old chunks — or SW never registered. Also catches Convex-API drift in installed PWAs. | Poll `/api/build-id` every 5 min + on `visibilitychange` + on `focus` (debounced 30 s). | `forceFreshReload()` — SW unregister + Cache Storage purge + `location.replace(?_v=…)`. |

**User-facing copy:** none. Both layers reload silently. The previous
toast ("Versi baru tersedia · Refresh") was removed in 2026-04 because
it fired repeatedly across deploys and confused users. Anti-loop guard:
shared `sessionStorage` key `_car_update_reload_at` blocks any second
reload within 90 s — if the post-reload bundle is *also* stale (broken
deploy), we fall through to the user's manual refresh instead of
spinning.

## PWA navbar (BottomNav + MoreDrawer)

The "navbar" the user sees as their PWA tab bar lives in
`shared/components/layout/`:

- `BottomNav.tsx` — fixed `bottom-0 lg:hidden` shell. 5-slot grid:
  2 primary tabs · centred AI FAB · 1 primary tab · "Lainnya" (More)
  trigger. Active state from `usePathname()` via
  `activeNavForPath()` (SSOT in `navConfig.ts`). Padding bottom uses
  `var(--safe-bottom)` so iPhone home-indicator doesn't overlap
  icons. `nav-shell` class extends `bg-card` to viewport edge so
  there's no transparent strip in standalone mode.
- `MoreDrawer.tsx` — vaul `<Drawer>` (swipe-to-dismiss). Sticky
  search input on top, scrollable feature grid (3-col on narrow,
  4-col ≥ 380 px), sticky `<AccountFooter>` (avatar + Keluar).
  Renders `<InstallBanner>` inline at the top of the grid when
  `canInstall` and not already standalone.
- `MobileContainer.tsx` — wraps `(dashboard)` for `< lg`. Mounts
  `MobileTopBar` + `<BottomNav>` + `<MoreDrawer>` + `<PullToRefresh>`.
  Also reserves `paddingBottom: calc(var(--nav-height) +
  var(--safe-bottom) + 1rem)` so content never hides under the bar.

The 5-slot bottom layout + AI FAB + sticky drawer is what makes the
PWA feel native on mobile. `app-sidebar.tsx` (desktop, `≥ lg`) is the
counterpart — same nav data, different chrome.

## Manifest + icons

`frontend/public/manifest.webmanifest` (linked from
`app/layout.tsx` → `metadata.manifest`):

- `display: "standalone"` + `display_override: ["standalone","minimal-ui"]`
- `start_url`, `scope`, `id` all `"/"` (root)
- `theme_color: "#0ea5e9"` + `background_color: "#0c4a6e"` — *static*
  values used at install time + splash. Runtime theme-color is
  overridden by `ThemeColorSync` once JS runs.
- `lang: "id-ID"`, `orientation: "portrait"`, `categories:
  ["productivity","education","business"]`
- `prefer_related_applications: false` (no Play Store fallback)
- 3 `shortcuts` (Buat CV, Asisten AI, Roadmap) — surfaced as
  long-press shortcuts on Android home screen.
- 2 `screenshots` (`narrow` 540×1170, `wide` 1280×720) — required for
  the richer install UI on Chrome Android.

**Icon size matrix** in `frontend/public/icons/`:

| File | Size | Purpose |
|---|---|---|
| `icon-72.png` | 72×72 | Android legacy launcher |
| `icon-96.png` | 96×96 | Android |
| `icon-128.png` | 128×128 | Chrome Web Store |
| `icon-144.png` | 144×144 | Windows tile / Android |
| `icon-152.png` | 152×152 | iPad |
| `icon-192.png` | 192×192 | Android home screen (canonical) |
| `icon-256.png` | 256×256 | Desktop install dialog |
| `icon-384.png` | 384×384 | Android splash |
| `icon-512.png` | 512×512 | Android splash + canonical |
| `icon-maskable-512.png` | 512×512 | Android adaptive icon (purpose: "maskable", safe-zone-padded) |
| `apple-touch-icon.png` (root) | 180×180 | iOS home screen |
| `icon.png` (root) | 512×512 | Generic fallback (referenced from `<link rel="icon">`) |
| `favicon.ico` (root) | multi | Tab favicon |
| `og-image.png` (root) | 1200×630 | OpenGraph share card |

**Maskable convention** — icon-maskable-512 uses ~80% safe zone
inside the 512² canvas; Android adaptive shapes (circle, squircle,
teardrop) crop the outer 20%. Don't reuse `icon-512.png` (which has
edge content) for maskable — it'll be sliced.

## Offline page

`frontend/app/offline/page.tsx` — Server Component, no client JS,
pre-renders to a single static HTML file. Listed in `sw.js` PRECACHE
so it's available before any cache-warming. Fallback path inside the
SW `fetch` handler:

```js
if (request.mode === "navigate") {
  fetch(request)
    .then(response => { /* cache copy + return */ })
    .catch(() =>
      caches.match(request).then(cached => cached || caches.match("/offline"))
    );
}
```

Static assets (JS/CSS/img) use stale-while-revalidate; API and
`_next/data/` + `_next/image` are bypassed entirely (must hit network
so realtime queries + auth tokens stay fresh).

## Data Flow

**N/A — no Convex tables.** PWA is purely client-side platform code.
The only network endpoint is `/api/build-id`, served by a Next.js
route handler that reads `.next/BUILD_ID` from disk (force-dynamic,
no cache).

## Dependensi

- `next-themes` — peer of `ThemeColorSync` (preset injection lives
  upstream in `ThemePresetProvider`, which writes to
  `<html data-preset>` — observed by ThemeColorSync's MutationObserver).
- `vaul` — `<Drawer>` for `MoreDrawer` (swipe-to-dismiss).
- `lucide-react` — icons (`Download`, `LogOut`, `Search`, `X`).
- shadcn primitives: `sidebar`, `drawer`, `scroll-area`, `avatar`,
  `badge`, `button`, `input`.
- No `next-pwa` / `@serwist/next` / Workbox. SW is hand-written.

## Catatan Desain

- **Why no `next-pwa` / Workbox:** existing project requires control
  over the activate phase (we explicitly do NOT call
  `self.skipWaiting()` on install — we wait for `SWUpdatePrompt` to
  send `SKIP_WAITING`). Wrapping in a plugin adds an extra layer of
  config + opaque cache strategies. Hand-written `sw.js` is ~100 LOC,
  reads top-to-bottom, easy to bump version on each release.
- **Cache versioning:** `CACHE` constant in `sw.js`
  (`careerpack-v23-2026-04-30-pwa-offline`). The activate handler
  purges any cache name that doesn't match. **Bump on EVERY release**
  — the suffix is the only thing that evicts old assets when your
  cache strategy is permissive.
- **Build-id injection:** `next.config.ts` sets
  `generateBuildId: async () => BUILD_ID` and mirrors it into
  `env.NEXT_PUBLIC_BUILD_ID`. `BUILD_ID` is `GITHUB_SHA.slice(0,12)`
  in CI, else `b${Date.now().toString(36)}`. The runtime endpoint
  reads `.next/BUILD_ID` from disk (NOT `process.env`) because env
  injection only reaches the client bundle, not the server runtime
  in standalone Docker output.
- **Two update layers because:** SW alone misses cases where the SW
  cached `/some-route` HTML pointing at a chunk that no longer
  exists (404s during nav). `UpdateChecker` catches that by hashing
  the entire build, regardless of SW state. Conversely, if SW
  activation fires *before* UpdateChecker polls, SWUpdatePrompt
  reloads instantly without waiting up to 5 min.
- **Anti-reload-loop:** Both `SWUpdatePrompt` and `UpdateChecker`
  share the `_car_update_reload_at` sessionStorage key with a 90-s
  guard window. If both fire near each other, only the first wins.
- **iOS theme-color quirks:** iOS Safari only applies
  `<meta name="theme-color">` in standalone PWA mode (added to home
  screen), not in regular browser tabs. The MutationObserver still
  runs in browsers; it's harmless.
- **`appleWebApp.statusBarStyle: "black-translucent"`** — content
  renders *behind* the iOS status bar; `MobileTopBar` adds
  `paddingTop: var(--safe-top)` so the brand mark doesn't overlap
  the clock.

## Extending

- **Push notifications** — `sw.js` has no `push` listener yet. Add
  `self.addEventListener("push", e => e.waitUntil(self.registration.
  showNotification(...)))` + a `subscribe()` flow stored on a Convex
  table. Today the app uses in-app `Toaster` only.
- **Background sync** — Convex realtime makes this largely
  unnecessary, but `SyncManager` could batch offline mutations via
  IndexedDB queue when target browsers support it.
- **Share target** — add `share_target` to manifest so the PWA
  appears in the OS share sheet (e.g. share a URL → opens
  `/dashboard/library?url=…`).
- **Periodic background sync** — `periodicsync` event in `sw.js` to
  warm cache or refresh build-id without an open tab.
- **Custom splash screen for iOS** — generate per-resolution PNGs
  and add `<link rel="apple-touch-startup-image" media="…">`
  entries (currently only `apple-touch-icon` covers it).

---

## Portabilitas

**Tier:** L — cross-cutting Providers wiring + public payload + 1
route handler. ~1–2 hours to port assuming target already has Next.js
15 + sonner + `next-themes`.

**Files untuk dicopy (exhaustive):**

```
# Frontend — PWA components (4 files)
frontend/src/shared/components/pwa/RegisterSW.tsx
frontend/src/shared/components/pwa/SWUpdatePrompt.tsx
frontend/src/shared/components/pwa/ThemeColorSync.tsx
frontend/src/shared/components/pwa/InstallSidebarButton.tsx

# Frontend — System / update layer (1 file)
frontend/src/shared/components/system/UpdateChecker.tsx

# Frontend — hook + libs (3 files)
frontend/src/shared/hooks/usePWAInstall.tsx
frontend/src/shared/lib/pwa.ts
frontend/src/shared/lib/staleBundle.ts

# Frontend — mobile shell (the "PWA navbar" — 3 files)
frontend/src/shared/components/layout/BottomNav.tsx
frontend/src/shared/components/layout/MoreDrawer.tsx
frontend/src/shared/containers/MobileContainer.tsx
# (also navConfig.ts must already exist in target — see _porting-guide.md)

# Next.js app router (3 files)
frontend/app/offline/page.tsx
frontend/app/api/build-id/route.ts
# Edit (don't replace): frontend/app/layout.tsx — add manifest + appleWebApp + viewport.themeColor

# Public payload (~20 files)
frontend/public/manifest.webmanifest
frontend/public/sw.js
frontend/public/icon.png
frontend/public/apple-touch-icon.png
frontend/public/favicon.ico
frontend/public/og-image.png
frontend/public/icons/icon-72.png
frontend/public/icons/icon-96.png
frontend/public/icons/icon-128.png
frontend/public/icons/icon-144.png
frontend/public/icons/icon-152.png
frontend/public/icons/icon-192.png
frontend/public/icons/icon-256.png
frontend/public/icons/icon-384.png
frontend/public/icons/icon-512.png
frontend/public/icons/icon-maskable-512.png
frontend/public/screenshots/narrow.png
frontend/public/screenshots/wide.png
# (and any /brand/logo*.svg referenced from sw.js PRECACHE — bump or remove if absent)

# Build config edit
frontend/next.config.ts            (add generateBuildId + env.NEXT_PUBLIC_BUILD_ID)
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

# PWA components
mkdir -p "$DST/frontend/src/shared/components/pwa"
mkdir -p "$DST/frontend/src/shared/components/system"
mkdir -p "$DST/frontend/src/shared/hooks"
mkdir -p "$DST/frontend/src/shared/lib"
mkdir -p "$DST/frontend/src/shared/components/layout"
mkdir -p "$DST/frontend/src/shared/containers"

cp "$SRC/frontend/src/shared/components/pwa/RegisterSW.tsx"          "$DST/frontend/src/shared/components/pwa/"
cp "$SRC/frontend/src/shared/components/pwa/SWUpdatePrompt.tsx"      "$DST/frontend/src/shared/components/pwa/"
cp "$SRC/frontend/src/shared/components/pwa/ThemeColorSync.tsx"      "$DST/frontend/src/shared/components/pwa/"
cp "$SRC/frontend/src/shared/components/pwa/InstallSidebarButton.tsx" "$DST/frontend/src/shared/components/pwa/"
cp "$SRC/frontend/src/shared/components/system/UpdateChecker.tsx"    "$DST/frontend/src/shared/components/system/"
cp "$SRC/frontend/src/shared/hooks/usePWAInstall.tsx"                "$DST/frontend/src/shared/hooks/"
cp "$SRC/frontend/src/shared/lib/pwa.ts"                             "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/lib/staleBundle.ts"                     "$DST/frontend/src/shared/lib/"

# Mobile shell (the navbar)
cp "$SRC/frontend/src/shared/components/layout/BottomNav.tsx"        "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/components/layout/MoreDrawer.tsx"       "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/containers/MobileContainer.tsx"         "$DST/frontend/src/shared/containers/"

# App router pages
mkdir -p "$DST/frontend/app/offline"
mkdir -p "$DST/frontend/app/api/build-id"
cp "$SRC/frontend/app/offline/page.tsx"                              "$DST/frontend/app/offline/"
cp "$SRC/frontend/app/api/build-id/route.ts"                         "$DST/frontend/app/api/build-id/"

# Public payload
mkdir -p "$DST/frontend/public/icons"
mkdir -p "$DST/frontend/public/screenshots"
cp "$SRC/frontend/public/manifest.webmanifest" "$DST/frontend/public/"
cp "$SRC/frontend/public/sw.js"                "$DST/frontend/public/"
cp "$SRC/frontend/public/icon.png"             "$DST/frontend/public/"
cp "$SRC/frontend/public/apple-touch-icon.png" "$DST/frontend/public/"
cp "$SRC/frontend/public/favicon.ico"          "$DST/frontend/public/"
cp "$SRC/frontend/public/og-image.png"         "$DST/frontend/public/"
cp -r "$SRC/frontend/public/icons/."           "$DST/frontend/public/icons/"
cp -r "$SRC/frontend/public/screenshots/."     "$DST/frontend/public/screenshots/"
```

**`frontend/app/layout.tsx` edits** — add three things to the existing
file:

```ts
// 1. Inside metadata:
export const metadata: Metadata = {
  // …existing fields…
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "<App Name>",
    startupImage: [{ url: "/apple-touch-icon.png" }],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: [{ url: "/favicon.ico" }],
  },
}

// 2. Add viewport export (replaces themeColor inside metadata):
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#0f172a" },
  ],
}
```

**`frontend/next.config.ts` edits** — add build-id injection:

```ts
const BUILD_ID = process.env.GITHUB_SHA?.slice(0, 12) || `b${Date.now().toString(36)}`;

const nextConfig: NextConfig = {
  // …existing fields…
  output: "standalone",                                  // required so .next/BUILD_ID is in container
  generateBuildId: async () => BUILD_ID,
  env: { NEXT_PUBLIC_BUILD_ID: BUILD_ID },
}
```

**Providers.tsx integration** — mount in this order inside the root
provider tree (after `TooltipProvider`, before `<Toaster />`):

```tsx
import { ThemeColorSync } from "@/shared/components/pwa/ThemeColorSync"
import { RegisterSW } from "@/shared/components/pwa/RegisterSW"
import { SWUpdatePrompt } from "@/shared/components/pwa/SWUpdatePrompt"
import { UpdateChecker } from "@/shared/components/system/UpdateChecker"

// inside <TooltipProvider>:
{children}
<ThemeColorSync />
<RegisterSW />
<SWUpdatePrompt />
<UpdateChecker />
<Toaster />
```

Order doesn't strictly matter (each renders `null` and runs in
`useEffect`), but the convention groups them after slice content.

**Sidebar wiring (desktop install button)** — inside
`shared/components/layout/app-sidebar.tsx` SidebarFooter:

```tsx
import { InstallSidebarButton } from "@/shared/components/pwa/InstallSidebarButton"
// …
<SidebarFooter>
  <InstallSidebarButton />
  {/* existing footer items */}
</SidebarFooter>
```

The component returns `null` when `canInstall === false`, so it's a
safe drop-in.

**Mobile install banner** — already wired inside `MoreDrawer.tsx` if
you copy that file verbatim. Renders inside the drawer top section
when `canInstall && !standalone`.

**npm deps:**

```bash
pnpm -F frontend add vaul       # only if MoreDrawer is new to target
# next-themes, sonner, lucide-react assumed present (baseline)
```

**Env vars:**

| Variable | Where | Purpose |
|---|---|---|
| `GITHUB_SHA` | CI runner | Source for `BUILD_ID` (first 12 chars). Falls back to `b${Date.now().toString(36)}` for local builds. No need to set explicitly. |
| `NEXT_PUBLIC_BUILD_ID` | auto-derived in `next.config.ts` | Frozen into client bundle for `UpdateChecker`. **Don't set manually** — the config injects it. |

**i18n strings to translate** (Indonesian → target):

| File | String |
|---|---|
| `InstallSidebarButton.tsx` | `"Pasang Aplikasi"` |
| `MoreDrawer.tsx` | `"Pasang Aplikasi CareerPack"`, `"Akses lebih cepat, mode offline, notifikasi push."`, `"Pasang"`, `"Semua Fitur"`, `"Geser ke bawah untuk tutup · pilih menu untuk membuka"`, `"Cari fitur…"`, `"Hasil ({n})"`, `"Fitur"`, `"Tidak ada fitur cocok dengan…"`, `"Keluar"` |
| `BottomNav.tsx` | `"Navigasi utama"`, `"Lainnya"` |
| `MobileContainer.tsx` | `"Lewati ke konten utama"` |
| `app/offline/page.tsx` | `"Offline · CareerPack"`, `"Anda sedang offline."`, `"Tidak ada koneksi internet"`, `"Halaman ini belum tersimpan offline. Saat sinyal kembali, sentuh tombol di bawah untuk melanjutkan."`, `"Coba lagi"` |
| `manifest.webmanifest` | `name`, `short_name`, `description`, all `shortcuts[].name` / `description` (`"Buat CV"`, `"Buka Pembuat CV"`, etc.) |
| `pwa.ts` | console warn: `"[PWA] registrasi service worker gagal:"` |

**Common breakage after port:**

- **Stale SW served forever** — solution: bump `CACHE` constant in
  `sw.js` on EVERY release (e.g. `-v24-…`). The activate handler only
  purges cache names that don't match the current value. Forgetting to
  bump = users keep last-deploy assets indefinitely.
- **`/api/build-id` returns `"unknown"`** — solution: ensure
  `output: "standalone"` in `next.config.ts` so `.next/BUILD_ID` lands
  in the runtime container at the path the route handler reads from
  (`process.cwd() + .next/BUILD_ID`). For non-standalone deploys, the
  same relative path resolves from project root.
- **Update reload loop** — solution: shared `_car_update_reload_at`
  sessionStorage key already gates 90 s. If you customize, keep the
  guard. If guard mysteriously not working in private mode, that's
  expected — code falls through one extra reload then stops.
- **iOS Safari install option missing** — iOS doesn't support
  `beforeinstallprompt`. Users must use Share → "Add to Home Screen"
  manually. The `InstallSidebarButton` / `InstallBanner` will simply
  not render (canInstall = false) — that's correct behavior, not a
  bug. Add a help tip if needed.
- **Theme-color ignored** — iOS Safari respects
  `<meta name="theme-color">` only in standalone (installed) mode.
  Desktop Chrome respects it in browser tabs. No fix; just expected
  per-platform.
- **PWA shows white splash on Android** — solution: ensure both
  `theme_color` (matches splash icon background) and
  `background_color` (full splash bg) are set in manifest. Also need
  a 512² icon with maskable purpose.
- **MoreDrawer can't be swiped closed** — happens if you accidentally
  swap `vaul` Drawer for Radix Sheet. Keep `vaul`.
- **`MutationObserver` infinite loop in `ThemeColorSync`** —
  shouldn't happen because we only update a single `<meta>` in
  `<head>`, not an attribute on `<html>`. If you change the target,
  test for re-entrancy.
- **Build-id mismatch reload spam in dev** — `UpdateChecker` early-
  returns when `localBuildId === "unknown"`. In `next dev` the env
  isn't injected, so dev mode is naturally a no-op.

**Testing checklist:**

1. `pnpm dev` → DevTools → Application tab → Manifest renders all
   icons + screenshots without warnings.
2. Service Workers panel → `sw.js` shows `activated and is running`.
3. Application → Storage → Cache Storage → cache name matches
   `CACHE` constant in `sw.js`.
4. Disable network → reload `/dashboard/cv` → falls back to
   `/offline` page.
5. Re-enable network → toggle dark mode in settings → status bar /
   tab title bar color changes (Android Chrome / desktop Chrome).
6. Apply a theme preset → theme-color follows.
7. Build + deploy two versions in sequence → first tab still on v1
   gets silently reloaded to v2 within 5 minutes (or instantly on
   focus).
8. Repeat (5) but with a broken second deploy → tab reloads ONCE,
   then stays put (sessionStorage guard works).
9. Chrome Android: visit site → install banner pops → tap → app
   appears in launcher → opens in standalone mode (no chrome).
10. Mobile viewport: BottomNav visible at bottom, AI FAB centred,
    More drawer opens on tap, swipe down dismisses.
11. iOS Safari: Share → Add to Home Screen → opens with status bar
    behind content (not the white default).

Run `_porting-guide.md` §9 baseline checklist after.
