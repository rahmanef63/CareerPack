import { v } from "convex/values";
import { mutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { requireOwnedDoc } from "./auth";

/**
 * Factory for owned-table bulk-delete mutations. Each generated
 * mutation accepts `{ ids: v.array(v.id(table)) }`, runs
 * `requireOwnedDoc` per id (which checks ownership + throws an
 * Indonesian "X tidak ditemukan" on mismatch), then deletes. Returns
 * `{ deleted }` so the caller can show `${n} ${label} dihapus.`.
 *
 * One source of truth replaces five hand-rolled copies in
 * cv/portfolio/goals/applications/contacts mutation files.
 *
 * The generic `T` carries the literal table name through `v.id<T>(...)`
 * so `requireOwnedDoc(ctx, id, label)` narrows to the right `Doc<T>`
 * without an `as` cast at the call site.
 */
type OwnedTableName =
  | "cvs"
  | "portfolioItems"
  | "careerGoals"
  | "jobApplications"
  | "contacts";

/** Ceiling on ids accepted in one bulk-delete call. */
const MAX_BULK_IDS = 200;

export function makeBulkDelete<T extends OwnedTableName>(
  table: T,
  notFoundLabel: string,
) {
  return mutation({
    args: { ids: v.array(v.id(table)) },
    handler: async (ctx, args) => {
      // Client-supplied array — cap it so one call can't push the
      // mutation past its transaction budget (and fail after deleting
      // an arbitrary prefix).
      if (args.ids.length > MAX_BULK_IDS) {
        throw new Error(`Maksimal ${MAX_BULK_IDS} item per penghapusan`);
      }
      let deleted = 0;
      for (const id of args.ids as Id<T>[]) {
        await requireOwnedDoc(ctx, id, notFoundLabel);
        await ctx.db.delete(id);
        deleted++;
      }
      return { deleted };
    },
  });
}
