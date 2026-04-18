/**
 * Single source of truth untuk seluruh konfigurasi navigasi.
 * Dipakai oleh BottomNav (mobile), DesktopSidebar, MoreDrawer.
 */

import {
  Home,
  FileUser,
  Calendar,
  LayoutGrid,
  Map,
  ListChecks,
  Briefcase,
  LineChart,
  Wallet,
  Bell,
  Settings as SettingsIcon,
  MessageSquare,
  Users,
  Folder,
  Compass,
  HelpCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type PrimaryNavId = "home" | "cv" | "calendar" | "more";
export type MoreAppId =
  | "roadmap"
  | "checklist"
  | "applications"
  | "dashboard"
  | "calculator"
  | "notifications"
  | "settings"
  | "ai-settings"
  | "interview"
  | "networking"
  | "portfolio"
  | "matcher"
  | "help";

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
}

/**
 * Tab utama di BottomNav. Di desktop juga jadi bagian atas sidebar.
 * AI tidak masuk PRIMARY_NAV karena ia adalah FAB (mobile) /
 * entry khusus (desktop).
 */
export const PRIMARY_NAV: ReadonlyArray<NavItem<Exclude<PrimaryNavId, "more">>> = [
  { id: "home", label: "Dashboard", icon: Home, href: "/dashboard" },
  { id: "cv", label: "CV", icon: FileUser, href: "/dashboard/cv" },
  { id: "calendar", label: "Kalender", icon: Calendar, href: "/dashboard/calendar" },
];

/**
 * Semua fitur tambahan. Mobile: muncul di drawer "Lainnya".
 * Desktop: bagian "Alat Lainnya" di sidebar.
 */
export const MORE_APPS: ReadonlyArray<MoreAppTile> = [
  { id: "applications", label: "Lamaran", icon: Briefcase, href: "/dashboard/applications", hue: "from-violet-400 to-violet-600" },
  { id: "roadmap", label: "Roadmap Karir", icon: Map, href: "/dashboard/roadmap", hue: "from-sky-400 to-sky-600" },
  { id: "checklist", label: "Ceklis Dokumen", icon: ListChecks, href: "/dashboard/checklist", hue: "from-emerald-400 to-emerald-600" },
  { id: "dashboard", label: "Ringkasan", icon: LineChart, href: "/dashboard", hue: "from-indigo-400 to-indigo-600" },
  { id: "calculator", label: "Kalkulator Gaji", icon: Wallet, href: "/dashboard/calculator", hue: "from-amber-400 to-amber-600" },
  { id: "interview", label: "Persiapan Wawancara", icon: MessageSquare, href: "/dashboard/interview", hue: "from-pink-400 to-pink-600" },
  { id: "matcher", label: "Pencocok Lowongan", icon: Compass, href: "/dashboard/matcher", hue: "from-cyan-400 to-cyan-600", badge: "AI" },
  { id: "networking", label: "Jaringan", icon: Users, href: "/dashboard/networking", hue: "from-rose-400 to-rose-600" },
  { id: "portfolio", label: "Portofolio", icon: Folder, href: "/dashboard/portfolio", hue: "from-orange-400 to-orange-600" },
  { id: "notifications", label: "Notifikasi", icon: Bell, href: "/dashboard/notifications", hue: "from-yellow-400 to-yellow-600" },
  { id: "settings", label: "Profil & Tampilan", icon: SettingsIcon, href: "/dashboard/settings", hue: "from-slate-500 to-slate-700" },
  { id: "ai-settings", label: "Setelan AI", icon: Sparkles, href: "/dashboard/ai-settings", hue: "from-fuchsia-400 to-fuchsia-600", badge: "AI" },
  { id: "help", label: "Pusat Bantuan", icon: HelpCircle, href: "/dashboard/help", hue: "from-teal-400 to-teal-600" },
];

export const MORE_NAV_ICON: LucideIcon = LayoutGrid;

/**
 * View yang menjadi "primary" (highlight di BottomNav).
 * Selain ini, tab "more" yang diaktifkan.
 */
export const PRIMARY_VIEW_IDS = PRIMARY_NAV.map((n) => n.id) as readonly string[];

/** Semua entri nav yang bisa dilink-kan (PRIMARY + MORE). */
export const ALL_NAV_ITEMS: ReadonlyArray<NavItem> = [
  ...PRIMARY_NAV,
  ...MORE_APPS,
];

/** Ambil label dari pathname (misal "/cv" -> "CV"). Null kalau tidak match. */
export function labelForPath(pathname: string): string | null {
  const match = ALL_NAV_ITEMS.find((n) => n.href === pathname);
  return match?.label ?? null;
}

/** Ambil NavItem yang match pathname (prefix-based untuk sub-route). */
export function activeNavForPath(pathname: string): NavItem | null {
  // Exact match dulu
  const exact = ALL_NAV_ITEMS.find((n) => n.href === pathname);
  if (exact) return exact;
  // Fallback: prefix match (mis. /applications/123 → /applications)
  return (
    ALL_NAV_ITEMS.filter((n) => n.href !== "/" && pathname.startsWith(n.href + "/"))
      .sort((a, b) => b.href.length - a.href.length)[0] ?? null
  );
}
