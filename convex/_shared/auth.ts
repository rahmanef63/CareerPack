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

/**
 * Super-admin email — single-person gate for the Admin Panel. Stricter
 * than role-based `requireAdmin` because this account sees aggregate
 * analytics across ALL users. Moderators and other role=admin accounts
 * are NOT allowed in.
 *
 * Configure via the `SUPER_ADMIN_EMAIL` Convex env var (`pnpm exec
 * convex env set SUPER_ADMIN_EMAIL you@example.com`). Empty / unset =
 * no super-admin gate active (every super-admin-only endpoint denies).
 *
 * Super-admin auto-passes `requireAdmin` even when their userProfiles.role
 * is still default "user" — so the owner of the deployment can use
 * admin mutations without first manually upgrading their own role.
 */
export const SUPER_ADMIN_EMAIL: string =
  process.env.SUPER_ADMIN_EMAIL ?? "";

/** True only when SUPER_ADMIN_EMAIL is configured for this deployment. */
function superAdminConfigured(): boolean {
  return SUPER_ADMIN_EMAIL.length > 0;
}

export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await requireUser(ctx);
  // Super-admin email bypasses the role check — they own the
  // deployment, no need to self-promote via updateUserRole first.
  if (superAdminConfigured()) {
    const user = await ctx.db.get(userId);
    if (user?.email === SUPER_ADMIN_EMAIL) return userId;
  }
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  if (profile?.role !== "admin") throw new Error("Bukan admin");
  return userId;
}

/**
 * Throws unless the caller is the SUPER_ADMIN_EMAIL account. Returns
 * the user id on success for convenience. Error message is generic
 * ("Tidak berwenang") so a non-super-admin can't deduce the gate.
 */
export async function requireSuperAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await requireUser(ctx);
  if (!superAdminConfigured()) throw new Error("Tidak berwenang");
  const user = await ctx.db.get(userId);
  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    throw new Error("Tidak berwenang");
  }
  return userId;
}

/** Non-throwing probe — returns true only for the super-admin account. */
export async function isSuperAdminCaller(
  ctx: QueryCtx | MutationCtx,
): Promise<boolean> {
  if (!superAdminConfigured()) return false;
  const userId = await getAuthUserId(ctx);
  if (!userId) return false;
  const user = await ctx.db.get(userId);
  return user?.email === SUPER_ADMIN_EMAIL;
}
