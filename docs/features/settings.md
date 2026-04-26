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

### Profile (Convex)

Card "Profil Saya" di atas UI prefs. Wire:

| Source | Convex op |
|---|---|
| Hydrate | `api.profile.queries.getCurrentUser` — baca `currentUser.profile` kalau ada |
| Save | `api.profile.mutations.createOrUpdateProfile` — upsert by userId |

Field: `fullName`, `phone?`, `location`, `targetRole`, `experienceLevel`, `bio?`, `skills[]`, `interests[]`. `skills` + `interests` dirender sebagai `Badge` chip (input + tombol `+`, Enter = tambah, klik `×` pada chip = hapus). Validasi client-side: `fullName`, `location`, `targetRole`, `experienceLevel` wajib. Toast `sonner` on sukses/gagal.

### UI preferences (localStorage)

State lewat `UIPrefsProvider` di `@/shared/hooks/useUIPrefs`:

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
- Profil user belum di settings — saat ini hanya UI preferences. Profil edit lewat `api.profile.mutations.createOrUpdateProfile` (future: pindah ke settings).

## Extending

- [x] Profile editor (name, bio, skills, interests) → form wire ke `createOrUpdateProfile`.
- Language switcher (id / en) — butuh i18n layer (next-intl / i18next).
- Export data (GDPR-style) → action dump semua tabel user ke JSON.
- Account deletion → butuh cascade delete di Convex.

---

## Portabilitas

**Tier:** L — slice (multi-section) + file upload + public profile toggles + theme integration.

**Files:**

```
frontend/src/slices/settings/
frontend/src/shared/components/files/FileUpload.tsx     # if avatar upload kept
frontend/src/shared/hooks/useFileUpload.ts
frontend/src/shared/lib/imageConvert.ts
frontend/src/shared/components/theme/*                   # if theme-preset UI kept
convex/profile/                                  # for public profile section
convex/files/
```

**cp:**

```bash
SRC=~/projects/CareerPack DST=~/projects/<target>
cp -r "$SRC/frontend/src/slices/settings" "$DST/frontend/src/slices/"
# Also port FileUpload (see file-upload.md) and publicProfile (see _porting-guide.md)
```

**Schema:** extend `userProfiles` with `avatarStorageId`, `public*` opt-in fields. Add `files` table.

**Convex api.d.ts:** add `publicProfile`, `files`.

**npm deps:** `react-easy-crop` (from file-upload).

**Nav:** `settings` slug.

**i18n:** lots — field labels, section titles, help text. Indonesian everywhere.

**Pattern:** each section is a self-contained Card. Drop sections not relevant to target (e.g. AppearanceSection depends on tweakcn preset system).

See `file-upload.md` + `_porting-guide.md`.
