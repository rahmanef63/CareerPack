# Auth (LoginPage + Forgot/Reset Password)

> **Portability tier:** XL — full auth platform: slice + Convex `@convex-dev/auth` + custom PBKDF2-SHA256 + JWT keys + password-reset flow + JWT-aware `RouteGuard`.

## Tujuan

Form sign-in + sign-up tunggal. Tab `Masuk` + tab `Daftar`. Setelah
success, redirect `/dashboard`. Link "Lupa password?" buka flow reset
token berbasis email + link sekali pakai (TTL 30 menit).

## Route & Entry

- URL: `/login` — page `frontend/app/(marketing)/login/page.tsx`
- URL: `/forgot-password` — `frontend/app/(marketing)/forgot-password/page.tsx`
- URL: `/reset-password/[token]` — `frontend/app/(marketing)/reset-password/[token]/page.tsx`
- Slice: `frontend/src/slices/auth/`
- Komponen utama: `LoginPage.tsx`

## Struktur Slice

```
auth/
├─ index.ts                      export { LoginPage }
└─ components/LoginPage.tsx      Tabs (Masuk / Daftar), shared UX
```

Forgot-password + reset-password pages live directly in
`app/(marketing)/` as route-level client components — no shared state
across them, each page self-contained.

Cross-cutting auth wiring (NOT in slice):

- `@/shared/hooks/useAuth.tsx` — `AuthProvider`, `useAuth()`,
  `login()`, `register()`, `logout()`, `seedForCurrentUser()`.
- `@/shared/types/auth.ts` — `AuthUser`, `LoginCredentials`,
  `AuthContextValue`.
- `@/shared/components/auth/RouteGuard.tsx` — auth/guest/role gate.
- `@/shared/containers/AuthShell.tsx` — centred auth-form layout.

## Data Flow

### LoginPage

| Tab | Aksi |
|---|---|
| `Masuk` | `login({ email, password })` → `api.profile.queries.userExistsByEmail` → `signIn("password", { flow: "signIn" \| "signUp" })` + `seedForCurrentUser()` |
| `Daftar` | `register({ email, password, name })` → `signIn("password", { flow: "signUp" })` + `seedForCurrentUser()` |

`useAuth.login` is **login-or-register in one call**: probes existence
first, picks `flow` accordingly. PBKDF2-SHA256 100k hash via custom
provider — Scrypt timed out behind Dokploy proxy, so we re-implemented
the verifier with backwards-compat for legacy `pbkdf2_` (10k) hashes.

### Forgot-password

- `api.passwordReset.requestReset({ email })` → always `{ ok: true }` (no enumeration leak).
- V1 delivery: backend writes link to `errorLogs` with
  `source="password-reset"`; admin pulls manually. V2: SMTP/Resend.

### Reset-password

- Token from `params` (Next 15 `use(params)`).
- `api.passwordReset.resetPassword({ token, newPassword })`.
- Validator client-side mirrors
  `convex/passwordReset.ts → validatePassword` (min 8, max 128, letter
  + digit).

## State Lokal

### LoginPage
- `showPassword`, `error`, `isLoading`
- `loginEmail`, `loginPassword`
- `registerName`, `registerEmail`, `registerPassword`

### Forgot-password
- `email`, `isLoading`, `submitted`, `error`

### Reset-password
- `password`, `confirm`, `showPassword`, `isLoading`, `error`. Token dari route params.

## Dependensi

- `@/shared/hooks/useAuth`
- `@/shared/components/brand/Logo` → `BrandMark`
- `convex/react` — `useMutation` for forgot/reset
- `sonner` — toast on reset success
- shadcn: `button`, `input`, `label`, `card`, `tabs`, `alert`

## Catatan Desain

- **PBKDF2-SHA256 100k.** Scrypt cost factor produced > 60s hash on
  Dokploy proxy (WebSocket timeout). PBKDF2 100k completes < 1s.
  Custom verifier accepts both `pbkdf2v2_` (current) and `pbkdf2_`
  (legacy 10k) for migration grace.
- **Single-call login-or-register.** Reduces cognitive friction;
  `Daftar` tab kept only for explicit name capture.
- **Reset token.** 32-byte random → URL-safe base64. PBKDF2-SHA256 100k
  hash stored in `passwordResetTokens`. TTL 30 minutes, single-use,
  invalidates prior outstanding tokens for same user on each request.
- **No enumeration.** Both `requestReset` (always `{ ok: true }`) and
  generic UI messaging.
- **Optional Anonymous provider** registered in `convex/auth.ts` — used
  for demo / PWA install previews; pinned in `useAuth.state.isDemo`.

## Extending

- Social providers (Google, GitHub) → add to `convex/auth.ts`
  + button in tab.
- Magic link via `@convex-dev/auth/providers/Email`.
- Email delivery (V2 reset) — replace `errorLogs` insert in
  `convex/passwordReset.ts` with action call to Resend/SMTP.
