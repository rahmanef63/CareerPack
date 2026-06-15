import dynamic from "next/dynamic";
import { createElement, type ComponentType } from "react";
import {
  Home,
  FileUser,
  Calendar,
  LayoutGrid,
  Map,
  ListChecks,
  Briefcase,
  Wallet,
  Bell,
  Settings as SettingsIcon,
  MessageSquare,
  Users,
  Folder,
  Compass,
  HelpCircle,
  ShieldAlert,
  Globe,
  Database,
  Library,
  type LucideIcon,
} from "lucide-react";
import { PageSkeleton } from "@/shared/components/feedback/PageSkeleton";

/**
 * SINGLE source of truth for dashboard routing + navigation.
 *
 * Adding a dashboard page = ONE entry in `REGISTRY` below. The catch-all
 * router map (`DASHBOARD_VIEWS`) and the nav shells (`PRIMARY_NAV` /
 * `MORE_APPS`) are all DERIVED from this array, so they can no longer drift
 * out of sync (the old failure mode: a slug registered in one place but not
 * the other). `dashboardRoutes.tsx` and `navConfig.ts` are thin re-export
 * shims over this file — all existing import sites keep working unchanged.
 *
 * Views are lazy via `next/dynamic` so each slice gets its own chunk
 * (smaller First Load JS). Slug `""` = `/dashboard` root. This file is plain
 * `.ts` (loading fallback via `createElement`, not JSX) so it transforms
 * cleanly under the test runner.
 *
 * NOTE: the typed path map in `routes.ts` (`ROUTES.dashboard.*`, consumed by
 * RouteGuard / useAuth for literal-typed redirect targets) is intentionally
 * kept separate — its `as const` literal types power call-site autocomplete
 * that a derived object would lose. Keep its dashboard paths in sync with the
 * slugs here.
 */

type View = ComponentType;

const loadingFallback = () => createElement(PageSkeleton);

const HOME: View = dynamic(
  () => import("@/slices/dashboard-home").then((m) => m.DashboardHome),
  { loading: loadingFallback }
);
const CV: View = dynamic(
  () => import("@/slices/cv-generator").then((m) => m.CVGenerator),
  { loading: loadingFallback }
);
const CALENDAR: View = dynamic(
  () => import("@/slices/calendar").then((m) => m.CalendarView),
  { loading: loadingFallback }
);
const APPLICATIONS: View = dynamic(
  () => import("@/slices/career-dashboard").then((m) => m.CareerDashboard),
  { loading: loadingFallback }
);
const ROADMAP: View = dynamic(
  () => import("@/slices/skill-roadmap").then((m) => m.SkillRoadmap),
  { loading: loadingFallback }
);
const CHECKLIST: View = dynamic(
  () => import("@/slices/document-checklist").then((m) => m.DocumentChecklist),
  { loading: loadingFallback }
);
const INTERVIEW: View = dynamic(
  () => import("@/slices/mock-interview").then((m) => m.MockInterview),
  { loading: loadingFallback }
);
const CALCULATOR: View = dynamic(
  () => import("@/slices/financial-calculator").then((m) => m.FinancialCalculator),
  { loading: loadingFallback }
);
const SETTINGS: View = dynamic(
  () => import("@/slices/settings").then((m) => m.SettingsView),
  { loading: loadingFallback }
);
const MATCHER: View = dynamic(
  () => import("@/slices/matcher").then((m) => m.MatcherView),
  { loading: loadingFallback }
);
const NETWORKING: View = dynamic(
  () => import("@/slices/networking").then((m) => m.NetworkingView),
  { loading: loadingFallback }
);
const PORTFOLIO: View = dynamic(
  () => import("@/slices/portfolio").then((m) => m.PortfolioView),
  { loading: loadingFallback }
);
const NOTIFICATIONS: View = dynamic(
  () => import("@/slices/notifications").then((m) => m.NotificationsView),
  { loading: loadingFallback }
);
const HELP: View = dynamic(
  () => import("@/slices/help").then((m) => m.HelpView),
  { loading: loadingFallback }
);
const ADMIN_PANEL: View = dynamic(
  () => import("@/slices/admin-panel").then((m) => m.AdminPanel),
  { loading: loadingFallback }
);
const PERSONAL_BRANDING: View = dynamic(
  () => import("@/slices/personal-branding").then((m) => m.PersonalBrandingView),
  { loading: loadingFallback }
);
const LIBRARY: View = dynamic(
  () => import("@/slices/library").then((m) => m.LibraryView),
  { loading: loadingFallback }
);
const DATABASE: View = dynamic(
  () => import("@/slices/database").then((m) => m.DatabaseView),
  { loading: loadingFallback }
);

