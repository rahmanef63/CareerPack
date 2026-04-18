# Auth

`@convex-dev/auth` dengan 2 provider: **Password** (primary) dan **Anonymous** (fallback / dev). Session token disimpan Convex, expose via `useConvexAuth()`.

## 1. Provider Stack

File: `convex/auth.ts`.

```ts
convexAuth({
  providers: [
    Password<DataModel>({
      profile(p) { return { email: p.email, name: p.name } },
      validatePasswordRequirements(pw) {
        // min 8, max 128, wajib huruf + angka
      },
      crypto: { hashSecret, verifySecret } // PBKDF2-SHA256 100k iter
    }),
    Anonymous,
  ],
})
```

**Kenapa PBKDF2 custom, bukan Scrypt default?** Scrypt (default convex-auth) butuh >60s di hardware terbatas / di belakang Dokploy reverse proxy, time out WebSocket action. PBKDF2-SHA256 100k iter (OWASP 2023 baseline) cukup aman + selesai <1s.

**Backward compat**: `verifySecret` masih accept hash lama `pbkdf2_...` (10k iter) supaya user existing tidak ter-invalidate. Hash baru pakai prefix `pbkdf2v2_`.

## 2. Frontend Context

File: `frontend/src/shared/hooks/useAuth.tsx`.

`<AuthProvider>` wrap app. Pakai:

```ts
const { state, login, register, logout, updateUser } = useAuth();

state = {
  user: AuthUser | null,    // { id, email, name, role, … }
  isAuthenticated: boolean,
  isLoading: boolean,       // auth check + profile query
}
```

### Flow `login(credentials)`

1. `convex.query(api.users.userExistsByEmail, { email })` — cek existing
2. Kalau ada → `signIn("password", { …, flow: "signIn" })`
   Kalau tidak → `signIn("password", { …, flow: "signUp", name })` (auto-register)
3. Setelah berhasil, `seedForCurrentUser()` di-trigger. Error di-swallow dengan warn.

Design rationale: login-or-register satu tombol supaya UX mulus untuk user baru. Explicit `register()` juga ada untuk form yang butuh nama custom.

### Role check

Frontend pakai `state.user.role` yang di-compute dari `userProfile`. Saat ini hard-code `"user"` — untuk admin manual set lewat Convex dashboard (update field di `userProfiles` atau tambah kolom role). `/admin` guard pakai field ini.

## 3. Route Guards

### Dashboard (`app/(dashboard)/layout.tsx`)

```tsx
if (!state.isLoading && !state.isAuthenticated) router.replace("/login");
if (state.isLoading || !state.isAuthenticated) return <Spinner />;
```

### Admin (`app/admin/page.tsx`)

Double guard: auth + role.

```tsx
if (!auth) → /login
else if (role !== "admin") → /
```

### Marketing (`/`)

Kalau sudah login → auto-redirect ke `/dashboard`. Tidak blocking — landing tetap render singkat sebelum redirect.

## 4. Convex-side Guards

Setiap mutation/query harus guard sendiri via `_lib/auth.ts`:

- `requireUser(ctx)` — throw `"Tidak terautentikasi"` kalau unauth. Pakai di mutation.
- `optionalUser(ctx)` — return `null` kalau unauth. Pakai di query list supaya tidak meledak saat logout.
- `requireOwnedDoc(ctx, docId)` — fetch doc + cek `userId === auth user`. Throw `"… tidak ditemukan"` (bukan "forbidden") supaya enumeration attack tidak reveal existence.

## 5. Session Env

Backend wajib set:
- `JWT_PRIVATE_KEY` — PEM RSA private key. Generate:
  ```bash
  openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out jwt.pem
  # copy content (including BEGIN/END lines) ke env
  ```
- `CONVEX_SITE_URL` — public URL backend (self-hosted: `https://<your-convex-backend>`, cloud: `https://<id>.convex.site`)

Lihat [deployment.md](./deployment.md) untuk Docker/Dokploy setup.

## 6. Troubleshooting

| Gejala | Root cause | Fix |
|---|---|---|
| Login hang / timeout | Scrypt default ketemu reverse proxy 60s | Sudah ter-fix via PBKDF2 custom — pastikan `convex/auth.ts` tidak ter-revert |
| `Missing environment variable JWT_PRIVATE_KEY` | Backend env kosong | Set di Convex dashboard / `.env` self-hosted, restart |
| `InvalidAccountId` berulang | DB self-hosted rusak / seed lama | `docker compose down -v` + `up` + push ulang |
| User baru tidak dapat seed | First `seedForCurrentUser` throw — log `console.warn` | Panggil manual lewat settings atau fix schema drift |
