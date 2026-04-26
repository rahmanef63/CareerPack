# Auth (LoginPage + Forgot-password flow)

## Tujuan

Form sign-in + sign-up tunggal. Satu tab `Masuk`, satu tab `Daftar`. Setelah success, redirect `/dashboard`. Link "Lupa password?" buka flow reset token berbasis email + link sekali pakai.

## Route & Entry

- URL: `/login` — page `frontend/app/(marketing)/login/page.tsx`
- URL: `/forgot-password` — page `frontend/app/(marketing)/forgot-password/page.tsx`
- URL: `/reset-password/[token]` — page `frontend/app/(marketing)/reset-password/[token]/page.tsx`
- Slice: `frontend/src/slices/auth/`
- Komponen utama: `LoginPage.tsx`

## Struktur Slice

```
auth/
├─ index.ts
└─ components/LoginPage.tsx
```

Forgot-password + reset-password pages hidup langsung di `app/(marketing)/` sebagai route-level client components (tidak di slice — tidak ada state lintas halaman, tiap halaman self-contained).

Context + types auth TIDAK di slice — cross-cutting, hidup di:
- `@/shared/hooks/useAuth` — `AuthProvider`, `useAuth`
- `@/shared/types/auth` — `AuthUser`, `LoginCredentials`, `AuthContextValue`

## Data Flow

### LoginPage
Tidak query Convex langsung. Delegasi ke `useAuth()`:

| Tab | Aksi |
|---|---|
| `Masuk` | `login({ email, password })` → `userExistsByEmail` → `signIn("password", { flow: "signIn" })` + `seedForCurrentUser` |
| `Daftar` | `register({ email, password, name })` → `signIn("password", { flow: "signUp" })` + `seedForCurrentUser` |

### Forgot-password page
- Email input → `api.passwordReset.requestReset({ email })` via `useMutation`.
- Mutation selalu balikin `{ ok: true }` (no enumeration leak).
- UI: setelah submit sekali, tampilkan pesan sukses generik ("jika email terdaftar, tautan sudah disiapkan") tanpa menyingkap apakah email valid.
- V1 delivery: backend log tautan ke `errorLogs` dengan `source="password-reset"` — admin / dev ambil manual. V2 integrasi Resend/SMTP.

### Reset-password page
- Baca `token` dari `params` (Next 15 `use(params)`).
- Form: password + konfirmasi. Validator client-side match `convex/auth.ts validatePasswordRequirements` (min 8, max 128, huruf + angka).
- Submit → `api.passwordReset.resetPassword({ token, newPassword })`.
- Sukses → toast sonner + redirect `/login`.
- Gagal (token expired / invalid) → error "Token tidak valid atau sudah kedaluwarsa" ke `<Alert>`.

Detail provider + hashing + password-reset backend: lihat [../auth.md](../auth.md).

## State Lokal

### LoginPage
- `showPassword`, `error`, `isLoading` — form UX state
- `loginEmail`, `loginPassword` — tab "Masuk"
- `registerName`, `registerEmail`, `registerPassword` — tab "Daftar"

### Forgot-password
- `email`, `isLoading`, `submitted`, `error`

### Reset-password
- `password`, `confirm`, `showPassword`, `isLoading`, `error`. Token dari route params (bukan state).

## Dependensi

- `@/shared/hooks/useAuth` (kritis untuk LoginPage)
- `@/shared/components/brand/Logo` → `BrandMark`
- `convex/react` — `useMutation` untuk forgot/reset flow
- `sonner` — toast sukses setelah reset
- shadcn: `button`, `input`, `label`, `card`, `tabs`, `alert`

## Catatan Desain

- Password disambiguation: min 8 char, max 128, wajib huruf + digit. Validasi double-sided (client + `convex/auth.ts` + `convex/passwordReset.ts validatePassword`) — client-side kasih feedback cepat, server-side tetap otoritatif.
- Tab `Masuk` juga auto-handle sign-up via flow dual di `useAuth.login()` — user tidak perlu pindah tab kalau salah. Tab `Daftar` hanya untuk yang mau set nama eksplisit.
- Reset token: 32-byte random → URL-safe base64. Hash PBKDF2-SHA256 100k + stored di `passwordResetTokens`. TTL 30 menit, single-use. Request baru invalidate request sebelumnya untuk user yang sama.
- Tidak ada enumeration: `requestReset` selalu balikin `{ ok: true }` baik email terdaftar atau tidak. Sama halnya di UI — pesan sukses generik.

