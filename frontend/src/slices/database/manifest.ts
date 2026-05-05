import { Database } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Database slice — meta UI ("user data hub") that surfaces every
 * resource the user owns across slices, with bulk delete + Quick Fill
 * JSON import. CRUD actions are scoped to OTHER slices' tables (CV,
 * portfolio, applications, …) and are already covered by their
 * manifests; this slice intentionally exposes no skills of its own.
 *
 * Registered for nav + route only.
 */
export const databaseManifest: SliceManifest = {
  id: "database",
  label: "Database",
  description: "User data hub + bulk delete + Quick Fill",
  icon: Database,

  route: {
    slug: "database",
    component: () =>
      import("./components/DatabaseView").then((m) => ({ default: m.DatabaseView })),
  },

  nav: {
    placement: "more",
    order: 85,
    href: "/dashboard/database",
    hue: "from-indigo-400 to-indigo-600",
  },
};
