import { ShieldAlert } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Admin Panel slice — super-admin only. Registered with no skills so
 * the AI skill catalog never offers admin skills to the agent: admin
 * actions (delete user, reset password, change role) are deliberately
 * out of agent scope. They live in the panel UI where the admin can
 * confirm with full visual context; server-side `requireAdmin` is the
 * authoritative check inside each handler.
 *
 * Routing + nav gating (the super-admin-only visibility) live in
 * `navConfig.ts` (`superAdminOnly` on the More tile) and
 * `dashboardRoutes.tsx`, not here.
 */
export const adminPanelManifest: SliceManifest = {
  id: "admin-panel",
  label: "Admin Panel",
  description: "Manajemen user + audit log + AI skills/tools",
  icon: ShieldAlert,
};
