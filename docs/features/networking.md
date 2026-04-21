# Jaringan (Networking)

## Tujuan

Kontak profesional (rekruter, mentor, rekan) dengan profil ringkas + quick-action (email, telepon, LinkedIn). Favorit naik ke carousel atas.

## Route & Entry

- URL: `/dashboard/networking`
- Slice: `frontend/src/slices/networking/`
- Komponen utama: `NetworkingView.tsx`, `ContactCard.tsx`, `ContactForm.tsx`

## Struktur Slice

```
networking/
├─ index.ts
├─ components/
│  ├─ NetworkingView.tsx   Page — header + stats + favorites carousel + search + role tabs + grid
│  ├─ ContactCard.tsx      Avatar gradient + role badge + quick-action buttons + favorite star
│  └─ ContactForm.tsx      ResponsiveDialog + ResponsiveSelect role picker + hue swatch
├─ hooks/useNetworking.ts
├─ constants/index.ts      ROLE_LABELS, ROLE_EMOJIS, AVATAR_HUES, DEFAULT_FORM
└─ types/index.ts          Contact, ContactRole, ContactFilter, ContactFormValues
```

## Data Flow

| Operation | Convex fn | Purpose |
|---|---|---|
| List | `api.networking.listContacts` | All contacts untuk user, desc by createdAt |
| Create | `api.networking.createContact` | Insert + set `lastInteraction = Date.now()` |
| Update | `api.networking.updateContact` | Partial patch |
| Delete | `api.networking.deleteContact` | Ownership-checked |
| Favorite | `api.networking.toggleContactFavorite` | Flip `favorite` flag |
| Bump | `api.networking.bumpContactInteraction` | Update `lastInteraction` (dipakai saat user tap email/telepon/linkedin) |

## Schema

Tabel `contacts`:

```ts
{
  userId, name,
  role: "recruiter" | "mentor" | "peer" | "other",
  company?, position?, email?, phone?, linkedinUrl?,
  notes?, avatarEmoji?, avatarHue?,
  lastInteraction?: number,
  favorite: boolean
}
```

Indexes: `by_user`, `by_user_role`, `by_user_last`.

## UI

1. **ResponsivePageHeader** — title + description + "Tambah" action (opens ContactForm).
2. **Stats strip 4-up** — Total / Favorit / Rekruter / Mentor.
3. **"Kontak Favorit" `ResponsiveCarousel`** (items dengan `favorite=true`).
4. **Search input** — filter nama, perusahaan, atau posisi.
5. **Filter tabs (`variant="pills"`)** — Semua / Rekruter / Mentor / Rekan / Lainnya dengan count badges.
6. **3-col grid** (1 mobile, 2 tablet, 3 desktop) dari ContactCard.

Quick actions per kontak (email / phone / linkedin) pakai `<a href="mailto:">` etc. — membuka app default OS. Setiap klik bump `lastInteraction` di Convex.

## Dependensi

- `@/shared/components/ui/responsive-page-header`
- `@/shared/components/ui/responsive-carousel`
- `@/shared/components/ui/responsive-dialog` (form)
- `@/shared/components/ui/responsive-select` (role picker)
- shadcn: `input`, `button`, `badge`, `tabs`, `switch`

## Catatan Desain

- Avatar gradient + emoji: fallback ke initial-initial kalau emoji absent. Hemat storage — tidak perlu file upload.
- `lastInteraction` belum dipakai untuk sort/display tapi ready untuk "Recently contacted" carousel v2.
- No "messaging" feature — outbound saja (mailto/tel/linkedin). Two-way chat bakal butuh dedicated `conversations` table.

## Extending

- "Recently Contacted" carousel (sort by `lastInteraction` desc)
- Follow-up reminders → integrate dengan `notifications` slice
- Tag system (custom labels di samping role enum)
- Import dari Google Contacts / LinkedIn CSV
- Join dengan `jobApplications` — link recruiter ke lamaran yang mereka assign
