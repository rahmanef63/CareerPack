# Jaringan (Networking)

> **Portability tier:** L — slice + manifest + capability binder + 1 Convex domain + AI bus wiring

## Tujuan

Kontak profesional (rekruter, mentor, peer, lainnya) dengan profil ringkas + quick action (mailto / tel / linkedin). Favorit naik ke carousel atas. **AI agent bisa create / update / delete / list kontak** via skill manifest + capability binder.

## Route & Entry

- URL: `/dashboard/networking`
- Slice: `frontend/src/slices/networking/`
- Komponen utama: `NetworkingView.tsx`, `ContactCard.tsx`, `ContactForm.tsx`

## Struktur Slice

```
networking/
├─ index.ts
├─ manifest.ts                      SliceManifest — 4 AI skills (list/create/update/delete)
├─ components/
│  ├─ NetworkingView.tsx            Page — header + stats + favorites carousel + search + tabs + grid
│  ├─ ContactCard.tsx               Avatar gradient + quick-action buttons + favorite star
│  ├─ ContactForm.tsx               ResponsiveDialog + role picker + hue swatch
│  └─ NetworkingCapabilities.tsx    AI bus binder — subscribes 3 skills (list is server-handled)
├─ hooks/useNetworking.ts           Convex CRUD wrappers
├─ constants/index.ts               ROLE_LABELS, ROLE_EMOJIS, AVATAR_HUES, DEFAULT_FORM
└─ types/index.ts                   Contact, ContactRole, ContactFilter, ContactFormValues
```

## Data Flow

Backend domain: `convex/contacts/`. Tabel: `contacts`.

| Hook / method | Convex op | Purpose |
|---|---|---|
| `useNetworking.contacts` | `api.contacts.queries.listContacts` | All owner contacts desc by createdAt |
| `useNetworking.create` | `api.contacts.mutations.createContact` | Insert + set `lastInteraction = now()` |
| `useNetworking.update` | `api.contacts.mutations.updateContact` | Partial patch (only field-yang-mau-diubah) |
| `useNetworking.remove` | `api.contacts.mutations.deleteContact` | Ownership-checked hard delete |
| `useNetworking.toggleFavorite` | `api.contacts.mutations.toggleContactFavorite` | Flip `favorite` |
| `useNetworking.bumpInteraction` | `api.contacts.mutations.bumpContactInteraction` | Update `lastInteraction` saat user tap email/phone/linkedin |

Schema (`convex/contacts/schema.ts`):

```ts
contacts: defineTable({
  userId: v.id("users"),
  name: v.string(),
  role: v.string(),                 // "recruiter" | "mentor" | "peer" | "other" — server-normalised
  company: v.optional(v.string()),
  position: v.optional(v.string()),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  linkedinUrl: v.optional(v.string()),
  notes: v.optional(v.string()),
  avatarEmoji: v.optional(v.string()),
  avatarHue: v.optional(v.string()),
  lastInteraction: v.optional(v.number()),
  favorite: v.boolean(),
})
  .index("by_user", ["userId"])
  .index("by_user_role", ["userId", "role"])
  .index("by_user_last", ["userId", "lastInteraction"]),
```

## AI Skill Manifest

`manifest.ts` mengeskposkan 4 skill:

| Skill ID | Kind | Server handler? | Binder? |
|---|---|---|---|
| `contacts.list` | query | Yes — `convex/ai/skillHandlers.ts` map ke `api.contacts.queries.listContacts` | No (server-executed inline) |
| `contacts.create` | compose | No | Yes — `NetworkingCapabilities` |
| `contacts.update` | mutation | No | Yes |
| `contacts.delete` | mutation | No | Yes |

Binder (`NetworkingCapabilities.tsx`) di-mount global di `Providers.tsx`. AI agent emit action via `aiActionBus.publish(...)` → binder subscribe matching `id` → run mutation → toast.

Role enum di-normalise server-side ke salah satu dari `recruiter | mentor | peer | other` (default `other`).

## State Lokal

- Search input + filter tab (`ContactFilter`: all / recruiter / mentor / peer / other)
- Form values (controlled) di `ContactForm`
- Favorites carousel auto-derived dari `contacts.filter(c => c.favorite)`
- Demo overlay state via `useDemoContactsOverlay`

## Dependensi

