# Theme Preset System (Infrastructure)

> **Portability tier:** L — not a slice, but a self-contained platform layer (provider + lib + CSS + Tailwind tokens). Two orthogonal axes (mode + preset) layered on top of OKLCH CSS variables.

## Tujuan

Setiap komponen di CareerPack memakai **semantic token** (`bg-primary`,
`text-brand-foreground`, `border-border/40`, `bg-muted/60`) — tidak ada
warna hex / `oklch(…)` literal yang ditulis langsung di JSX. Itu
memungkinkan dua pengaturan visual berjalan bebas:

1. **Mode** — `light` / `dark` / `system` (mengikuti OS), dikelola
   `next-themes` lewat `<html class="dark">`.
2. **Preset warna** — 36 palette dari registry tweakcn
   (`modern-minimal`, `vercel`, `claude`, `bubblegum`, dst.), dikelola
   `ThemePresetProvider` lewat injeksi `<style id="theme-preset-vars">`
   ke `<head>`.

Keduanya persistan: mode disimpan oleh next-themes (`localStorage` key
`theme`), preset oleh provider sendiri (`careerpack:theme-preset`). PWA
status bar (`<meta name="theme-color">`) ikut dimutakhirkan via
`ThemeColorSync` agar warna chrome browser cocok dengan tema aktif.

## Architecture overview

```
┌─────────────────────────────────────────────────────────────┐
│  Mode axis  ─ next-themes ─ <html class="dark">             │
│  Preset axis ─ ThemePresetProvider ─ <style id="theme-…">   │
│                                       ↓ injects CSS         │
│                              :root { --primary: L C H; … }  │
│                              .dark { --primary: L C H; … }  │
│                                       ↓                     │
│  tailwind.config.ts: bg-primary → oklch(var(--primary)/<a>) │
│                                       ↓                     │
│  <ThemeColorSync> watches html attrs + <body> bg →          │
│       <meta name="theme-color" content="rgb(…)">            │
└─────────────────────────────────────────────────────────────┘
```

Aliran detail:

1. **CSS variables di `shared/styles/index.css`** — `:root { --primary:
   0.62 0.19 259.81; … }` (komponen OKLCH `L C H`, **tanpa** wrapper
   `oklch(…)`) plus `.dark { … }` overrides.
2. **Tailwind config** — `colors.primary.DEFAULT = 'oklch(var(--primary)
   / <alpha-value>)'`. Placeholder `<alpha-value>` membuat slash
   utilities (`bg-primary/40`, `border-border/30`) ikut bekerja.
3. **Mode**: `next-themes` via `<NextThemesProvider attribute="class"
   defaultTheme="system" enableSystem disableTransitionOnChange>` —
   menambah/menghapus `dark` class di `<html>`.
4. **Preset**: `ThemePresetProvider` di-mount **di dalam** `ThemeProvider`.
   Saat user pilih preset, `applyPreset(name)` di
   `shared/lib/themePresets.ts`:
   - fetch `/r/registry.json` (cached `force-cache`),
   - bangun blok CSS `:root { … }` + `:root { --brand: … }` (alias
     bridge) + `.dark { … }`,
   - inject ke satu `<style id="theme-preset-vars">` di `<head>`,
   - persist ke `localStorage["careerpack:theme-preset"]`,
   - pulse class `html.theme-transition` selama 260 ms supaya seluruh
     swap warna/radius/shadow/font teranimasi serempak.
5. **Mode + preset gabung**: karena preset emit `:root { … }` dan `.dark
   { … }` blok terpisah, urutan selektor di engine CSS otomatis betul —
   `.dark` menang ketika user mode = dark, `:root` menang ketika light.
6. **PWA chrome**: `ThemeColorSync` pasang `MutationObserver` ke
   `<html>` (filter: `class`, `data-theme`, `data-preset`, `style`) +
   listener `prefers-color-scheme`. Setiap perubahan → baca
   `getComputedStyle(body).backgroundColor` → tulis ke
   `<meta name="theme-color">`.

## Preset catalog

