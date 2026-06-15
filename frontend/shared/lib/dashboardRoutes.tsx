/**
 * Re-export shim. The dashboard routing + nav SSOT now lives in ONE place:
 * `dashboardRegistry.tsx` (one entry per page; DASHBOARD_VIEWS + nav are
 * derived there). This file is kept so existing `@/shared/lib/dashboardRoutes`
 * import sites (the catch-all `/dashboard/[[...slug]]` page) keep working.
 */
export { DASHBOARD_VIEWS, resolveDashboardView } from "./dashboardRegistry";
export type { DashboardSlug } from "./dashboardRegistry";
