/**
 * Re-export shim. Navigation is DERIVED from the single dashboard registry
 * (`@/shared/lib/dashboardRegistry`) — one source of truth for routing + nav,
 * so PRIMARY_NAV / MORE_APPS can no longer drift from DASHBOARD_VIEWS.
 * Kept so existing `navConfig` import sites (BottomNav, DesktopSidebar,
 * MoreDrawer, useVisibleMoreApps, …) keep working unchanged.
 */
export {
  PRIMARY_NAV,
  MORE_APPS,
  MORE_NAV_ICON,
  PRIMARY_VIEW_IDS,
  ALL_NAV_ITEMS,
  labelForPath,
  activeNavForPath,
} from "@/shared/lib/dashboardRegistry";
export type {
  NavItem,
  MoreAppTile,
  NavId,
  PrimaryNavId,
  MoreAppId,
} from "@/shared/lib/dashboardRegistry";
