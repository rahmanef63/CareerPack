import { ShieldAlert } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Admin Panel slice — super-admin only. Registered with
 * `superAdminOnly: true` so the AI skill catalog never offers admin
 * skills to the agent for non-admin users (UI-side gate; server-side
 * `requireAdmin` is the authoritative check inside each handler).
 *
 * No skills exposed: admin actions (delete user, reset password,
 * change role) are deliberately out of agent scope. They live in the
 * panel UI where the admin can confirm with full visual context.
 */
export const adminPanelManifest: SliceManifest = {
  id: "admin-panel",
  label: "Admin Panel",
  description: "Manajemen user + audit log + AI skills/tools",
  icon: ShieldAlert,

  route: {
    slug: "admin-panel",
    component: () =>
      import("./components/AdminPanel").then((m) => ({ default: m.AdminPanel })),
  },

  nav: {
    placement: "more",
    order: 999,
    href: "/dashboard/admin-panel",
    hue: "from-red-500 to-rose-700",
    superAdminOnly: true,
  },
};
