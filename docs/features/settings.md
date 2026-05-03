# Settings

> **Portability tier:** XL — slice + manifest + capability binder + profile + branding + appearance + AI sub-panel + file upload

## Tujuan

Tab utama personalisasi user — profil pribadi (CV-relevant), preferensi tampilan (theme + density + font scale), branding publik (showcase + style customizer), notifications card, dan re-export AI Settings panel. **AI agent bisa patch profil** (phone, target role, location, bio) via skill manifest + capability binder.

## Route & Entry

- URL: `/dashboard/settings` (dan legacy `/dashboard/ai-settings` redirect ke sini)
- Slice: `frontend/src/slices/settings/`
- Komponen utama: `SettingsView.tsx`

## Struktur Slice

```
settings/
├─ index.ts
├─ manifest.ts                       SliceManifest — 4 AI skills (update phone/target/location/bio)
└─ components/
   ├─ SettingsView.tsx               Tab shell — Profil / Tampilan / Branding / Notifikasi / AI
   ├─ ProfileSection.tsx             fullName/phone/location/targetRole/exp/bio/skills/interests + avatar
   ├─ AppearanceSection.tsx          Theme (light/dark/system) + density + font scale + theme preset
   ├─ ThemePresetPicker.tsx          tweakcn-preset palette swatch
   ├─ NotificationsCard.tsx          Digest opt-in toggle (`profile.setDigestEnabled`)
   └─ SettingsCapabilities.tsx       AI bus binder — patches `userProfiles` via patchProfile
```

`AISettingsPanel` di-re-export dari `@/shared/components/ai-settings/AISettingsPanel` (lihat `ai-settings.md`) — sub-tab "AI" di `SettingsView`. `TweaksPanel` adalah alias untuk `SettingsView` (back-compat dengan route lama).

## Data Flow

Backend domain: `convex/profile/`. Tabel: `userProfiles` (extensive — full schema di `convex/profile/schema.ts`).

| Hook / method | Convex op | Purpose |
|---|---|---|
| Hydrate profile | `api.profile.queries.getCurrentUser` | Read `currentUser.profile` (atau `null` baru-bikin) |
| Save profile | `api.profile.mutations.createOrUpdateProfile` | Full upsert (form save) |
| Patch field | `api.profile.mutations.patchProfile` | Partial update — dipakai AI binder |
| Avatar | `api.profile.mutations.updateAvatar` | Set `avatarStorageId` setelah upload |
| Digest opt-in | `api.profile.mutations.setDigestEnabled` | Toggle weekly job digest |

UI prefs (localStorage, bukan Convex) lewat `UIPrefsProvider` di `@/shared/hooks/useUIPrefs`:

```ts
useUIPrefs() → {
  fontScale: "sm" | "md" | "lg",
  navStyle: "drawer" | "tabs",
  aiButtonStyle: "fab" | "minimal" | "hidden",
  density: "compact" | "comfortable" | "spacious",
  // setter pasangan
}
```

Theme via `next-themes` + theme-preset (tweakcn) via `@/shared/providers/ThemePresetProvider`.

Schema (`convex/profile/schema.ts`) — abridged, full file ~210 baris dengan branding fields:

