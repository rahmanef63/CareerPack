import type { Metadata } from "next";
import { RouteGuard } from "@/shared/components/auth/RouteGuard";
import { AdminPanel } from "@/slices/admin-panel";

/**
 * Admin route is sensitive but data-safe: every consumed Convex query
 * already gates via server-side `requireAdmin(ctx)`, so even a leaked
 * client-rendered hint cannot pull privileged data. The client-side
 * `RouteGuard` renders `<LoadingScreen />` until auth resolves and
 * redirects non-admins before any panel chrome paints.
 *
 * `noindex` + `force-dynamic` ensure crawlers never index the route and
 * Next never tries to statically prerender it with stale auth state.
 *
 * Cookie-storage auth (`ConvexAuthNextjsServerProvider` +
 * `convexAuthNextjsToken()`) would unlock a true server-side gate via
 * `fetchQuery(api.admin.queries.amIAdmin, ..., { token })` — that's a
 * deliberate future migration and tracked separately.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · CareerPack",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <RouteGuard mode="role" requiredRole="admin">
      <AdminPanel />
    </RouteGuard>
  );
}