Registry sumber: `frontend/public/r/registry.json` (verbatim copy
tweakcn). Total **36 preset**, dikurasi ke 6 grup mood di
`shared/lib/presetGroups.ts`:

| Group ID | Label (UI) | Presets |
|---|---|---|
| `brutalism` | Brutalism | `neo-brutalism`, `doom-64`, `retro-arcade`, `cyberpunk` |
| `refined` | Refined | `modern-minimal` (default), `vercel`, `claude`, `supabase`, `mono`, `graphite`, `clean-slate`, `amber-minimal` |
| `bold` | Bold | `t3-chat`, `bold-tech`, `twitter`, `tangerine`, `quantum-rose` |
| `warm` | Warm | `mocha-mousse`, `solar-dusk`, `caffeine`, `vintage-paper`, `sunset-horizon` |
| `artistic` | Artistic | `claymorphism`, `kodama-grove`, `bubblegum`, `candyland`, `nature`, `pastel-dreams`, `northern-lights` |
| `moody` | Dark & Moody | `cosmic-night`, `perpetuity`, `catppuccin`, `elegant-luxury`, `ocean-breeze`, `midnight-bloom`, `starry-night` |
| `other` | Lainnya | Sisa preset registry yang tak tercatat di atas (auto-fallback) |

Default preset (= no `<style>` tag, pakai variabel CSS yang sudah
dipanggang di `index.css`): **`modern-minimal`**. Di-export sebagai
`DEFAULT_PRESET_NAME` dari `themePresets.ts`.

## Token reference

Setiap preset mengisi (`light` + `dark`) variabel berikut. Yang tidak
dipasok preset, tetap pakai nilai baseline di `index.css`.

**Surface / semantic colors** (semua format `L C H`):
`--background`, `--foreground`, `--card`, `--card-foreground`,
`--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`,
`--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`,
`--accent`, `--accent-foreground`, `--destructive`,
`--destructive-foreground`, `--border`, `--input`, `--ring`.

**CareerPack-specific** (di-bridge `applyPreset` dari `--primary`,
`--chart-4`, `--secondary` agar legacy `bg-brand` ikut preset):
`--brand`, `--brand-foreground`, `--brand-from`, `--brand-to`,
`--brand-muted`, `--brand-muted-foreground`. Plus tone semantik
**non-registry** yang tetap baseline (tidak dioverride preset):
`--success`, `--warning`, `--info` + masing-masing `*-foreground`.

**Charts**: `--chart-1` … `--chart-5` (preset wajib mengisi 5;
visualisasi finansial pakai ini lewat `useChartColors`).

**Sidebar** (registry pakai key `sidebar`; CareerPack alias ke
`--sidebar-background` lewat `COLOR_ALIAS` di `themePresets.ts` —
emit kedua nama supaya `<svg>` inline yang merefer `var(--sidebar)`
tetap jalan): `--sidebar-background`, `--sidebar-foreground`,
`--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`,
`--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`.

**Passthrough (non-color, tidak di-strip wrapper)**: `--radius`,
`--spacing`, `--letter-spacing`, `--tracking-{normal,tight,…,widest}`,
`--shadow-{color,opacity,blur,spread,offset-x,offset-y}`,
`--shadow-{2xs,xs,sm,md,lg,xl,2xl}`.

**Fonts**: `--font-sans`, `--font-serif`, `--font-mono` — diteruskan
lewat `resolveFontStack` (alias `rewriteFontValue` di `registryFonts.ts`)
yang prepend `var(--font-<slug>)` jika family preset cocok dengan font
next/font yang sudah dimuat di `app/layout.tsx`.

## Persistence

| Apa | Mekanisme | Kunci |
|---|---|---|
| Mode (light/dark/system) | `next-themes` | `localStorage["theme"]` |
| Preset warna | `ThemePresetProvider` + `themePresets.ts` | `localStorage["careerpack:theme-preset"]` |
| `<meta name="theme-color">` | `ThemeColorSync` (runtime) | tidak persistan; recomputed setiap mount |

Tidak ada cookie. Tidak ada server-side storage. SSR render pakai
default (`modern-minimal` baked di CSS) dan client `useEffect` reapply
preset tersimpan saat hydrate.