```ts
userProfiles: defineTable({
  userId: v.id("users"),
  fullName: v.string(),
  phone: v.optional(v.string()),
  location: v.string(),
  targetRole: v.string(),
  experienceLevel: v.string(),
  bio: v.optional(v.string()),
  skills: v.optional(v.array(v.string())),
  interests: v.optional(v.array(v.string())),
  role: v.optional(v.union(v.literal("admin"), v.literal("moderator"), v.literal("user"))),
  email: v.optional(v.string()),
  linkedinUrl: v.optional(v.string()),
  portfolioUrl: v.optional(v.string()),
  preferredIndustries: v.optional(v.array(v.string())),
  // ── Public branding (Linktree-style page) ──
  publicEnabled: v.optional(v.boolean()),
  publicSlug: v.optional(v.string()),
  publicHeadline: v.optional(v.string()),
  publicBioShow / publicSkillsShow / publicTargetRoleShow / publicAvatarShow / publicPortfolioShow: v.optional(v.boolean()),
  publicContactEmail / publicLinkedinUrl / publicPortfolioUrl: v.optional(v.string()),
  publicAllowIndex: v.optional(v.boolean()),
  publicMode: v.optional(v.union(v.literal("auto"), v.literal("custom"))),
  publicAutoToggles: v.optional(v.object({ showExperience, showEducation, showCertifications, showProjects, showSocial, showLanguages })),
  publicAvailableForHire: v.optional(v.boolean()),
  publicAvailabilityNote: v.optional(v.string()),
  publicCtaLabel / publicCtaUrl: v.optional(v.string()),
  publicCtaType: v.optional(v.union(v.literal("link"), v.literal("email"), v.literal("calendly"), v.literal("download"))),
  publicSectionOrder: v.optional(v.array(v.string())),
  publicTheme: v.optional(v.union(v.literal("linktree"), v.literal("bento"), v.literal("magazine"), v.literal("template-v1"), v.literal("template-v2"), v.literal("template-v3"))),
  publicHeaderBg: v.optional(v.object({ kind, value })),
  publicAccent: v.optional(v.string()),
  publicStyle: v.optional(v.object({ primary, font, radius, density })),
  publicHtmlExport / publicEmbedExport / publicPromptExport: v.optional(v.boolean()),
  publicBlocks: v.optional(v.array(v.object({ id, type, hidden?, payload, style? }))),
  // ── Avatar + digest ──
  avatarStorageId: v.optional(v.string()),
  digestEnabled: v.optional(v.boolean()),
  lastDigestSentAt: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_public_slug", ["publicSlug"])
  .index("by_role", ["role"]),
```

Ada juga sub-modul:
- `convex/profile/blocks.ts` + `blocks/` — public block builder (header / paragraph / link / social / image / embed / divider / html sanitisation)
- `convex/profile/autoBlocks.ts` — auto-rebuild dari CV/Profile/Portfolio
- `convex/profile/brandingPayload.ts` — export payload untuk iframe hydrator

## AI Skill Manifest

`manifest.ts` mengekspos 4 mutation skills (semua patch field di `userProfiles`):

| Skill ID | Slash | Kind | Binder action |
|---|---|---|---|
| `settings.update-phone` | `/phone` | mutation | `patchProfile({ phone })` |
| `settings.update-target-role` | `/target` | mutation | `patchProfile({ targetRole })` |
| `settings.update-location` | `/lokasi` | mutation | `patchProfile({ location })` |
| `settings.update-bio` | `/bio` | mutation | `patchProfile({ bio })` |

Semua skill punya `argsFromText` parser → user bisa typing `/phone 081234567890` dan langsung dapat ApproveActionCard tanpa LLM round-trip.

## State Lokal

- Tab state (`SettingsView`)
- Form state per section (controlled inputs di `ProfileSection`)
- `skills` + `interests` sebagai chip input (Enter = tambah, klik × = hapus)
- Theme + UI prefs via context — tidak ada state internal

## Dependensi

- `@/shared/types/sliceManifest` — `SliceManifest`
- `@/shared/lib/aiActionBus` — `subscribe`
- `@/shared/lib/notify`, `@/shared/lib/utils` (`cn`)
- `@/shared/hooks/useAuth`, `@/shared/hooks/useDemoOverlay` (`useDemoProfileOverlay`), `@/shared/hooks/useUIPrefs`
- `@/shared/providers/ThemePresetProvider` — `useThemePreset`, `DEFAULT_PRESET_NAME`
- `@/shared/components/files/FileUpload` — avatar upload
- `@/shared/components/ai-settings/AISettingsPanel` — embedded sub-tab
- `@/shared/components/onboarding` — `QuickFillButton`
- `@/shared/components/ui/responsive-page-header`
- `@/shared/components/ui/responsive-alert-dialog`
- `@/shared/components/ui/responsive-select`
- `@/shared/components/layout/PageContainer`
- shadcn: `badge`, `button`, `card`, `input`, `label`, `scroll-area`, `switch`, `tabs`, `textarea`, `toggle-group`
- `next-themes` — theme switcher
- `lucide-react` — `Settings` icon (manifest icon), Sun/Moon/Monitor/Sparkles/Type/LayoutPanelTop

