# Auth (LoginPage)

## Tujuan

Form sign-in + sign-up tunggal. Satu tab `Masuk`, satu tab `Daftar`. Setelah success, redirect `/dashboard`.

## Route & Entry

- URL: `/login`
- Page: `frontend/app/(marketing)/login/page.tsx`
- Slice: `frontend/src/slices/auth/`
- Komponen utama: `LoginPage.tsx`

## Struktur Slice

```
auth/
├─ index.ts
└─ components/LoginPage.tsx
```

Context + types auth TIDAK di slice — cross-cutting, hidup di:
- `@/shared/hooks/useAuth` — `AuthProvider`, `useAuth`
- `@/shared/types/auth` — `AuthUser`, `LoginCredentials`, `AuthContextValue`

## Data Flow

Tidak query Convex langsung. Delegasi ke `useAuth()`:

| Tab | Aksi |
|---|---|
| `Masuk` | `login({ email, password })` → `userExistsByEmail` → `signIn("password", { flow: "signIn" })` + `seedForCurrentUser` |
| `Daftar` | `register({ email, password, name })` → `signIn("password", { flow: "signUp" })` + `seedForCurrentUser` |

Detail provider + hashing: lihat [../auth.md](../auth.md).

## State Lokal

- `showPassword`, `error`, `isLoading` — form UX state
- `loginEmail`, `loginPassword` — tab "Masuk"
- `registerName`, `registerEmail`, `registerPassword` — tab "Daftar"

## Dependensi

- `@/shared/hooks/useAuth` (kritis)
- `@/shared/components/Logo` → `BrandMark`
- shadcn: `button`, `input`, `label`, `card`, `tabs`, `alert`

## Catatan Desain

- Password disambiguation: min 8 char, max 128, wajib huruf + digit (validasi di `convex/auth.ts` `validatePasswordRequirements`). Frontend tidak re-validate — error dari Convex di-surface ke `<Alert>`.
- "Lupa password" belum diimplementasikan — butuh email reset flow (future work).
- Tab `Masuk` juga auto-handle sign-up via flow dual di `useAuth.login()` — user tidak perlu pindah tab kalau salah. Tab `Daftar` hanya untuk yang mau set nama eksplisit.

## Extending

- Social login (Google/GitHub) → tambah provider di `convex/auth.ts` + button di tab.
- Magic link → tambah Email provider dari `@convex-dev/auth/providers/Email`.
- Forgot password → butuh token-based reset, mutation `requestPasswordReset` + page `/reset/[token]`.