// --- Nav type surface (kept identical to the old navConfig.ts) ---
export type PrimaryNavId = "home" | "cv" | "calendar" | "more";
export type MoreAppId =
  | "roadmap"
  | "checklist"
  | "applications"
  | "calculator"
  | "notifications"
  | "settings"
  | "interview"
  | "networking"
  | "portfolio"
  | "matcher"
  | "personal-branding"
  | "library"
  | "database"
  | "help"
  | "admin-panel";
export type NavId = PrimaryNavId | MoreAppId;

export interface NavItem<TId extends string = string> {
  id: TId;
  label: string;
  icon: LucideIcon;
  /** Next.js route pathname — SSOT untuk navigasi. */
  href: string;
}

export interface MoreAppTile extends NavItem<MoreAppId> {
  hue: string;
  badge?: string;
  /**
   * When true, the tile is hidden from nav unless a client-side gate
   * explicitly includes it (super-admin-only Admin Panel). Server also enforces.
   */
  superAdminOnly?: boolean;
}

type PrimaryNavMeta = {
  placement: "primary";
  id: Exclude<PrimaryNavId, "more">;
  label: string;
  icon: LucideIcon;
};
type MoreNavMeta = {
  placement: "more";
  id: MoreAppId;
  label: string;
  icon: LucideIcon;
  hue: string;
  badge?: string;
  superAdminOnly?: boolean;
};

interface RegistryEntry {
  /** Catch-all slug; "" = /dashboard root. Also the DASHBOARD_VIEWS key. */
  slug: string;
  view: View;
  /** Omit for route-only entries (e.g. the ai-settings legacy alias). */
  nav?: PrimaryNavMeta | MoreNavMeta;
}

function hrefForSlug(slug: string): string {
  return slug === "" ? "/dashboard" : `/dashboard/${slug}`;
}

/**
 * The one list. Order of `placement: "more"` entries = display order in the
 * MoreDrawer / desktop "Alat Lainnya". Primary entries (home, cv, calendar)
 * = BottomNav tabs. Route-only entries (no `nav`) resolve a URL but show no
 * nav item.
 */
const REGISTRY: readonly RegistryEntry[] = [
  { slug: "", view: HOME, nav: { placement: "primary", id: "home", label: "Dashboard", icon: Home } },
  { slug: "cv", view: CV, nav: { placement: "primary", id: "cv", label: "CV", icon: FileUser } },
  { slug: "calendar", view: CALENDAR, nav: { placement: "primary", id: "calendar", label: "Kalender", icon: Calendar } },
  { slug: "applications", view: APPLICATIONS, nav: { placement: "more", id: "applications", label: "Lamaran", icon: Briefcase, hue: "from-violet-400 to-violet-600" } },
  { slug: "interview", view: INTERVIEW, nav: { placement: "more", id: "interview", label: "Simulasi Wawancara", icon: MessageSquare, hue: "from-pink-400 to-pink-600", badge: "AI" } },
  { slug: "roadmap", view: ROADMAP, nav: { placement: "more", id: "roadmap", label: "Roadmap Skill", icon: Map, hue: "from-sky-400 to-sky-600" } },
  { slug: "checklist", view: CHECKLIST, nav: { placement: "more", id: "checklist", label: "Ceklis Dokumen", icon: ListChecks, hue: "from-emerald-400 to-emerald-600" } },
  { slug: "calculator", view: CALCULATOR, nav: { placement: "more", id: "calculator", label: "Kalkulator Keuangan", icon: Wallet, hue: "from-amber-400 to-amber-600" } },
  { slug: "matcher", view: MATCHER, nav: { placement: "more", id: "matcher", label: "Pencocok Lowongan", icon: Compass, hue: "from-cyan-400 to-cyan-600", badge: "AI" } },
  { slug: "networking", view: NETWORKING, nav: { placement: "more", id: "networking", label: "Jaringan", icon: Users, hue: "from-rose-400 to-rose-600" } },
  { slug: "portfolio", view: PORTFOLIO, nav: { placement: "more", id: "portfolio", label: "Portofolio", icon: Folder, hue: "from-orange-400 to-orange-600" } },
  { slug: "library", view: LIBRARY, nav: { placement: "more", id: "library", label: "Content Library", icon: Library, hue: "from-lime-400 to-lime-600" } },
  { slug: "personal-branding", view: PERSONAL_BRANDING, nav: { placement: "more", id: "personal-branding", label: "Personal Branding", icon: Globe, hue: "from-fuchsia-400 to-fuchsia-600", badge: "AI" } },
  { slug: "database", view: DATABASE, nav: { placement: "more", id: "database", label: "Database", icon: Database, hue: "from-indigo-400 to-indigo-600" } },
  { slug: "notifications", view: NOTIFICATIONS, nav: { placement: "more", id: "notifications", label: "Notifikasi", icon: Bell, hue: "from-yellow-400 to-yellow-600" } },
  { slug: "settings", view: SETTINGS, nav: { placement: "more", id: "settings", label: "Pengaturan", icon: SettingsIcon, hue: "from-slate-500 to-slate-700" } },
  { slug: "help", view: HELP, nav: { placement: "more", id: "help", label: "Pusat Bantuan", icon: HelpCircle, hue: "from-teal-400 to-teal-600" } },
  { slug: "admin-panel", view: ADMIN_PANEL, nav: { placement: "more", id: "admin-panel", label: "Admin Panel", icon: ShieldAlert, hue: "from-red-500 to-rose-700", superAdminOnly: true } },
  // Legacy bookmark `/dashboard/ai-settings` → same Settings page (route-only, no nav tile).
  { slug: "ai-settings", view: SETTINGS },
];