- Per-IP rate limit on `requestReset`.

---

## Portabilitas

**Tier:** XL

**Files untuk dicopy:**

```
# Frontend slice + pages
frontend/src/slices/auth/
frontend/app/(marketing)/login/page.tsx
frontend/app/(marketing)/forgot-password/page.tsx
frontend/app/(marketing)/reset-password/[token]/page.tsx

# Shared
frontend/src/shared/hooks/useAuth.tsx
frontend/src/shared/types/auth.ts
frontend/src/shared/components/auth/RouteGuard.tsx
frontend/src/shared/containers/AuthShell.tsx

# Backend
convex/auth.ts
convex/auth.config.ts
convex/http.ts
convex/passwordReset.ts
convex/profile/                                  # getCurrentUser, userExistsByEmail
convex/_shared/auth.ts                           # requireUser, optionalUser, requireOwnedDoc, requireAdmin
convex/_seeds/                                   # seedForCurrentUser bootstrap data
```

**cp commands:**

```bash
SRC=~/projects/CareerPack DST=~/projects/<target>

cp -r "$SRC/frontend/src/slices/auth"            "$DST/frontend/src/slices/"
mkdir -p "$DST/frontend/app/(marketing)/login" \
         "$DST/frontend/app/(marketing)/forgot-password" \
         "$DST/frontend/app/(marketing)/reset-password/[token]"
cp "$SRC/frontend/app/(marketing)/login/page.tsx"               "$DST/frontend/app/(marketing)/login/"
cp "$SRC/frontend/app/(marketing)/forgot-password/page.tsx"     "$DST/frontend/app/(marketing)/forgot-password/"
cp "$SRC/frontend/app/(marketing)/reset-password/[token]/page.tsx" "$DST/frontend/app/(marketing)/reset-password/[token]/"

cp "$SRC/frontend/src/shared/hooks/useAuth.tsx" "$DST/frontend/src/shared/hooks/"
cp "$SRC/frontend/src/shared/types/auth.ts"     "$DST/frontend/src/shared/types/"
cp -r "$SRC/frontend/src/shared/components/auth" "$DST/frontend/src/shared/components/"
cp "$SRC/frontend/src/shared/containers/AuthShell.tsx" "$DST/frontend/src/shared/containers/"

cp "$SRC/convex/auth.ts"          "$DST/convex/"
cp "$SRC/convex/auth.config.ts"   "$DST/convex/"
cp "$SRC/convex/http.ts"          "$DST/convex/"
cp "$SRC/convex/passwordReset.ts" "$DST/convex/"
cp -r "$SRC/convex/profile/"      "$DST/convex/"
cp "$SRC/convex/_shared/auth.ts"  "$DST/convex/_shared/"
cp -r "$SRC/convex/_seeds/"       "$DST/convex/"
```

**Schema additions** — copy from `convex/profile/schema.ts`,
`convex/auth.ts` defaults, plus:

```ts
// passwordResetTokens
defineTable({
  userId: v.id("users"),
  hashedToken: v.string(),
  expiresAt: v.number(),
  createdAt: v.number(),
})
  .index("by_token", ["hashedToken"])
  .index("by_user", ["userId"]),
```

`userProfiles` table — copy verbatim including optional `role`,
`publicSlug`, `publicHeadline`, etc. fields.

**Convex api.d.ts** — add `auth`, `profile`, `passwordReset`.

**npm deps:** `@convex-dev/auth` (already in baseline). No others
strictly for auth.

**Env vars (CRITICAL):**

| Var | Source | Purpose |
|---|---|---|
| `JWT_PRIVATE_KEY` | `npx @convex-dev/auth init` | PEM PKCS8 — JWT signing |
| `JWKS` | same init | JSON — JWT verify |
| `CONVEX_SITE_URL` | auto from `CONVEX_SITE_ORIGIN` | Auth callbacks |
| `ADMIN_BOOTSTRAP_EMAILS` | optional | Auto-promote on first login |
| `SUPER_ADMIN_EMAIL` | optional | Single super-admin gate |

**Common breakage after port:**

- **Scrypt timeout regression.** `convex/auth.ts` MUST keep custom
  PBKDF2 verifier — do NOT revert to upstream Scrypt. See `docs/auth.md`.
- **Autofill-poisoned register form.** Ensure `autoComplete="new-password"` on the registration password input.
- **JWT 401 after deploy.** `JWT_PRIVATE_KEY` + `JWKS` must round-trip
  exactly; copy/paste artifacts (newline → space) break verification.
- **`seedForCurrentUser()` failing** after first login is logged + swallowed in `useAuth.login`. Inspect Convex logs if seed data missing.

**i18n:** Indonesian throughout LoginPage + Convex error strings.

See `_porting-guide.md` for baseline + §9 checklist.