## Hydration safety

- **Mode**: `next-themes` menyuntikkan inline `<script>` sebelum
  hydrate (built-in library) — tidak ada FOUC dark/light. Plus
  `<html suppressHydrationWarning>` di `app/layout.tsx` agar React
  tidak protes class mismatch.
- **Preset**: **tidak** ada inline pre-hydration script. Boot urutan:
  `ThemePresetProvider` `useEffect` → `getSavedPreset()` →
  `bootPreset()` → `injectStyleTag()`. Berarti **ada flash singkat**
  baseline `modern-minimal` jika user terakhir pilih preset lain. Trade-off:
  registry `/r/registry.json` ~120 KB, terlalu besar untuk di-inline ke
  HTML. `disableTransitionOnChange` di `ThemeProvider` ditambah supaya
  tidak ada cascading transition saat boot.

## Data Flow

N/A — pure client-side state, no Convex tables.

## Dependensi

- `next-themes` — mode (light/dark/system) + class injection
- `lucide-react` — `Sun`/`Moon`/`Monitor`/`Palette`/`ChevronDown`/`RotateCcw` icons di switcher
- shadcn primitives: `Button`, `Popover` (untuk `ThemePresetSwitcher`)
- `@/shared/lib/utils` — `cn()`
- Self-hosted `next/font` (Inter, Fraunces, Montserrat, Poppins, DM Sans,
  Outfit, Open Sans, Plus Jakarta, Oxanium, Quicksand, Roboto, Geist,
  JetBrains Mono, Fira Code, IBM Plex Mono, Source Code Pro, Space Mono,
  Geist Mono, Roboto Mono, Source Serif 4, Lora, Merriweather,
  Playfair Display, Libre Baskerville) — preload `false` kecuali Inter
  + Fraunces

## Catatan Desain

- **OKLCH bukan HSL/HEX**: OKLCH (`oklch(L C H)`) perceptually uniform
  — interpolasi dua warna lewat OKLCH menghindari "muddy mid-tones"
  yang umum di HSL. Browser dukungan: Chrome 111+, Safari 15.4+,
  Firefox 113+. Wider gamut untuk display P3 device.
- **Component-only storage** (`L C H` tanpa `oklch(…)` wrapper): supaya
  Tailwind token `oklch(var(--primary) / <alpha-value>)` melengkapi
  string warna. Kalau variabel disimpan utuh `oklch(0.62 0.19 259.81)`,
  hasilnya jadi `oklch(oklch(...) / 0.4)` — invalid CSS, alpha drop ke
  default 1.
- **`<alpha-value>` placeholder**: kunci kompatibilitas slash-utilities
  (`bg-primary/40`). Tanpa ini Tailwind akan diam-diam set opacity ke
  full karena tidak tahu di mana harus inject alpha.
- **Preset switcher di luar next-themes**: next-themes hanya kelola
  sumbu mode. Preset orthogonal — provider sendiri agar dua sumbu bisa
  dikombinasikan tanpa fork next-themes.
- **Single `<style>` tag** untuk semua preset vars: easier to wipe
  (`removeStyleTag()`) ketimbang menghapus 40+ inline-style properti
  di `<html>`. Cleaner di DevTools.
- **Brand-bridge layer** (`buildBrandBridge`): preset registry tweakcn
  tidak punya `--brand*` keys — CareerPack memakai legacy variable itu
  di banyak komponen lama. Mirror dari `--primary`/`--chart-4`/`--secondary`
  tanpa harus rewrite callsite.
- **Sidebar alias `sidebar` ↔ `sidebar-background`**: registry pakai
  `sidebar`, Tailwind config map ke `--sidebar-background`. Emit kedua
  nama (lihat `COLOR_ALIAS`) — SVG inline `var(--sidebar)` masih ada di
  beberapa marketing illustration.
- **`html.theme-transition` pulse 260 ms**: Class dipasang sebelum
  inject `<style>` tag, dilepas via setTimeout. CSS rule
  `html.theme-transition *` set `transition-property: bg-color, color,
  border-color, border-radius, box-shadow, letter-spacing, font-family`.
  Snappy hover/focus state di luar window swap tetap ada.
