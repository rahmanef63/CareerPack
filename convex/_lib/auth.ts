import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

export async function requireUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Tidak terautentikasi");
  return userId;
}

export async function optionalUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users"> | null> {
  return await getAuthUserId(ctx);
}

type OwnableTable = {
  [K in keyof import("../_generated/dataModel").DataModel]: import("../_generated/dataModel").DataModel[K]["document"] extends { userId: Id<"users"> }
    ? K
    : never;
}[keyof import("../_generated/dataModel").DataModel];

export async function requireOwnedDoc<T extends OwnableTable>(
  ctx: QueryCtx | MutationCtx,
  docId: Id<T>,
  notFoundLabel = "Data",
): Promise<Doc<T>> {
  const userId = await requireUser(ctx);
  const doc = (await ctx.db.get(docId)) as Doc<T> | null;
  if (!doc) throw new Error(`${notFoundLabel} tidak ditemukan`);
  const ownerId = (doc as unknown as { userId: Id<"users"> }).userId;
  if (ownerId !== userId) throw new Error(`${notFoundLabel} tidak ditemukan`);
  return doc;
}

export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await requireUser(ctx);
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  if (profile?.role !== "admin") throw new Error("Bukan admin");
  return userId;
}
