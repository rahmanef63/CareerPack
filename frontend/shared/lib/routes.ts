/**
 * Route config — single source of truth for every URL path the app
 * uses. Consumed by:
 *   - RouteGuard (client-side redirect targets)
 *   - useAuth (post-login push targets)
 *   - navConfig (sidebar / bottom nav hrefs compose from these)
 *   - future Next.js middleware (server-side auth gate)
 *
 * Having one map means renaming `/dashboard` to `/app` tomorrow is a
 * one-line change, and nothing hardcoded elsewhere will diverge.
 */

export const ROUTES = {
  marketing: {
    landing: "/",
  },
  auth: {
    login: "/login",
    forgotPassword: "/forgot-password",
    resetPassword: (token: string) => `/reset-password/${token}`,
  },
  dashboard: {
    home: "/dashboard",
    // Sub-paths resolved by DASHBOARD_VIEWS registry — keep in sync
    // with shared/lib/dashboardRoutes.tsx.
    cv: "/dashboard/cv",
    calendar: "/dashboard/calendar",
    applications: "/dashboard/applications",
    roadmap: "/dashboard/roadmap",
    checklist: "/dashboard/checklist",
    interview: "/dashboard/interview",
    calculator: "/dashboard/calculator",
    settings: "/dashboard/settings",
    matcher: "/dashboard/matcher",
    networking: "/dashboard/networking",
    portfolio: "/dashboard/portfolio",
    notifications: "/dashboard/notifications",
    help: "/dashboard/help",
    adminPanel: "/dashboard/admin-panel",
  },
  admin: "/admin",
  publicProfile: (slug: string) => `/${slug}`,
} as const;

/**
 * Route matchers — for middleware + RouteGuard to decide which gate
 * to apply. Tested against `pathname` only (not search / hash).
 */
export function isAuthRoute(pathname: string): boolean {
  return (
    pathname === ROUTES.auth.login ||
    pathname === ROUTES.auth.forgotPassword ||
    pathname.startsWith("/reset-password/")
  );
}

export function isDashboardRoute(pathname: string): boolean {
  return pathname === ROUTES.dashboard.home || pathname.startsWith("/dashboard/");
}

export function isAdminRoute(pathname: string): boolean {
  return pathname === ROUTES.admin || pathname.startsWith("/admin/");
}

export function isMarketingRoute(pathname: string): boolean {
  // Public pages — landing + public profile dynamic slug + a few static.
  if (pathname === "/") return true;
  if (isAuthRoute(pathname)) return false;
  if (isDashboardRoute(pathname)) return false;
  if (isAdminRoute(pathname)) return false;
  // Anything else (e.g. /{slug}) treated as marketing-ish: unauth-safe.
  return true;
}

/**
 * Redirect target after successful login — dashboard home by default.
 * Takes an optional `redirect` query param (e.g. ?redirect=/dashboard/cv)
 * so deep-linked sign-ins land on the intended destination, not the
 * generic home.
 */
export function postLoginTarget(redirectParam?: string | null): string {
  if (!redirectParam) return ROUTES.dashboard.home;
  // Only allow in-app targets; reject absolute URLs (prevents open-redirect).
  if (!redirectParam.startsWith("/") || redirectParam.startsWith("//")) {
    return ROUTES.dashboard.home;
  }
  return redirectParam;
}