- `@/shared/types/sliceManifest` — `SliceManifest` typing
- `@/shared/lib/aiActionBus` — `subscribe` (binder wiring)
- `@/shared/lib/notify`, `@/shared/lib/utils` (`cn`)
- `@/shared/hooks/useAuth`, `@/shared/hooks/useDemoOverlay` (`useDemoContactsOverlay`)
- `@/shared/components/onboarding` — `QuickFillButton`
- `@/shared/components/ui/responsive-page-header`
- `@/shared/components/ui/responsive-carousel`
- `@/shared/components/ui/responsive-dialog`
- `@/shared/components/ui/responsive-select`
- shadcn: `badge`, `button`, `input`, `label`, `switch`, `tabs`, `textarea`
- `lucide-react` — `Users` icon (manifest icon)

## Catatan Desain

- **Avatar gradient + emoji** — fallback ke initial-initial kalau emoji absent. Hemat storage — tidak perlu file upload.
- **AI list-then-act pattern** — `contacts.list` description explicitly arahkan model panggil dulu sebelum update/delete supaya dapat `contactId`.
- **`lastInteraction` ready tapi belum dipakai sort/display** — siap untuk "Recently contacted" carousel v2.
- **Outbound only** — quick action via `mailto:` / `tel:` / `linkedinUrl` href. Two-way chat = future work (butuh tabel `conversations`).

## Extending

- "Recently Contacted" carousel (sort by `lastInteraction` desc).
- Follow-up reminders → integrate dengan `notifications` slice + `calendar` event.
- Tag system (custom labels di samping role enum).
- Import dari Google Contacts / LinkedIn CSV.
- Join dengan `jobApplications` — link recruiter ke lamaran.

---

## Portabilitas

**Tier:** L

**Files untuk dicopy:**

```
# Slice (includes manifest.ts + NetworkingCapabilities.tsx)
frontend/src/slices/networking/

# Shared deps
frontend/src/shared/types/sliceManifest.ts                              # SliceManifest, SliceSkill
frontend/src/shared/lib/sliceRegistry.ts                                # central registry (target add manifest here)
frontend/src/shared/lib/aiActionBus.ts                                  # publish/subscribe pubsub
frontend/src/shared/lib/notify.ts
frontend/src/shared/lib/utils.ts
frontend/src/shared/hooks/useAuth.tsx
frontend/src/shared/hooks/useDemoOverlay.ts
frontend/src/shared/components/onboarding/                              # QuickFillButton
frontend/src/shared/components/ui/responsive-page-header.tsx
frontend/src/shared/components/ui/responsive-carousel.tsx
frontend/src/shared/components/ui/responsive-dialog.tsx
frontend/src/shared/components/ui/responsive-select.tsx

# Backend
convex/contacts/                                                        # schema + queries + mutations
convex/ai/skillHandlers.ts                                              # SKILL_HANDLERS map (target merge `contacts.list` entry)
convex/_seeds/aiDefaults.ts                                             # DEFAULT_AI_TOOLS catalog (target append contacts.* tools)
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

# Slice
mkdir -p "$DST/frontend/src/slices"
cp -r "$SRC/frontend/src/slices/networking" "$DST/frontend/src/slices/"

# Shared deps
mkdir -p "$DST/frontend/src/shared/types"
mkdir -p "$DST/frontend/src/shared/lib"
mkdir -p "$DST/frontend/src/shared/hooks"
mkdir -p "$DST/frontend/src/shared/components/ui"
mkdir -p "$DST/frontend/src/shared/components/onboarding"

cp    "$SRC/frontend/src/shared/types/sliceManifest.ts"                   "$DST/frontend/src/shared/types/"
cp    "$SRC/frontend/src/shared/lib/sliceRegistry.ts"                     "$DST/frontend/src/shared/lib/"
cp    "$SRC/frontend/src/shared/lib/aiActionBus.ts"                       "$DST/frontend/src/shared/lib/"
cp    "$SRC/frontend/src/shared/lib/notify.ts"                            "$DST/frontend/src/shared/lib/"
cp    "$SRC/frontend/src/shared/hooks/useAuth.tsx"                        "$DST/frontend/src/shared/hooks/"
cp    "$SRC/frontend/src/shared/hooks/useDemoOverlay.ts"                  "$DST/frontend/src/shared/hooks/"
cp -r "$SRC/frontend/src/shared/components/onboarding"                    "$DST/frontend/src/shared/components/"
cp    "$SRC/frontend/src/shared/components/ui/responsive-page-header.tsx" "$DST/frontend/src/shared/components/ui/"
cp    "$SRC/frontend/src/shared/components/ui/responsive-carousel.tsx"    "$DST/frontend/src/shared/components/ui/"
cp    "$SRC/frontend/src/shared/components/ui/responsive-dialog.tsx"      "$DST/frontend/src/shared/components/ui/"
cp    "$SRC/frontend/src/shared/components/ui/responsive-select.tsx"      "$DST/frontend/src/shared/components/ui/"

# Backend
cp -r "$SRC/convex/contacts" "$DST/convex/"
# If target already has convex/ai/skillHandlers.ts, MERGE the contacts.list entry
# (don't overwrite — handlers from other slices live there too):
#   "contacts.list": async (ctx) => { ... }   → see CareerPack file for the canonical impl.
```

