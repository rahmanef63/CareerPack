import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import {
  HelpView,
  MatcherView,
  NetworkingView,
  NotificationsView,
  PortfolioView,
} from "@/shared/components/DashboardPlaceholders";

/**
 * Registry SSOT untuk catch-all `/dashboard/[[...slug]]`.
 * Setiap slice mendaftarkan satu "page view" di sini. Slug `""` =
 * dashboard home.
 *
 * Semua view di-lazy via `next/dynamic` supaya chunk per slice terpisah
 * (lebih kecil First Load JS; code-splitting otomatis).
 */
type View = ComponentType;

const loadingFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center" role="status">
    <div className="animate-spin w-8 h-8 border-4 border-career-600 border-t-transparent rounded-full" />
    <span className="sr-only">Memuat…</span>
  </div>
);

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
  matcher: MatcherView,
  networking: NetworkingView,
  portfolio: PortfolioView,
  notifications: NotificationsView,
  help: HelpView,
};

export type DashboardSlug = keyof typeof DASHBOARD_VIEWS;

export function resolveDashboardView(slug: readonly string[] | undefined): View | null {
  const key = slug?.[0] ?? "";
  return DASHBOARD_VIEWS[key] ?? null;
}
