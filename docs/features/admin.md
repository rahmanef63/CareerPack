# Admin Dashboard (`/admin` route)

> **Portability tier:** S — single page wrapper around `admin-panel` slice. The substantive admin functionality lives in [`admin-panel.md`](./admin-panel.md).

## Tujuan

Top-level role-gated page at `/admin`. Renders the same `<AdminPanel>`
slice that's wrapped under `/dashboard/admin-panel`, but via the
non-dashboard route so admins can deep-link without the dashboard
shell. Historical: this used to be a dedicated `slices/admin/` slice
with mock-data; that slice was retired and the route now just delegates
to the live `admin-panel` slice.

## Route & Entry

- URL: `/admin`
- Page: `frontend/app/admin/page.tsx`
- Renders: `<AdminPanel />` from `@/slices/admin-panel`
- Guard: `<RouteGuard mode="role" requiredRole="admin">`

## Struktur

There is **no `slices/admin/` folder anymore**. The page is a
two-import wrapper:

```tsx
// frontend/app/admin/page.tsx
import { RouteGuard } from "@/shared/components/auth/RouteGuard";
import { AdminPanel } from "@/slices/admin-panel";

export default function AdminPage() {
  return (
    <RouteGuard mode="role" requiredRole="admin">
      <AdminPanel />
    </RouteGuard>
  );
}
```

## Data Flow

Identical to `admin-panel.md` — same slice, same Convex queries.

## Role Guard

`RouteGuard mode="role" requiredRole="admin"` reads
`useAuth().state.user?.role` (mirrored from `userProfiles.role`).
Mismatch → redirect to `/dashboard`. Server enforcement still happens
inside each Convex query/mutation (`requireAdmin`).

Admin role bootstrap:
- `ADMIN_BOOTSTRAP_EMAILS` env (comma-separated) auto-promoted on
  first login.
- Manual: edit `userProfiles.role` directly in Convex dashboard.

## Dependensi

- `@/shared/components/auth/RouteGuard`
- `@/slices/admin-panel` — full implementation
- See `admin-panel.md` for everything else

## Catatan Desain

- The two routes (`/admin` and `/dashboard/admin-panel`) intentionally
  render the same component. `/admin` skips the dashboard shell
  (sidebar, bottom nav) — useful when admins want a focused full-page
  view; `/dashboard/admin-panel` keeps shell consistency for casual
  drop-ins.
- The legacy `slices/admin/` directory with mock-data has been removed;
  if you see a doc reference to `mockDataGenerator.ts`, it's stale.

## Extending

See `admin-panel.md → Extending`.

---

## Portabilitas

**Tier:** S — page wrapper only; the heavy lifting is in
`admin-panel.md`.

**Files untuk dicopy (1 page + dependency on admin-panel slice):**

```
frontend/app/admin/page.tsx
frontend/app/admin/error.tsx                       # if present, optional Next error boundary
```

**cp:**

```bash
SRC=~/projects/CareerPack DST=~/projects/<target>
mkdir -p "$DST/frontend/app/admin"
cp "$SRC/frontend/app/admin/page.tsx"  "$DST/frontend/app/admin/"
cp "$SRC/frontend/app/admin/error.tsx" "$DST/frontend/app/admin/" 2>/dev/null || true
```

**Prerequisite:** port `admin-panel` first (see `admin-panel.md`).
The page won't compile without `<AdminPanel>` available.

**Schema:** none beyond `userProfiles.role` (`v.union(v.literal("admin"), v.literal("user"))`).

**Convex api.d.ts:** none beyond what `admin-panel` already requires.

**npm deps / env vars:** see `admin-panel.md`. Add `ADMIN_BOOTSTRAP_EMAILS`.

**Nav:** the route lives **outside `(dashboard)/`** so it has no
`dashboardRoutes.tsx` entry. Linking from header user menu via plain
`<Link href="/admin">`.

**i18n:** all strings come from `admin-panel`.

**Common breakage:**
- `RouteGuard` mode="role" not implemented → port the role branch from
  `frontend/src/shared/components/auth/RouteGuard.tsx`.
- `userProfiles.role` field missing → add to schema; default `"user"`.

**Testing:**
1. Non-admin visits `/admin` → redirect to `/dashboard`.
2. Admin (role="admin") visits → `<AdminPanel>` renders without sidebar.
3. Bootstrap email signs up first time → role auto-set to `"admin"`.

Run `_porting-guide.md` §9 checklist.