**Schema additions** — copy `contacts` table from `convex/contacts/schema.ts`. Indexes: `by_user`, `by_user_role`, `by_user_last`.

**Convex api.d.ts**:

```ts
import type * as contacts_mutations from "../contacts/mutations.js";
import type * as contacts_queries   from "../contacts/queries.js";

declare const fullApi: ApiFromModules<{
  // ...
  "contacts/mutations": typeof contacts_mutations;
  "contacts/queries":   typeof contacts_queries;
}>;
```

**npm deps** — none specific.

**Env vars** — none specific.

**Manifest + binder wiring** (CRITICAL — slice-manifest framework):

1. **Register manifest** in `frontend/src/shared/lib/sliceRegistry.ts`:
   ```ts
   import { networkingManifest } from "@/slices/networking";
   export const SLICE_REGISTRY: ReadonlyArray<SliceManifest> = [
     // ...
     networkingManifest,
   ];
   ```

2. **Mount binder globally** in `frontend/src/shared/providers/Providers.tsx`:
   ```ts
   import { NetworkingCapabilities } from "@/slices/networking";
   // ...
   <NetworkingCapabilities />
   ```
   (Component renders `null` — just subscribes to bus on mount.)

3. **Server skill handler** — append `contacts.list` ke `convex/ai/skillHandlers.ts` `SKILL_HANDLERS` map. Reference impl di CareerPack source.

4. **Tools catalog** — append entries `contacts.list`, `contacts.create`, `contacts.update`, `contacts.delete` ke `DEFAULT_AI_TOOLS` di `convex/_seeds/aiDefaults.ts` (mirror manifest skill IDs). Re-run admin "Seed default" untuk push ke `aiTools` table.

**Nav registration** — manifest sudah declare `nav.placement="more"`, `order: 50`, `href: "/dashboard/networking"`. Kalau target masih pakai legacy `navConfig.ts`, tambah entry manual; kalau sudah migrate ke registry-driven nav, otomatis muncul.

`dashboardRoutes.tsx` masih SSOT untuk catch-all router — pastikan slug `networking` masuk `DASHBOARD_VIEWS` dengan lazy `import("@/slices/networking").then((m) => m.NetworkingView)`.

**i18n** — Indonesian:
- Role keys English (`recruiter`/`mentor`/`peer`/`other`) — display labels translate
- Section copy: "Tambah", "Favorit", "Pencarian", "Semua"
- Toast: "Kontak ditambahkan", "Kontak diperbarui", "Kontak dihapus", "Gagal …"

**Common breakage after port:**

- **AI skill silent (no toast)** — `NetworkingCapabilities` tidak ter-mount di `Providers.tsx`. Subscribe di-mount efek `useEffect`; tanpanya bus event drop tanpa handler.
- **Manifest invisible to LLM** — `networkingManifest` belum ditambah ke `SLICE_REGISTRY`. `ALL_SKILLS` derived dari registry; tanpa registrasi, slash command + system-prompt brief skip.
- **`contacts.list` returns nothing to AI** — handler entry hilang di `convex/ai/skillHandlers.ts`. AI dapat empty payload + bingung.
- **Admin AI Tools panel kosong** — `aiDefaults.ts` belum diappend → admin "Seed default" tidak insert tool entries.
- **Cross-import error** — `manifest.ts` import `lucide-react`. Target butuh sama versi major.
- **Slug mismatch** — `manifest.route.slug` harus match `DASHBOARD_VIEWS` key.

**Testing the port:**

1. Navigate `/dashboard/networking` → grid render
2. Tambah kontak manual → muncul di list + toast sukses
3. Toggle favorite → kontak naik ke carousel
4. Klik mailto/tel/linkedin → app default OS buka, `lastInteraction` updated
5. **AI agent test**:
   - Buka AI agent console
   - Prompt: "Tambahkan kontak Budi Santoso, recruiter di Tokopedia, email budi@tokopedia.com"
   - Approve action card → kontak muncul + toast "Kontak ditambahkan: Budi Santoso"
   - Prompt: "Lihat semua kontak saya" → AI list contacts inline
   - Prompt: "Hapus Budi" → AI panggil `contacts.list` dulu lalu emit `contacts.delete` dengan id

Run `_porting-guide.md` §9 checklist.
