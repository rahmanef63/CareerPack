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
  { id: "home", label: "Beranda", icon: Home },
  { id: "cv", label: "CV", icon: FileUser },
  { id: "calendar", label: "Kalender", icon: Calendar },
];

/**
 * Semua fitur tambahan. Mobile: muncul di drawer "Lainnya".
 * Desktop: bagian "Alat Lainnya" di sidebar.
 */
export const MORE_APPS: ReadonlyArray<MoreAppTile> = [
  { id: "roadmap", label: "Roadmap Karir", icon: Map, hue: "from-sky-400 to-sky-600" },
  { id: "checklist", label: "Ceklis Dokumen", icon: ListChecks, hue: "from-emerald-400 to-emerald-600" },
  { id: "applications", label: "Lamaran", icon: Briefcase, hue: "from-violet-400 to-violet-600" },
  { id: "dashboard", label: "Dashboard", icon: LineChart, hue: "from-indigo-400 to-indigo-600" },
  { id: "calculator", label: "Kalkulator Gaji", icon: Wallet, hue: "from-amber-400 to-amber-600" },
  { id: "interview", label: "Persiapan Wawancara", icon: MessageSquare, hue: "from-pink-400 to-pink-600" },
  { id: "matcher", label: "Pencocok Lowongan", icon: Compass, hue: "from-cyan-400 to-cyan-600", badge: "AI" },
  { id: "networking", label: "Jaringan", icon: Users, hue: "from-rose-400 to-rose-600" },
  { id: "portfolio", label: "Portofolio", icon: Folder, hue: "from-orange-400 to-orange-600" },
  { id: "notifications", label: "Notifikasi", icon: Bell, hue: "from-yellow-400 to-yellow-600" },
  { id: "settings", label: "Profil & Tampilan", icon: SettingsIcon, hue: "from-slate-500 to-slate-700" },
  { id: "help", label: "Pusat Bantuan", icon: HelpCircle, hue: "from-teal-400 to-teal-600" },
];

export const MORE_NAV_ICON: LucideIcon = LayoutGrid;

/**
 * View yang menjadi "primary" (highlight di BottomNav).
 * Selain ini, tab "more" yang diaktifkan.
 */
export const PRIMARY_VIEW_IDS = PRIMARY_NAV.map((n) => n.id) as readonly string[];
