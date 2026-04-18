# Settings (TweaksPanel)

## Tujuan

Personalisasi UI: theme (light/dark/system), font scale, nav style (drawer vs tab), AI button style (FAB visibility), density. Preferensi persist di `localStorage`.

## Route & Entry

- URL: `/dashboard/settings`
- Slice: `frontend/src/slices/settings/`
- Komponen utama: `TweaksPanel.tsx`

## Struktur Slice

```
settings/
├─ index.ts
└─ components/TweaksPanel.tsx
```

## Data Flow

Tidak pakai Convex. State lewat `UIPrefsProvider` di `@/shared/hooks/useUIPrefs`:

```ts
type FontScale = "sm" | "md" | "lg";
type NavStyle = "drawer" | "tabs";
type AIButtonStyle = "fab" | "minimal" | "hidden";

useUIPrefs() → {
  fontScale, setFontScale,
  navStyle, setNavStyle,
  aiButtonStyle, setAIButtonStyle,
  density, setDensity,
}
```

Persist: `localStorage` key `careerpack:ui-prefs`.

Theme: `next-themes` → `useTheme()` (attribute `class`, system default).

## State Lokal

Tidak ada state internal — semua controlled dari context.

## Dependensi

- `next-themes` (theme switcher)
- shadcn `toggle-group` untuk segmented control, `card`, `button`
- `lucide-react`: Sun, Moon, Monitor, Sparkles, Type, LayoutPanelTop

## Catatan Desain

- Font scale aplikasi via CSS variable `--font-scale` di root, `html { font-size: calc(16px * var(--font-scale)) }`. Rem-based spacing auto-scale.
- AI button style `"hidden"` → disembunyikan dari shell (untuk user yang tidak butuh AI agent).
- Profil user belum di settings — saat ini hanya UI preferences. Profil edit lewat `api.users.createOrUpdateProfile` (future: pindah ke settings).

## Extending

- Profile editor (name, bio, skills, interests) → form wire ke `createOrUpdateProfile`.
- Language switcher (id / en) — butuh i18n layer (next-intl / i18next).
- Export data (GDPR-style) → action dump semua tabel user ke JSON.
- Account deletion → butuh cascade delete di Convex.