// --- Derived: routing (catch-all `/dashboard/[[...slug]]`) ---
export const DASHBOARD_VIEWS: Record<string, View> = Object.fromEntries(
  REGISTRY.map((e) => [e.slug, e.view])
);

export type DashboardSlug = string;

export function resolveDashboardView(
  slug: readonly string[] | undefined
): View | null {
  const key = slug?.[0] ?? "";
  return DASHBOARD_VIEWS[key] ?? null;
}

// --- Derived: navigation (BottomNav / Sidebar / MoreDrawer) ---
export const PRIMARY_NAV: ReadonlyArray<NavItem<Exclude<PrimaryNavId, "more">>> =
  REGISTRY.filter(
    (e): e is RegistryEntry & { nav: PrimaryNavMeta } =>
      e.nav?.placement === "primary"
  ).map((e) => ({
    id: e.nav.id,
    label: e.nav.label,
    icon: e.nav.icon,
    href: hrefForSlug(e.slug),
  }));

export const MORE_APPS: ReadonlyArray<MoreAppTile> = REGISTRY.filter(
  (e): e is RegistryEntry & { nav: MoreNavMeta } => e.nav?.placement === "more"
).map((e) => {
  const tile: MoreAppTile = {
    id: e.nav.id,
    label: e.nav.label,
    icon: e.nav.icon,
    href: hrefForSlug(e.slug),
    hue: e.nav.hue,
  };
  if (e.nav.badge !== undefined) tile.badge = e.nav.badge;
  if (e.nav.superAdminOnly !== undefined) tile.superAdminOnly = e.nav.superAdminOnly;
  return tile;
});

export const MORE_NAV_ICON: LucideIcon = LayoutGrid;

/** View id yang jadi "primary" (highlight di BottomNav). */
export const PRIMARY_VIEW_IDS = PRIMARY_NAV.map((n) => n.id) as readonly string[];

/** Semua entri nav yang bisa dilink-kan (PRIMARY + MORE). */
export const ALL_NAV_ITEMS: ReadonlyArray<NavItem> = [...PRIMARY_NAV, ...MORE_APPS];

/** Ambil label dari pathname (misal "/dashboard/cv" -> "CV"). Null kalau tidak match. */
export function labelForPath(pathname: string): string | null {
  const match = ALL_NAV_ITEMS.find((n) => n.href === pathname);
  return match?.label ?? null;
}

/** Ambil NavItem yang match pathname (prefix-based untuk sub-route). */
export function activeNavForPath(pathname: string): NavItem | null {
  const exact = ALL_NAV_ITEMS.find((n) => n.href === pathname);
  if (exact) return exact;
  return (
    ALL_NAV_ITEMS.filter(
      (n) => n.href !== "/" && pathname.startsWith(n.href + "/")
    ).sort((a, b) => b.href.length - a.href.length)[0] ?? null
  );
}
