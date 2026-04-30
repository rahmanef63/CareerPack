/** Admin self-demotion / self-deletion guard + role mutation helper. */

import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export type AdminRole = "admin" | "moderator" | "user";

/**
 * Throws if `callerId` is the only admin and the caller is in `affected`.
 * Used to block role demotion + deletion that would leave zero admins.
 */
export async function ensureNotLastAdmin(
  ctx: MutationCtx,
  callerId: Id<"users">,
  affected: Iterable<Id<"users">>,
  message: string,
) {
  const set = new Set(affected);
  if (!set.has(callerId)) return;

  const adminProfiles = await ctx.db
    .query("userProfiles")
    .withIndex("by_role", (q) => q.eq("role", "admin"))
    .collect();
  const otherAdmins = adminProfiles.filter((p) => p.userId !== callerId);
  if (otherAdmins.length === 0) throw new Error(message);
}

/**
 * Patch the target user's role on their profile (creating a stub profile
 * if absent), then write a roleAuditLogs row when the role actually changed.
 */
export async function applyRoleChange(
  ctx: MutationCtx,
  callerId: Id<"users">,
  userId: Id<"users">,
  role: AdminRole,
) {
  const targetUser = await ctx.db.get(userId);
  if (!targetUser) throw new Error("Pengguna tidak ditemukan");

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  const previousRole = (profile?.role ?? "user") as AdminRole;

  if (profile) {
    await ctx.db.patch(profile._id, { role });
  } else {
    const targetName =
      (targetUser as { name?: string; email?: string }).name ??
      (targetUser as { email?: string }).email ??
      "Pengguna";
    await ctx.db.insert("userProfiles", {
      userId,
      fullName: targetName,
      location: "",
      targetRole: "",
      experienceLevel: "",
      role,
    });
  }

  if (previousRole !== role) {
    await ctx.db.insert("roleAuditLogs", {
      actorUserId: callerId,
      targetUserId: userId,
      previousRole,
      newRole: role,
      timestamp: Date.now(),
    });
  }
}
