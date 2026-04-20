import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { HelpView } from "@/shared/components/placeholder/DashboardPlaceholders";
import { LoadingScreen } from "@/shared/components/feedback/LoadingScreen";

/**
 * Registry SSOT untuk catch-all `/dashboard/[[...slug]]`.
 * Setiap slice mendaftarkan satu "page view" di sini. Slug `""` =
 * dashboard home.
 *
 * Semua view di-lazy via `next/dynamic` supaya chunk per slice terpisah
 * (lebih kecil First Load JS; code-splitting otomatis).
 */
type View = ComponentType;

const loadingFallback = () => <LoadingScreen fullScreen={false} />;

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
  () => import("@/slices/settings").then((m) => m.TweaksPanel),
  { loading: loadingFallback }
);
const AI_SETTINGS: View = dynamic(
  () => import("@/slices/ai-settings").then((m) => m.AISettingsPanel),
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

/**
 * Map slug → View. Key `""` = `/dashboard` root.
 * Slug harus match `href` di `navConfig.ts` tanpa `/dashboard/` prefix.
 */
export const DASHBOARD_VIEWS: Record<string, View> = {
  "": HOME,
  cv: CV,
  calendar: CALENDAR,
  applications: APPLICATIONS,
  roadmap: ROADMAP,
  checklist: CHECKLIST,
  interview: INTERVIEW,
  calculator: CALCULATOR,
  settings: SETTINGS,
  "ai-settings": AI_SETTINGS,
  matcher: MATCHER,
  networking: NETWORKING,
  portfolio: PORTFOLIO,
  notifications: NOTIFICATIONS,
  help: HelpView,
};

export type DashboardSlug = keyof typeof DASHBOARD_VIEWS;

export function resolveDashboardView(slug: readonly string[] | undefined): View | null {
  const key = slug?.[0] ?? "";
  return DASHBOARD_VIEWS[key] ?? null;
}
