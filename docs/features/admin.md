# Admin Dashboard

## Tujuan

Panel admin internal — overview user, CV, application, AI usage + konfigurasi AI global. Visibility + operasi admin-only (bukan fitur end-user).

## Route & Entry

- URL: `/admin`
- Page: `frontend/app/admin/page.tsx` (role guard)
- Slice: `frontend/src/slices/admin/`
- Komponen utama: `AdminDashboard.tsx`

## Struktur Slice

```
admin/
├─ index.ts
├─ components/AdminDashboard.tsx
├─ types/index.ts               AdminStats, AIConfig
└─ utils/mockDataGenerator.ts   generateAllMockData — placeholder sampling untuk UI dev
```

## Data Flow

Saat ini mayoritas pakai **mock data** (`mockDataGenerator.ts`) — admin endpoint Convex belum wired. Stats hard-coded untuk development UI.

Type contract tetap kontrak `AdminStats`:
```ts
{
  totalUsers, activeUsers, totalCVs, totalApplications,
  aiUsage: { totalRequests, totalTokens, lastMonth }
}
```

Ke depan: wire ke Convex query (butuh admin-scoped queries di `convex/users.ts` atau module baru `admin.ts` dengan `requireAdmin` guard).

## Role Guard

`app/admin/page.tsx`:
```tsx
if (!state.isAuthenticated) → /login
else if (state.user?.role !== "admin") → /
else → <AdminDashboard />
```

Field `role` di-read dari `userProfile`. Saat ini semua user hard-code `"user"` di `useAuth.tsx`. Untuk bikin admin: manual update field role di Convex dashboard atau tambah kolom di schema `userProfiles`.

## Dependensi

- `@/shared/hooks/useAuth` — role check
- Imports mockDataGenerator yang pakai types lintas slice: `CVData`, `Application`, `ChecklistItem`, `InterviewSession`
- shadcn: `card`, `table`, `badge`, `button`, `tabs`, `chart`

## Catatan Desain

- Cross-slice type import di `mockDataGenerator.ts` = exception yang di-accept karena admin memang perlu agregasi semua domain. Tetap violate slice isolation — kalau cleanup ketat, pindah types ke `@/shared/types`.
- Mock-first approach: UI bisa develop tanpa backend ready, tapi production wiring wajib sebelum ship.

## Extending

1. **Backend guard helper** — `convex/_lib/auth.ts` tambah `requireAdmin(ctx)` yang cek `userProfile.role === "admin"`.
2. **Admin module** — `convex/admin.ts`: `listAllUsers`, `getGlobalStats`, `updateUserRole`, `viewErrorLogs`.
3. **Error log viewer** — tabel `errorLogs` sudah ada (lihat [../backend.md](../backend.md)) — admin query `orderBy timestamp desc` + filter source.
4. **AI usage monitor** — aggregate dari `rateLimitEvents` per user + per key (`ai:minute`, `ai:day`).
5. **Role editor** — bulk assign admin / moderator / user.