- **Hover-preview, click-commit**: `previewPreset()` apply tanpa
  persist; `restoreSavedPreset()` di mouse-leave Popover. UX kuat — user
  bisa mencoba 36 preset live tanpa permanen menulis ke localStorage.

## Extending

**Menambah preset baru**:

1. Tambahkan item di `frontend/public/r/registry.json` (atau gunakan
   tweakcn upstream; copy ulang file).
2. (Opsional) tambahkan name ke salah satu group di `presetGroups.ts`
   (`PRESET_GROUPS`). Kalau tidak, jatuh ke "Lainnya".
3. (Opsional) jika preset memakai font Google yang belum dimuat,
   tambahkan: (a) import + variable di `app/layout.tsx`, (b) entry di
   `REGISTRY_FONT_VAR` map (`shared/lib/registryFonts.ts`).

**Menambah token semantic baru** (`--success`, `--info`, dst.):

1. Definisikan di `:root` + `.dark` di `shared/styles/index.css`.
2. Tambahkan ke `tailwind.config.ts` `colors` block dengan format
   `oklch(var(--<key>) / <alpha-value>)`.
3. (Opsional) jika ingin preset bisa override, tambahkan ke
   `COLOR_TOKENS` array di `themePresets.ts`. Kalau tidak, akan tetap
   pakai baseline.

**Pre-hydration script** untuk hilangkan preset flash: inject
`<script>` di `<head>` yang baca `localStorage["careerpack:theme-preset"]`,
lalu inject blok CSS minimal (cukup `--background` + `--foreground`)
sebelum hydrate. Trade-off: registry harus inlined atau di-fetch sync —
~120 KB ke HTML jelek untuk SEO. Defer sampai metric FOUC mengganggu.

---

## Portabilitas

**Tier:** L (cross-cutting; bukan slice tapi tetap self-contained)

**Files untuk dicopy (10 files + 1 asset):**

```
# Provider + lib (state + apply pipeline)
frontend/src/shared/providers/ThemePresetProvider.tsx
frontend/src/shared/lib/themePresets.ts
frontend/src/shared/lib/presetGroups.ts
frontend/src/shared/lib/registryFonts.ts        # font alias map (untuk variants registry)

# next-themes wrapper (1-line passthrough)
frontend/src/shared/components/theme/theme-provider.tsx

# Switcher UI (Popover dengan tabs mode + list preset)
frontend/src/shared/components/theme/ThemePresetSwitcher.tsx

# PWA chrome sync
frontend/src/shared/components/pwa/ThemeColorSync.tsx

# CSS dasar — :root + .dark + html.theme-transition rule
frontend/src/shared/styles/index.css

# Tailwind token wiring
frontend/tailwind.config.ts                      # patch, JANGAN replace

# Registry asset (36 preset tweakcn, ~120 KB)
frontend/public/r/registry.json
```

**cp commands** (dari root CareerPack ke target project):

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

# Provider + lib
mkdir -p "$DST/frontend/src/shared/providers"
mkdir -p "$DST/frontend/src/shared/lib"
mkdir -p "$DST/frontend/src/shared/components/theme"
mkdir -p "$DST/frontend/src/shared/components/pwa"
mkdir -p "$DST/frontend/src/shared/styles"
mkdir -p "$DST/frontend/public/r"

