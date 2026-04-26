import { mutation, type MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../_shared/auth";
import type { Id } from "../_generated/dataModel";

/**
 * Cascade-delete every record owned by `userId`, then the user record
 * itself + auth artefacts. See docs/auth.md for the full delete contract.
 *
 * `roleAuditLogs` and `feedback` are intentionally NOT cascaded — both
 * survive user deletion so historical context stays reviewable.
 */
export async function cascadeDeleteUser(ctx: MutationCtx, userId: Id<"users">) {
  const owned = [
    "userProfiles",
    "jobApplications",
    "cvs",
    "skillRoadmaps",
    "documentChecklists",
    "mockInterviews",
    "financialPlans",
    "careerGoals",
    "notifications",
    "chatConversations",
    "calendarEvents",
    "portfolioItems",
    "contacts",
    "budgetVariables",
    "aiSettings",
  ] as const;

  for (const table of owned) {
    const rows = await ctx.db
      .query(table)
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const r of rows) await ctx.db.delete(r._id);
  }

  const userFiles = await ctx.db
    .query("files")
    .withIndex("by_user", (q) => q.eq("uploadedBy", userId))
    .collect();
  for (const f of userFiles) {
    try {
      await ctx.storage.delete(f.storageId);
    } catch {
      /* blob may already be gone */
    }
    await ctx.db.delete(f._id);
  }

  const authSessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .collect();
  for (const s of authSessions) {
    const refreshTokens = await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", s._id))
      .collect();
    for (const r of refreshTokens) await ctx.db.delete(r._id);
    await ctx.db.delete(s._id);
  }

  const authAccounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
    .collect();
  for (const a of authAccounts) {
    const codes = await ctx.db
      .query("authVerificationCodes")
      .withIndex("accountId", (q) => q.eq("accountId", a._id))
      .collect();
    for (const c of codes) await ctx.db.delete(c._id);
    await ctx.db.delete(a._id);
  }

  const resets = await ctx.db
    .query("passwordResetTokens")
    .filter((q) => q.eq(q.field("userId"), userId))
    .collect();
  for (const t of resets) await ctx.db.delete(t._id);

  await ctx.db.delete(userId);
}

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("moderator"),
      v.literal("user"),
    ),
  },
  handler: async (ctx, args) => {
    const callerId = await requireAdmin(ctx);

    if (callerId === args.userId && args.role !== "admin") {
      const allProfiles = await ctx.db.query("userProfiles").collect();
      const otherAdmins = allProfiles.filter(
        (p) => p.role === "admin" && p.userId !== callerId,
      );
      if (otherAdmins.length === 0) {
        throw new Error(
          "Tidak bisa menurunkan peran Anda sendiri: Anda satu-satunya admin. Tetapkan admin lain dulu.",
        );
      }
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("Pengguna tidak ditemukan");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const previousRole = (profile?.role ?? "user") as "admin" | "moderator" | "user";

    if (profile) {
      await ctx.db.patch(profile._id, { role: args.role });
    } else {
      const targetName =
        (targetUser as { name?: string; email?: string }).name ??
        (targetUser as { email?: string }).email ??
        "Pengguna";

      await ctx.db.insert("userProfiles", {
        userId: args.userId,
        fullName: targetName,
        location: "",
        targetRole: "",
        experienceLevel: "",
        role: args.role,
      });
    }

    if (previousRole !== args.role) {
      await ctx.db.insert("roleAuditLogs", {
        actorUserId: callerId,
        targetUserId: args.userId,
        previousRole,
        newRole: args.role,
        timestamp: Date.now(),
      });
    }
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const callerId = await requireAdmin(ctx);
    if (callerId === args.userId) {
      const allProfiles = await ctx.db.query("userProfiles").collect();
      const otherAdmins = allProfiles.filter(
        (p) => p.role === "admin" && p.userId !== callerId,
      );
      if (otherAdmins.length === 0) {
        throw new Error(
          "Tidak bisa menghapus akun Anda sendiri: Anda satu-satunya admin.",
        );
      }
    }
    await cascadeDeleteUser(ctx, args.userId);
    return { ok: true as const };
  },
});

export const bulkDeleteUsers = mutation({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const callerId = await requireAdmin(ctx);
    const ids = args.userIds.slice(0, 100);
    if (ids.includes(callerId)) {
      const allProfiles = await ctx.db.query("userProfiles").collect();
      const otherAdmins = allProfiles.filter(
        (p) => p.role === "admin" && p.userId !== callerId,
      );
      if (otherAdmins.length === 0) {
        throw new Error(
          "Pilihan termasuk akun Anda dan Anda satu-satunya admin. Hapus diri sendiri tidak diizinkan.",
        );
      }
    }
    let deleted = 0;
    for (const id of ids) {
      await cascadeDeleteUser(ctx, id);
      deleted++;
    }
    return { ok: true as const, deleted };
  },
});
