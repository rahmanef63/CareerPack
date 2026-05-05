import { Home } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Dashboard Home slice — `/dashboard` root. Renders profile-
 * completeness, weekly trend chart, onboarding wizard. The
 * `dashboard.get-overview` skill returns a compact JSON summary of
 * the user's current state so the agent can answer "ringkas progress
 * saya" without fetching every slice individually.
 */
export const dashboardHomeManifest: SliceManifest = {
  id: "dashboard-home",
  label: "Dashboard",
  description: "Halaman utama dashboard",
  icon: Home,

  route: {
    slug: "",
    component: () =>
      import("./components/DashboardHome").then((m) => ({ default: m.DashboardHome })),
  },

  nav: {
    placement: "primary",
    order: 10,
    href: "/dashboard",
  },

  skills: [
    {
      id: "dashboard.get-overview",
      label: "Ringkasan dashboard saya",
      description:
        "Ambil ringkasan profil user — completeness %, daftar field yang missing, role, target role. Pakai untuk 'gimana progres profil saya', 'apa yang harus saya lengkapi'.",
      kind: "query",
    },
  ],
};
