# Auth

`@convex-dev/auth` dengan 3 provider: **Password** (primary), **Anonymous** (fallback / dev), dan **Google** (OAuth — butuh konfigurasi env, lihat §1b + §5). Session token disimpan Convex, expose via `useConvexAuth()`.

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
    Google, // import Google from "@auth/core/providers/google"
  ],
})
```

## 1b. Google OAuth (konfigurasi operasional)

Provider `Google` sudah ada di `convex/auth.ts` dan tombol "Lanjutkan
dengan Google" sudah ada di `LoginPage.tsx` (`signIn("google")`). **Kode
sudah benar — yang sering hilang adalah konfigurasi env + Google Console.**
Tanpa langkah ini, tombolnya gagal seketika (no client creds).

1. **Google Cloud Console** → APIs & Services → Credentials → Create
   OAuth client ID → **Web application**.
2. **Authorized redirect URI** (paling sering salah): origin HTTP-Actions
   Convex (`.site` / `CONVEX_SITE_ORIGIN`, port 3211) + `/api/auth/callback/google`.
   **Bukan** URL frontend, **bukan** origin API (3210):
   ```
   https://site.<convex-backend-anda>/api/auth/callback/google
   ```
3. Set 3 env var di **backend Convex** (Dokploy env, lalu redeploy/restart):
   - `AUTH_GOOGLE_ID` — Client ID
   - `AUTH_GOOGLE_SECRET` — Client secret
   - `SITE_URL` — URL frontend (mis. `https://careerpack.org`) — tujuan
     redirect setelah auth selesai (beda dari `CONVEX_SITE_ORIGIN`).
4. Pastikan backend di-deploy **setelah** commit `c6bc8a1` (provider Google)
   — kalau backend lebih lama, provider belum ada → `signIn("google")` gagal.

> Catatan account-linking: kalau email yang sama dipakai sign-up password
> lalu login Google, Auth.js default **tidak** auto-link (anti account-takeover)
> — bisa jadi 2 akun. Verifikasi perilaku ini setelah OAuth jalan.

**Kenapa PBKDF2 custom, bukan Scrypt default?** Scrypt (default convex-auth) butuh >60s di hardware terbatas / di belakang Dokploy reverse proxy, time out WebSocket action. PBKDF2-SHA256 100k iter (OWASP 2023 baseline) cukup aman + selesai <1s.

**Backward compat**: `verifySecret` masih accept hash lama `pbkdf2_...` (10k iter) supaya user existing tidak ter-invalidate. Hash baru pakai prefix `pbkdf2v2_`.

## 2. Frontend Context

File: `frontend/shared/hooks/useAuth.tsx`.

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

1. `convex.query(api.profile.queries.userExistsByEmail, { email })` — cek existing
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

Untuk Google OAuth (lihat §1b), backend juga butuh:
- `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` — kredensial OAuth client.
- `SITE_URL` — URL frontend untuk redirect balik. **Beda** dari `CONVEX_SITE_URL`
  (itu origin backend; `SITE_URL` adalah origin Next.js).

Lihat [deployment.md](./deployment.md) untuk Docker/Dokploy setup.

## 6. Troubleshooting

| Gejala | Root cause | Fix |
|---|---|---|
| Login hang / timeout | Scrypt default ketemu reverse proxy 60s | Sudah ter-fix via PBKDF2 custom — pastikan `convex/auth.ts` tidak ter-revert |
| `Missing environment variable JWT_PRIVATE_KEY` | Backend env kosong | Set di Convex dashboard / `.env` self-hosted, restart |
| `InvalidAccountId` berulang | DB self-hosted rusak / seed lama | `docker compose down -v` + `up` + push ulang |
| User baru tidak dapat seed | First `seedForCurrentUser` throw — log `console.warn` | Panggil manual lewat settings atau fix schema drift |
| "Lanjutkan dengan Google" spin lalu gagal | `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` belum di-set di backend | Set 3 env (§1b) di Dokploy → redeploy/restart backend |
| Google: `redirect_uri_mismatch` | Redirect URI di Google Console ≠ `<CONVEX_SITE_ORIGIN>/api/auth/callback/google` | Pakai origin `.site` (3211), bukan frontend / bukan `.cloud` (3210) |
| Google sukses tapi balik ke origin salah / localhost | `SITE_URL` backend belum di-set / salah | Set `SITE_URL` = URL frontend publik, restart backend |
| Google: `Could not find public function` / provider error | Backend belum di-deploy setelah `c6bc8a1` | `pnpm backend:deploy` dari mesin dengan admin key |