## Catatan Desain

- **`patchProfile` vs `createOrUpdateProfile`** — patch dipakai untuk surgical AI updates; createOrUpdate dipakai form save (full upsert).
- **`argsFromText` di manifest** — bypass LLM untuk slash command langsung. Validasi regex client-side; tetap re-validate server-side di `patchProfile`.
- **Public branding builder** — paling kompleks dari semua slice. `publicMode: "auto"` rebuild dari user data; `"custom"` render `publicBlocks` array. HTML payload disanitize regex (strip tags + handlers); embed payload ternormalisasi ke `(provider, id)` sehingga public page tidak render iframe markup user-supplied.
- **Theme preset (tweakcn)** — `ThemePresetProvider` set CSS vars dari preset (palet OKLCH lengkap). `AppearanceSection` listing preset + apply ke document root.
- **Font scale** — CSS var `--font-scale` di root, `html { font-size: calc(16px * var(--font-scale)) }`. Rem-based spacing auto-scale.
- **AI button style `"hidden"`** — disembunyikan dari shell (untuk user yang tidak butuh AI agent).

## Extending

- Language switcher (id / en) — butuh i18n layer (next-intl / i18next).
- Export data (GDPR) → action dump semua tabel user ke JSON.
- Account deletion → cascade delete di Convex.
- 2FA / passkey settings.
- Manifest skill expansion: `settings.update-skills`, `settings.toggle-public-enabled`, `settings.update-cta`.

---

## Portabilitas

**Tier:** XL

**Files untuk dicopy:**

