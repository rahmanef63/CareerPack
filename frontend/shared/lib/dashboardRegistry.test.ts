import { describe, it, expect, vi } from "vitest";

// Stub the loading-skeleton so importing the registry doesn't pull a JSX
// .tsx through the test transformer (the registry only references it inside
// next/dynamic's loading fallback, never rendered here).
vi.mock("@/shared/components/feedback/PageSkeleton", () => ({
  PageSkeleton: () => null,
}));

import {
  DASHBOARD_VIEWS,
  PRIMARY_NAV,
  MORE_APPS,
  ALL_NAV_ITEMS,
  PRIMARY_VIEW_IDS,
  resolveDashboardView,
  activeNavForPath,
  labelForPath,
} from "./dashboardRegistry";

/**
 * Equivalence pin: the derived routing + nav structures must exactly match
 * the hand-written maps that existed before the registry consolidation, so a
 * future registry edit can't silently change routing/nav. Icons are component
 * refs (not compared by value) — every other field is asserted exactly.
 */

const EXPECTED_SLUGS = [
  "",
  "cv",
  "calendar",
  "applications",
  "interview",
  "roadmap",
  "checklist",
  "calculator",
  "matcher",
  "networking",
  "portfolio",
  "library",
  "personal-branding",
  "database",
  "notifications",
  "settings",
  "help",
  "admin-panel",
  "ai-settings",
];

const EXPECTED_PRIMARY = [
  { id: "home", label: "Dashboard", href: "/dashboard" },
  { id: "cv", label: "CV", href: "/dashboard/cv" },
  { id: "calendar", label: "Kalender", href: "/dashboard/calendar" },
];

const EXPECTED_MORE = [
  { id: "applications", label: "Lamaran", href: "/dashboard/applications", hue: "from-violet-400 to-violet-600", badge: undefined, superAdminOnly: undefined },
  { id: "interview", label: "Simulasi Wawancara", href: "/dashboard/interview", hue: "from-pink-400 to-pink-600", badge: "AI", superAdminOnly: undefined },
  { id: "roadmap", label: "Roadmap Skill", href: "/dashboard/roadmap", hue: "from-sky-400 to-sky-600", badge: undefined, superAdminOnly: undefined },
  { id: "checklist", label: "Ceklis Dokumen", href: "/dashboard/checklist", hue: "from-emerald-400 to-emerald-600", badge: undefined, superAdminOnly: undefined },
  { id: "calculator", label: "Kalkulator Keuangan", href: "/dashboard/calculator", hue: "from-amber-400 to-amber-600", badge: undefined, superAdminOnly: undefined },
  { id: "matcher", label: "Pencocok Lowongan", href: "/dashboard/matcher", hue: "from-cyan-400 to-cyan-600", badge: "AI", superAdminOnly: undefined },
  { id: "networking", label: "Jaringan", href: "/dashboard/networking", hue: "from-rose-400 to-rose-600", badge: undefined, superAdminOnly: undefined },
  { id: "portfolio", label: "Portofolio", href: "/dashboard/portfolio", hue: "from-orange-400 to-orange-600", badge: undefined, superAdminOnly: undefined },
  { id: "library", label: "Content Library", href: "/dashboard/library", hue: "from-lime-400 to-lime-600", badge: undefined, superAdminOnly: undefined },
  { id: "personal-branding", label: "Personal Branding", href: "/dashboard/personal-branding", hue: "from-fuchsia-400 to-fuchsia-600", badge: "AI", superAdminOnly: undefined },
  { id: "database", label: "Database", href: "/dashboard/database", hue: "from-indigo-400 to-indigo-600", badge: undefined, superAdminOnly: undefined },
  { id: "notifications", label: "Notifikasi", href: "/dashboard/notifications", hue: "from-yellow-400 to-yellow-600", badge: undefined, superAdminOnly: undefined },
  { id: "settings", label: "Pengaturan", href: "/dashboard/settings", hue: "from-slate-500 to-slate-700", badge: undefined, superAdminOnly: undefined },
  { id: "help", label: "Pusat Bantuan", href: "/dashboard/help", hue: "from-teal-400 to-teal-600", badge: undefined, superAdminOnly: undefined },
  { id: "admin-panel", label: "Admin Panel", href: "/dashboard/admin-panel", hue: "from-red-500 to-rose-700", badge: undefined, superAdminOnly: true },
];

describe("dashboardRegistry — derived routing + nav equivalence", () => {
  it("DASHBOARD_VIEWS has exactly the expected slug set", () => {
    expect(new Set(Object.keys(DASHBOARD_VIEWS))).toEqual(new Set(EXPECTED_SLUGS));
  });

  it("every view is defined + ai-settings aliases settings", () => {
    for (const slug of EXPECTED_SLUGS) {
      expect(DASHBOARD_VIEWS[slug]).toBeTruthy();
    }
    expect(DASHBOARD_VIEWS["ai-settings"]).toBe(DASHBOARD_VIEWS["settings"]);
  });

  it("resolveDashboardView: home for empty, first segment, null for unknown", () => {
    expect(resolveDashboardView(undefined)).toBe(DASHBOARD_VIEWS[""]);
    expect(resolveDashboardView([])).toBe(DASHBOARD_VIEWS[""]);
    expect(resolveDashboardView(["cv"])).toBe(DASHBOARD_VIEWS["cv"]);
    expect(resolveDashboardView(["applications", "123"])).toBe(DASHBOARD_VIEWS["applications"]);
    expect(resolveDashboardView(["does-not-exist"])).toBeNull();
  });

  it("PRIMARY_NAV matches expected (order + id/label/href), icons present", () => {
    expect(PRIMARY_NAV.map((n) => ({ id: n.id, label: n.label, href: n.href }))).toEqual(EXPECTED_PRIMARY);
    expect(PRIMARY_NAV.every((n) => Boolean(n.icon))).toBe(true);
    expect(PRIMARY_VIEW_IDS).toEqual(["home", "cv", "calendar"]);
  });

  it("MORE_APPS matches expected (order + all fields), icons present", () => {
    expect(
      MORE_APPS.map((t) => ({
        id: t.id,
        label: t.label,
        href: t.href,
        hue: t.hue,
        badge: t.badge,
        superAdminOnly: t.superAdminOnly,
      }))
    ).toEqual(EXPECTED_MORE);
    expect(MORE_APPS.every((t) => Boolean(t.icon))).toBe(true);
  });

  it("admin-panel is the only super-admin-only tile", () => {
    expect(MORE_APPS.filter((t) => t.superAdminOnly).map((t) => t.id)).toEqual(["admin-panel"]);
  });

  it("ALL_NAV_ITEMS = PRIMARY_NAV + MORE_APPS", () => {
    expect(ALL_NAV_ITEMS.length).toBe(PRIMARY_NAV.length + MORE_APPS.length);
    expect(ALL_NAV_ITEMS[0].id).toBe("home");
  });

  it("activeNavForPath: exact + deepest-prefix + null", () => {
    expect(activeNavForPath("/dashboard")?.id).toBe("home");
    expect(activeNavForPath("/dashboard/cv")?.id).toBe("cv");
    expect(activeNavForPath("/dashboard/applications/123")?.id).toBe("applications");
    expect(activeNavForPath("/not-a-route")).toBeNull();
  });

  it("labelForPath resolves a known href", () => {
    expect(labelForPath("/dashboard/cv")).toBe("CV");
    expect(labelForPath("/nope")).toBeNull();
  });
});
