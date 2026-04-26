"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { MORE_APPS, type MoreAppTile } from "@/shared/components/layout/navConfig";

/**
 * Returns the `MORE_APPS` tiles filtered by the caller's super-admin
 * status. Hides `superAdminOnly: true` tiles unless the server's
 * `analytics.amISuperAdmin` probe returns true for this session.
 *
 * The server is still the source of truth — hiding the nav entry is a
 * UX nicety, not a security boundary. Every admin-panel query throws
 * `"Tidak berwenang"` for non-super-admins regardless of whether the
 * tile was visible.
 */
export function useVisibleMoreApps(): ReadonlyArray<MoreAppTile> {
  const amISuperAdmin = useQuery(api.admin.queries.amISuperAdmin);

  return useMemo(() => {
    if (amISuperAdmin) return MORE_APPS;
    return MORE_APPS.filter((m) => !m.superAdminOnly);
  }, [amISuperAdmin]);
}