```
# Slice (manifest + binder + 5 components)
frontend/src/slices/settings/

# Shared deps
frontend/src/shared/types/sliceManifest.ts                              # SliceManifest, SliceSkill
frontend/src/shared/lib/sliceRegistry.ts
frontend/src/shared/lib/aiActionBus.ts
frontend/src/shared/lib/notify.ts
frontend/src/shared/lib/utils.ts
frontend/src/shared/hooks/useAuth.tsx
frontend/src/shared/hooks/useDemoOverlay.ts
frontend/src/shared/hooks/useUIPrefs.tsx
frontend/src/shared/providers/ThemePresetProvider.tsx
frontend/src/shared/components/files/FileUpload.tsx
frontend/src/shared/hooks/useFileUpload.ts
frontend/src/shared/lib/imageConvert.ts
frontend/src/shared/components/ai-settings/AISettingsPanel.tsx
frontend/src/shared/components/onboarding/                              # QuickFillButton
frontend/src/shared/components/ui/responsive-page-header.tsx
frontend/src/shared/components/ui/responsive-alert-dialog.tsx
frontend/src/shared/components/ui/responsive-select.tsx
frontend/src/shared/components/layout/PageContainer.tsx
frontend/src/shared/lib/themePresets.ts                                 # tweakcn preset list
frontend/src/shared/lib/presetGroups.ts

# Backend
convex/profile/                                                         # full domain (schema + queries + mutations + blocks + autoBlocks + brandingPayload)
convex/files/                                                           # avatar storage
convex/ai/                                                              # for embedded AI Settings panel
convex/_seeds/aiDefaults.ts                                             # DEFAULT_AI_TOOLS — append settings.* entries
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

# Slice
mkdir -p "$DST/frontend/src/slices"
cp -r "$SRC/frontend/src/slices/settings" "$DST/frontend/src/slices/"

# Shared deps
mkdir -p "$DST/frontend/src/shared/types"
mkdir -p "$DST/frontend/src/shared/lib"
mkdir -p "$DST/frontend/src/shared/hooks"
mkdir -p "$DST/frontend/src/shared/providers"
mkdir -p "$DST/frontend/src/shared/components/files"
mkdir -p "$DST/frontend/src/shared/components/ai-settings"
mkdir -p "$DST/frontend/src/shared/components/onboarding"
mkdir -p "$DST/frontend/src/shared/components/ui"
mkdir -p "$DST/frontend/src/shared/components/layout"

cp    "$SRC/frontend/src/shared/types/sliceManifest.ts"                     "$DST/frontend/src/shared/types/"
cp    "$SRC/frontend/src/shared/lib/sliceRegistry.ts"                       "$DST/frontend/src/shared/lib/"
cp    "$SRC/frontend/src/shared/lib/aiActionBus.ts"                         "$DST/frontend/src/shared/lib/"
cp    "$SRC/frontend/src/shared/lib/notify.ts"                              "$DST/frontend/src/shared/lib/"
cp    "$SRC/frontend/src/shared/lib/themePresets.ts"                        "$DST/frontend/src/shared/lib/"
cp    "$SRC/frontend/src/shared/lib/presetGroups.ts"                        "$DST/frontend/src/shared/lib/"
cp    "$SRC/frontend/src/shared/lib/imageConvert.ts"                        "$DST/frontend/src/shared/lib/"
cp    "$SRC/frontend/src/shared/hooks/useAuth.tsx"                          "$DST/frontend/src/shared/hooks/"
cp    "$SRC/frontend/src/shared/hooks/useDemoOverlay.ts"                    "$DST/frontend/src/shared/hooks/"
cp    "$SRC/frontend/src/shared/hooks/useUIPrefs.tsx"                       "$DST/frontend/src/shared/hooks/"
cp    "$SRC/frontend/src/shared/hooks/useFileUpload.ts"                     "$DST/frontend/src/shared/hooks/"
cp    "$SRC/frontend/src/shared/providers/ThemePresetProvider.tsx"          "$DST/frontend/src/shared/providers/"
cp    "$SRC/frontend/src/shared/components/files/FileUpload.tsx"            "$DST/frontend/src/shared/components/files/"
cp    "$SRC/frontend/src/shared/components/ai-settings/AISettingsPanel.tsx" "$DST/frontend/src/shared/components/ai-settings/"
cp -r "$SRC/frontend/src/shared/components/onboarding"                      "$DST/frontend/src/shared/components/"
cp    "$SRC/frontend/src/shared/components/ui/responsive-page-header.tsx"   "$DST/frontend/src/shared/components/ui/"
cp    "$SRC/frontend/src/shared/components/ui/responsive-alert-dialog.tsx"  "$DST/frontend/src/shared/components/ui/"
cp    "$SRC/frontend/src/shared/components/ui/responsive-select.tsx"        "$DST/frontend/src/shared/components/ui/"
cp    "$SRC/frontend/src/shared/components/layout/PageContainer.tsx"        "$DST/frontend/src/shared/components/layout/"

# Backend
cp -r "$SRC/convex/profile" "$DST/convex/"
cp -r "$SRC/convex/files"   "$DST/convex/"        # if not already ported
cp -r "$SRC/convex/ai"      "$DST/convex/"        # for embedded AI Settings panel
```

**Schema additions** — copy `userProfiles` table dari `convex/profile/schema.ts` verbatim. Indexes wajib: `by_user`, `by_public_slug`, `by_role`. Plus `files` table dari `file-upload.md` dan `aiSettings` table dari `ai-settings.md`.

**Convex api.d.ts**:

```ts
import type * as profile_autoBlocks      from "../profile/autoBlocks.js";
import type * as profile_blocks          from "../profile/blocks.js";
import type * as profile_brandingPayload from "../profile/brandingPayload.js";
import type * as profile_mutations       from "../profile/mutations.js";
import type * as profile_queries         from "../profile/queries.js";

declare const fullApi: ApiFromModules<{
  // ...
  "profile/autoBlocks":      typeof profile_autoBlocks;
  "profile/blocks":          typeof profile_blocks;
  "profile/brandingPayload": typeof profile_brandingPayload;
  "profile/mutations":       typeof profile_mutations;
  "profile/queries":         typeof profile_queries;
}>;
```

