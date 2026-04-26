# Admin Panel

> **Portability tier:** L — slice + shared hook + new Convex module + 1 schema change + recharts dep

## Tujuan

Panel analitik untuk super-admin tunggal (email-gated). Data agregat
dari semua pengguna yang bisa dipakai mengambil keputusan produk —
mis. "jika banyak user target 'guru', pertimbangkan roadmap guru".

## Route & Entry

- URL: `/dashboard/admin-panel`
- Slice: `frontend/src/slices/admin-panel/`
- Main component: `AdminPanel.tsx`

## Struktur Slice

```
admin-panel/
├─ index.ts
└─ components/AdminPanel.tsx   ~300 baris
```

## Data Flow

Backend: `convex/admin/queries.ts` — 5 gated queries + 1 non-throwing probe.

| Query | Return | Gated |
|---|---|---|
| `amISuperAdmin` | `boolean` | Non-throwing probe (false for non-super-admin) |
| `getOverview` | Users + signup window + profile completeness + storage | `requireSuperAdmin` |
| `getProfileAggregates` | Top-20 targetRole / location / experience / skills / interests | `requireSuperAdmin` |
| `getFeatureAdoption` | Per-slice % of users engaged | `requireSuperAdmin` |
| `getSignupTrend` | Daily signup buckets (30 days) | `requireSuperAdmin` |
| `listUsersWithProfiles` | Latest 200 users + joined profile data | `requireSuperAdmin` |

Three-layer access enforcement:
1. **Nav hiding** (UX) — `useVisibleMoreApps()` reads `amISuperAdmin` and filters the MoreAppTile.
2. **Component redirect** (UX) — `useEffect` on `amISuperAdmin === false` pushes to `/dashboard`.
3. **Server enforcement** (security) — every data query throws `"Tidak berwenang"`.

## State Lokal

- `amI` — super-admin probe
- `overview`, `profileAggs`, `adoption`, `trend`, `users` — all Convex queries
- `trendData` — memoized chart data with `MM-DD` labels

## Dependensi

- `@/shared/hooks/useVisibleMoreApps` — filters MORE_APPS by super-admin status
- `recharts` — LineChart (signup trend) + BarChart (feature adoption)
- shadcn: `card`, `badge`, `progress`, `table`
- `@/shared/components/ui/responsive-page-header`

## Catatan Desain

- **Super-admin via env var:** `SUPER_ADMIN_EMAIL` (Convex env — `pnpm exec convex env set SUPER_ADMIN_EMAIL you@example.com`) gates the panel. Empty/unset = no super-admin and every super-admin endpoint denies. Stricter than `requireAdmin` — role-admin accounts are rejected. Ownership transfer = `convex env set` to the new email.
- **Generic error message** `"Tidak berwenang"` so a non-super-admin can't deduce the gate.
- **Top-N = 20, display 10** — enough room for distribution insights without overwhelming the UI.
- **listUsersWithProfiles caps at 200** — CSV export via browser table copy is acceptable for that scale. Pagination = future.

## Extending

- **CSV / JSON export** button on user table
- **Time-bucket drilldown** — click a day in signup trend → see those users
- **Retention cohort** — % of day-N signups still active after 7 / 30 days
- **Email drip** — "X users with targetRole=guru, want to notify them?"

---

## Portabilitas

**Tier:** L

**Files untuk dicopy (5 files + 1 edit):**

```
# Slice
frontend/src/slices/admin-panel/
  index.ts
  components/AdminPanel.tsx

# Shared nav filter hook
frontend/src/shared/hooks/useVisibleMoreApps.ts

# Backend
convex/admin/queries.ts

# Auth helper (partial edit — add 2 fns + 1 constant to existing file)
convex/_shared/auth.ts
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

mkdir -p "$DST/frontend/src/slices/admin-panel/components"
mkdir -p "$DST/frontend/src/shared/hooks"

cp -r "$SRC/frontend/src/slices/admin-panel/." "$DST/frontend/src/slices/admin-panel/"
cp "$SRC/frontend/src/shared/hooks/useVisibleMoreApps.ts" "$DST/frontend/src/shared/hooks/"
cp "$SRC/convex/admin/queries.ts" "$DST/convex/"
```

