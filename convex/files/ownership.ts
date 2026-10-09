import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Verify the caller owns the `files` row backing each `storageId`.
 *
 * Cover/avatar/media references are stored as raw storageId strings and the
 * read paths later mint a signed URL via `ctx.storage.getUrl(storageId)`.
 * Without this check a user who learns another tenant's (server-minted)
 * storageId could pin it into their own item and have the server hand them
 * a URL for someone else's blob — a storage IDOR. Every upload goes through
 * `files.saveFile`, so a legitimate reference always has an owned row.
 *
 * Throws the generic "Berkas tidak ditemukan" (anti-enumeration) when a
 * storageId has no files row or belongs to another tenant. `undefined` /
 * blank ids are skipped.
 */
export async function assertOwnedStorages(
  ctx: MutationCtx,
  storageIds: ReadonlyArray<string | undefined>,
  userId: Id<"users">,
): Promise<void> {
  const tenantId = userId.toString();
  const seen = new Set<string>();
  for (const sid of storageIds) {
    if (!sid || seen.has(sid)) continue;
    seen.add(sid);
    const rows = await ctx.db
      .query("files")
      .withIndex("by_storage", (q) => q.eq("storageId", sid))
      .take(2);
    if (rows.length !== 1 || rows[0].tenantId !== tenantId) {
      throw new Error("Berkas tidak ditemukan");
    }
  }
}

export async function ownedStorageUrl(ctx: QueryCtx, storageId: string, userId: Id<"users">): Promise<string | null> {
  const owners = await ctx.db.query("files").withIndex("by_storage", q => q.eq("storageId", storageId)).take(2);
  if (owners.length !== 1 || owners[0].uploadedBy !== userId || owners[0].tenantId !== userId.toString()) return null;
  return ctx.storage.getUrl(storageId);
}
