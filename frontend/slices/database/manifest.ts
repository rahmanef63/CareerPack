import { Database } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Database slice — meta UI ("user data hub") that surfaces every
 * resource the user owns across slices, with bulk delete + Quick Fill
 * JSON import. CRUD actions are scoped to OTHER slices' tables (CV,
 * portfolio, applications, …) and are already covered by their
 * manifests; this slice intentionally exposes no skills of its own.
 *
 * Registered for AI-catalog completeness only — its route + nav live
 * in `dashboardRoutes.tsx` and `navConfig.ts`.
 */
export const databaseManifest: SliceManifest = {
  id: "database",
  label: "Data Saya",
  description: "Semua data user dalam satu tabel — hapus massal, ekspor & impor JSON",
  icon: Database,
};