cp "$SRC/frontend/src/shared/providers/ThemePresetProvider.tsx"        "$DST/frontend/src/shared/providers/"
cp "$SRC/frontend/src/shared/lib/themePresets.ts"                       "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/lib/presetGroups.ts"                       "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/lib/registryFonts.ts"                      "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/components/theme/theme-provider.tsx"       "$DST/frontend/src/shared/components/theme/"
cp "$SRC/frontend/src/shared/components/theme/ThemePresetSwitcher.tsx"  "$DST/frontend/src/shared/components/theme/"
cp "$SRC/frontend/src/shared/components/pwa/ThemeColorSync.tsx"         "$DST/frontend/src/shared/components/pwa/"
cp "$SRC/frontend/src/shared/styles/index.css"                          "$DST/frontend/src/shared/styles/"
cp "$SRC/frontend/public/r/registry.json"                               "$DST/frontend/public/r/"
```

> Catatan: kalau target sudah punya `index.css`, **merge** blok `:root
> { … OKLCH vars … }`, `.dark { … }`, `html.theme-transition` rule
> (lihat baris-baris di bawah `@layer base` dari source). Jangan
> overwrite seluruh file mentah.

**Tailwind config patch** (tambahkan ke `colors` block):

```ts
// frontend/tailwind.config.ts
colors: {
  border:      'oklch(var(--border) / <alpha-value>)',
  input:       'oklch(var(--input) / <alpha-value>)',
  ring:        'oklch(var(--ring) / <alpha-value>)',
  background:  'oklch(var(--background) / <alpha-value>)',
  foreground:  'oklch(var(--foreground) / <alpha-value>)',
  primary: {
    DEFAULT:    'oklch(var(--primary) / <alpha-value>)',
    foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
  },
  secondary: {
    DEFAULT:    'oklch(var(--secondary) / <alpha-value>)',
    foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)',
  },
  destructive: {
    DEFAULT:    'oklch(var(--destructive) / <alpha-value>)',
    foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)',
  },
  muted: {
    DEFAULT:    'oklch(var(--muted) / <alpha-value>)',
    foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
  },
  accent: {
    DEFAULT:    'oklch(var(--accent) / <alpha-value>)',
    foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
  },
  popover: {
    DEFAULT:    'oklch(var(--popover) / <alpha-value>)',
    foreground: 'oklch(var(--popover-foreground) / <alpha-value>)',
  },
  card: {
    DEFAULT:    'oklch(var(--card) / <alpha-value>)',
    foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
  },
  brand: {
    DEFAULT:           'oklch(var(--brand) / <alpha-value>)',
    foreground:        'oklch(var(--brand-foreground) / <alpha-value>)',
    from:              'oklch(var(--brand-from) / <alpha-value>)',
    to:                'oklch(var(--brand-to) / <alpha-value>)',
    muted:             'oklch(var(--brand-muted) / <alpha-value>)',
    'muted-foreground':'oklch(var(--brand-muted-foreground) / <alpha-value>)',
  },
  sidebar: {
    DEFAULT:               'oklch(var(--sidebar-background) / <alpha-value>)',
    foreground:            'oklch(var(--sidebar-foreground) / <alpha-value>)',
    primary:               'oklch(var(--sidebar-primary) / <alpha-value>)',
    'primary-foreground':  'oklch(var(--sidebar-primary-foreground) / <alpha-value>)',
    accent:                'oklch(var(--sidebar-accent) / <alpha-value>)',
    'accent-foreground':   'oklch(var(--sidebar-accent-foreground) / <alpha-value>)',
    border:                'oklch(var(--sidebar-border) / <alpha-value>)',
    ring:                  'oklch(var(--sidebar-ring) / <alpha-value>)',
  },
  chart: {
    '1':'oklch(var(--chart-1) / <alpha-value>)',
    '2':'oklch(var(--chart-2) / <alpha-value>)',
    '3':'oklch(var(--chart-3) / <alpha-value>)',
    '4':'oklch(var(--chart-4) / <alpha-value>)',
    '5':'oklch(var(--chart-5) / <alpha-value>)',
  },
},
darkMode: ["class"],
```

**`app/layout.tsx` patches**:

```tsx
// 1. suppressHydrationWarning di <html> (next-themes class injection
//    bedakan dengan SSR markup; tanpa flag ini React error spam)
<html lang="id" suppressHydrationWarning className={ALL_FONT_CLASSES}>

// 2. ThemeColorSync dimount via Providers, sudah ditangani Providers.tsx