**Auth helper additions** — in target's `convex/_shared/auth.ts`, append:

```ts
export const SUPER_ADMIN_EMAIL = "you@your-domain.com"; // ← change to target super-admin

export async function requireSuperAdmin(ctx) {
  const userId = await requireUser(ctx);
  const user = await ctx.db.get(userId);
  if (!user || user.email !== SUPER_ADMIN_EMAIL) throw new Error("Tidak berwenang");
  return userId;
}

export async function isSuperAdminCaller(ctx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return false;
  const user = await ctx.db.get(userId);
  return user?.email === SUPER_ADMIN_EMAIL;
}
```

**Schema additions** — **NONE.** Analytics aggregates read existing tables (`users`, `userProfiles`, `cvs`, etc.). If the target has any of those, analytics over them works; remove the query lines for tables the target lacks.

**Convex api.d.ts** — add:

```ts
import type * as analytics from "../analytics.js";
// …
analytics: typeof analytics;
```

**npm deps:**

```bash
pnpm -F frontend add recharts   # if not already present
```

**Nav registration:**

1. `dashboardRoutes.tsx`:
   ```ts
   const ADMIN_PANEL: View = dynamic(
     () => import("@/slices/admin-panel").then((m) => m.AdminPanel),
     { loading: loadingFallback }
   );
   DASHBOARD_VIEWS["admin-panel"] = ADMIN_PANEL;
   ```

2. `navConfig.ts`:
   - Add `"admin-panel"` to `MoreAppId` union
   - Extend `MoreAppTile` interface with `superAdminOnly?: boolean`
   - Append tile:
   ```ts
   { id: "admin-panel", label: "Admin Panel", icon: ShieldAlert, href: "/dashboard/admin-panel", hue: "from-red-500 to-rose-700", superAdminOnly: true }
   ```

3. Consumer updates (sidebar + drawer): import `useVisibleMoreApps` and replace `MORE_APPS` usage with `useVisibleMoreApps()`. See `app-sidebar.tsx` + `MoreDrawer.tsx` in CareerPack for the exact diff.

**Env vars** — none (super-admin email is a code constant; change to env var if you prefer runtime config).

**i18n** — all copy in Indonesian. Bulk replace:
- "Admin Panel" (keep)
- "Total Pengguna" → "Total Users"
- "Profil Lengkap" → "Profile Complete"
- "Tren Pendaftaran" → "Signup Trend"
- "Top Target Role" → same
- "Adopsi Fitur" → "Feature Adoption"
- Error `"Tidak berwenang"` → `"Forbidden"` (kept generic)

**Common breakage after port:**

- **Analytics queries reference tables that don't exist** — remove those entries from `getFeatureAdoption`'s `Promise.all`. Schema drift between source/target.
- **`useVisibleMoreApps` assumes MORE_APPS shape** — if the target renames nav config, adjust the import.
- **Nav-config `superAdminOnly` filter bypassed** — check both `app-sidebar.tsx` and `MoreDrawer.tsx` consume the filtered list.
- **recharts theme colors** — uses `oklch(var(--brand))` etc. If target uses HSL tokens, swap to `hsl(var(--brand))`.

**Testing the port:**

1. Sign in as the configured `SUPER_ADMIN_EMAIL` account → "Admin Panel" tile visible
2. Sign in as any other account → tile absent; manually visit `/dashboard/admin-panel` → redirects to `/dashboard`
3. In Convex logs, verify `analytics.*` throws `"Tidak berwenang"` for non-super-admin
4. Signup trend chart renders 30 buckets (even if most are 0)
5. Feature adoption bars sorted by % desc

Run `_porting-guide.md` §9 checklist.
