import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Diagnostic + emergency-fix module for admin role bootstrap.
 *
 * Use when `ADMIN_BOOTSTRAP_EMAILS` was set after the user signed up
 * AND `seedForCurrentUser`'s patch path failed for any reason — these
 * functions let you inspect + force-patch from the Convex CLI:
 *
 *   pnpm exec convex run admin/bootstrap:debugUserByEmail \
 *     '{"email":"someone@example.com"}' \
 *     --env-file backend/convex-self-hosted/convex.env
 *
 *   pnpm exec convex run admin/bootstrap:promoteToAdminByEmail \
 *     '{"email":"someone@example.com"}' \
 *     --env-file backend/convex-self-hosted/convex.env
 *
 * Both are `internal*` — NOT callable from the frontend. Convex CLI
 * with the self-hosted admin key is the only caller.
 */

export const debugUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const target = args.email.trim().toLowerCase();
    const users = await ctx.db.query("users").collect();
    const user = users.find(
      (u) => ((u as { email?: string }).email ?? "").toLowerCase() === target,
    );
    if (!user) {
      return {
        found: false as const,
        envBootstrapEmails: process.env.ADMIN_BOOTSTRAP_EMAILS ?? null,
        envSuperAdminEmail: process.env.SUPER_ADMIN_EMAIL ?? null,
      };
    }
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    return {
      found: true as const,
      userId: user._id,
      userEmail: (user as { email?: string }).email ?? null,
      profileExists: profile !== null,
      profileRole: profile?.role ?? null,
      envBootstrapEmails: process.env.ADMIN_BOOTSTRAP_EMAILS ?? null,
      envSuperAdminEmail: process.env.SUPER_ADMIN_EMAIL ?? null,
    };
  },
});

export const promoteToAdminByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const target = args.email.trim().toLowerCase();
    const users = await ctx.db.query("users").collect();
    const user = users.find(
      (u) => ((u as { email?: string }).email ?? "").toLowerCase() === target,
    );
    if (!user) {
      return { ok: false as const, reason: "user not found" };
    }
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!existing) {
      const profileId = await ctx.db.insert("userProfiles", {
        userId: user._id,
        fullName: "Admin",
        location: "—",
        targetRole: "—",
        experienceLevel: "senior",
        skills: [],
        interests: [],
        role: "admin",
      });
      return { ok: true as const, action: "created", profileId };
    }

    if (existing.role === "admin") {
      return {
        ok: true as const,
        action: "no-op",
        profileId: existing._id,
        currentRole: existing.role,
      };
    }

    await ctx.db.patch(existing._id, { role: "admin" });
    return {
      ok: true as const,
      action: "patched",
      profileId: existing._id,
      previousRole: existing.role ?? null,
    };
  },
});