**npm deps:**

```bash
pnpm -F frontend add next-themes react-easy-crop
```

**Env vars** — none specific (Convex baseline + AI proxy kalau AI panel embedded).

**Manifest + binder wiring** (CRITICAL):

1. **Register manifest** in `frontend/src/shared/lib/sliceRegistry.ts`:
   ```ts
   import { settingsManifest } from "@/slices/settings";
   export const SLICE_REGISTRY = [settingsManifest, /* … */];
   ```

2. **Mount binder globally** in `frontend/src/shared/providers/Providers.tsx`:
   ```ts
   import { SettingsCapabilities } from "@/slices/settings";
   // ...
   <SettingsCapabilities />
   ```

3. **Server skill handlers** — N/A: 4 skills semua `kind:"mutation"`, dieksekusi client-side via binder. Tidak perlu append ke `convex/ai/skillHandlers.ts`.

4. **Tools catalog** — append `settings.update-phone`, `settings.update-target-role`, `settings.update-location`, `settings.update-bio` ke `DEFAULT_AI_TOOLS` di `convex/_seeds/aiDefaults.ts` (mirror manifest skill IDs). Re-run admin "Seed default" untuk push.

**Nav registration** — manifest declare `nav.placement="more"`, `order: 95`, `href: "/dashboard/settings"`. Legacy `navConfig.ts` butuh entry manual sampai migrasi selesai. `dashboardRoutes.tsx` slug `settings` → `SettingsView`. Pertimbangkan alias `"ai-settings": SETTINGS` di `DASHBOARD_VIEWS` untuk back-compat bookmark.

**i18n** — Indonesian (banyak):
- Section titles: "Profil", "Tampilan", "Branding", "Notifikasi", "AI"
- Field labels: "Nama Lengkap", "Lokasi", "Peran Target", "Tingkat Pengalaman", "Bio", "Skill", "Minat"
- Toast: "Profil disimpan", "Nomor telepon disimpan", "Bio disimpan", "Gagal …"
- Slash command Indonesian (`/lokasi`, `/target`, `/bio`, `/phone`)

**Common breakage after port:**

- **`patchProfile` 404** — convex generated types belum reload. `pnpm backend:dev-sync`.
- **AI skill silent** — `SettingsCapabilities` belum di-mount di `Providers.tsx`. Subscribe gagal.
- **Manifest tidak ke LLM** — `settingsManifest` lupa di-register di `SLICE_REGISTRY`.
- **`useThemePreset` undefined** — `ThemePresetProvider` belum dimount di Providers tree (atas `SettingsView`).
- **Public branding crash** — sub-modul `convex/profile/blocks/` (helpers + sanitize) tidak ikut tercopy. Gunakan `cp -r convex/profile`.
- **Avatar 404** — `convex/files/` belum ported atau `avatarStorageId` tidak match storage.
- **`AISettingsPanel` import broken** — `@/shared/components/ai-settings/AISettingsPanel` belum dicopy. Lihat `ai-settings.md`.
- **`UIPrefsProvider` missing** — `useUIPrefs()` throws di tree tanpa provider; pastikan `UIPrefsProvider` mounted di app layout.

**Testing the port:**

1. Navigate `/dashboard/settings` → tab shell render
2. Tab Profil: edit name + location + bio → "Simpan" → toast sukses; reload → persist
3. Tab Tampilan: switch theme system→dark → instant; resize density → spacing berubah
4. Tab Branding: enable public + set slug → cek `/[slug]` render
5. Tab Notifikasi: toggle digest → record `digestEnabled = true` di Convex
6. Tab AI: API key paste + test connection → sukses
7. **AI agent test**:
   - Slash `/bio Backend engineer 5 tahun pengalaman` → ApproveActionCard muncul → approve → bio updated, toast "Bio disimpan"
   - Slash `/lokasi Bandung, Indonesia` → location patched
   - Prompt natural language: "Update target role saya jadi Senior Frontend Engineer" → AI emit `settings.update-target-role` action

Run `_porting-guide.md` §9 checklist.
