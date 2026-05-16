"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { MORE_APPS, type MoreAppTile } from "@/shared/components/layout/navConfig";

/**
 * Returns the `MORE_APPS` tiles filtered by the caller's admin status.
 * Hides `superAdminOnly: true` tiles unless the server's `amIAdmin`
 * probe returns true (i.e. caller is super-admin OR has
 * `userProfiles.role === "admin"`).
 *
 * The server is still the source of truth — hiding the nav entry is a
 * UX nicety, not a security boundary. Sensitive analytics queries
 * still gate on `requireSuperAdmin` independently; user-management
 * queries gate on `requireAdmin` (role-based).
 */
export function useVisibleMoreApps(): ReadonlyArray<MoreAppTile> {
  const amIAdmin = useQuery(api.admin.queries.amIAdmin);

  return useMemo(() => {
    if (amIAdmin) return MORE_APPS;
    return MORE_APPS.filter((m) => !m.superAdminOnly);
  }, [amIAdmin]);
}