// 3. Optional: import semua next/font yang akan dipakai preset (lihat
//    `registryFonts.ts` REGISTRY_FONT_VAR untuk daftarnya). Kalau
//    targetnya minimalis, cukup font default — preset yang request
//    family unregistered akan fallback ke system chain.
```

**`Providers.tsx` patch** — urutan mount **wajib** (mode pembungkus
preset; ConvexClientProvider/auth bisa di dalam preset, urutannya
preserved):

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  <ThemePresetProvider>
    <ConvexClientProvider>
      …rest of providers…
      {children}
      <ThemeColorSync />        {/* must mount inside ThemePresetProvider */}
      <Toaster />
    </ConvexClientProvider>
  </ThemePresetProvider>
</ThemeProvider>
```

**npm deps:**

```bash
pnpm -F frontend add next-themes
# (lucide-react + shadcn ui sudah baseline — lihat _porting-guide.md §0/§1)
```

`next-themes` adalah satu-satunya extra dep. Tidak ada provider-spesifik
font lib (next/font built-in di Next 13+).

**Env vars** — none.

**Common breakage after port:**

- **Flash of wrong preset (FOUC) saat reload**: `modern-minimal`
  baseline render dulu, lalu preset tersimpan diapply via `useEffect`.
  Solusi cepat: terima saja (260 ms transition pulse memuluskan). Solusi
  serius: tambah inline `<script>` di `<head>` yang baca localStorage +
  inject blok CSS minimal (lihat **Extending**).
- **Tailwind utilities tidak ikut preset**: lupa `<alpha-value>` di
  config, atau tidak restart `pnpm dev` setelah update
  `tailwind.config.ts`. Tailwind cache aggressive — `rm -rf
  frontend/.next` + restart.
- **`bg-primary/40` resolve ke full opacity**: variabel disimpan utuh
  `oklch(0.62 0.19 259.81)` alih-alih komponen `0.62 0.19 259.81`.
  Pastikan registry parser di `themePresets.ts` (`stripColorWrapper`)
  ikut tercopy.
- **Dark + preset menabrak**: emit harus `:root { … light vars … }` +
  `.dark { … dark vars … }` (dua blok terpisah). Kalau salah pakai
  selector `.dark[data-preset]` atau sebaliknya, satu sumbu menang
  cascade dan satu lainnya hilang. Pakai pola `buildBlock(":root",
  light)` + `buildBlock(".dark", dark)` apa adanya.
- **Brand utilities dropping after preset**: lupa copy
  `buildBrandBridge` atau `--brand*` belum ada di Tailwind config. Mirror
  block + token registration — keduanya wajib ada.
- **Sidebar background salah**: alias `sidebar` ↔ `sidebar-background`
  belum disambung. Pertahankan `COLOR_ALIAS` map di `themePresets.ts`,
  atau standardisasi seluruh codebase pakai `--sidebar` saja (rename
  Tailwind config).
- **`<meta name="theme-color">` tidak update di iOS PWA setelah
  install**: iOS Safari cache theme-color saat install ke home screen.
  Re-install = fresh meta. Quirk Apple, bukan bug
  `ThemeColorSync`.
- **Font preset tidak loaded**: registry minta family yang belum
  diimpor di `app/layout.tsx`. Tambah import next/font + entry baru di
  `REGISTRY_FONT_VAR`. Atau biarkan jatuh ke system fallback (sudah
  graceful via `rewriteFontValue`).

**Testing checklist setelah port:**

1. Buka `/` — body warna `--background` aktif (cek Inspect → computed
   `--background`).
2. Toggle ke dark mode — `<html class="dark">` aktif, warna invert.
3. Buka `ThemePresetSwitcher` (Settings atau header), hover preset lain
   — preview live, lepas mouse → kembali ke preset tersimpan.
4. Pilih preset baru — persist; reload page → preset masih sama
   (`localStorage["careerpack:theme-preset"]`).
5. Switch ke dark mode + preset baru — keduanya sinkron, tidak ada
   warna baseline bocor.
6. Inspect `<meta name="theme-color">` — kontennya `rgb(…)` cocok
   dengan warna body aktif.
7. (PWA) Add to Home Screen di Android — buka, address bar warna ikut
   tema.
8. `pnpm typecheck` + `pnpm lint --max-warnings=0` clean.
9. Buka 36 preset lewat dropdown — tidak ada console error, font yang
   tidak terdaftar fallback ke system tanpa crash.

Run `_porting-guide.md` §9 checklist.