## Extending

- Social login (Google/GitHub) → tambah provider di `convex/auth.ts` + button di tab.
- Magic link → tambah Email provider dari `@convex-dev/auth/providers/Email`.
- Email delivery (V2 password reset) → ganti `errorLogs` insert di `convex/passwordReset.ts` jadi action ke Resend/SMTP.
- Rate limit per-IP untuk `requestReset` (saat ini hanya rate limit Convex default per-function).

---

## Portabilitas

**Tier:** XL — full auth platform (slice + Convex module + PBKDF2 crypto + JWT keys + hooks + route guard).

**Files:**

```
# Frontend
frontend/src/slices/auth/                                    # LoginPage + AuthShell integration
frontend/app/(auth)/                                          # Route group (layout, login, forgot-password, reset-password)
frontend/src/shared/hooks/useAuth.tsx                         # AuthProvider + login/register flows
frontend/src/shared/types/auth.ts                             # AuthUser, AuthResult types
frontend/src/shared/components/auth/RouteGuard.tsx            # auth/guest/role gate
frontend/src/shared/containers/AuthShell.tsx                  # Centered auth form shell

# Backend
convex/auth.ts                                                # @convex-dev/auth config + PBKDF2
convex/auth.config.ts                                         # JWT provider domain
convex/http.ts                                                # auth.addHttpRoutes
convex/profile/                                               # getCurrentUser, userExistsByEmail
convex/passwordReset.ts                                       # Password reset flow
```

**cp:**

```bash
SRC=~/projects/CareerPack DST=~/projects/<target>

cp -r "$SRC/frontend/src/slices/auth"           "$DST/frontend/src/slices/"
cp -r "$SRC/frontend/app/(auth)"                "$DST/frontend/app/"
cp "$SRC/frontend/src/shared/hooks/useAuth.tsx" "$DST/frontend/src/shared/hooks/"
cp "$SRC/frontend/src/shared/types/auth.ts"     "$DST/frontend/src/shared/types/"
cp -r "$SRC/frontend/src/shared/components/auth" "$DST/frontend/src/shared/components/"
cp "$SRC/frontend/src/shared/containers/AuthShell.tsx" "$DST/frontend/src/shared/containers/"

cp "$SRC/convex/auth.ts"          "$DST/convex/"
cp "$SRC/convex/auth.config.ts"   "$DST/convex/"
cp "$SRC/convex/http.ts"          "$DST/convex/"
cp "$SRC/convex/profile/"         "$DST/convex/"
cp "$SRC/convex/passwordReset.ts" "$DST/convex/"
```

**Schema additions** — append `userProfiles` + `passwordResetTokens` tables (copy from CareerPack `convex/schema.ts` verbatim, including the `by_public_slug` + public* fields if you want public profiles).

**Convex api.d.ts** — add `auth`, `users`, `passwordReset` imports.

**npm deps:** `@convex-dev/auth` (already baseline).

**Env vars (CRITICAL):**
- `JWT_PRIVATE_KEY` (PEM PKCS8) — Dokploy compose env
- `JWKS` (JSON) — Dokploy compose env
- `CONVEX_SITE_ORIGIN` + `CONVEX_CLOUD_ORIGIN` — set by deploy.js

See `_porting-guide.md` §6 and `docs/auth.md` for JWT key generation + PBKDF2 rationale.

**Common breakage:** Scrypt timeout on Dokploy → use PBKDF2 (already in auth.ts). Autofill poisoning → ensure `autoComplete="new-password"` on register password.

**i18n:** Indonesian copy in LoginPage + error messages in users.ts / passwordReset.ts.

See `_porting-guide.md` for baseline + §9 checklist.
