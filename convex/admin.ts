import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireAdmin } from "./_lib/auth";
import type { Doc } from "./_generated/dataModel";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function clampPageSize(limit: number | undefined): number {
  if (!limit || limit <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(limit, MAX_PAGE_SIZE);
}

export const getGlobalStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [users, cvs, applications, rateEvents] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("cvs").collect(),
      ctx.db.query("jobApplications").collect(),
      ctx.db.query("rateLimitEvents").collect(),
    ]);

    const cutoff = Date.now() - THIRTY_DAYS_MS;
    const recentEvents = rateEvents.filter((e) => e.timestamp >= cutoff);
    const activeUserIds = new Set(recentEvents.map((e) => e.userId));
    const aiEvents = rateEvents.filter((e) => e.key.startsWith("ai:"));
    const aiEventsLastMonth = aiEvents.filter((e) => e.timestamp >= cutoff);

    return {
      totalUsers: users.length,
      activeUsers: activeUserIds.size,
      totalCVs: cvs.length,
      totalApplications: applications.length,
      aiUsage: {
        totalRequests: aiEvents.length,
        totalTokens: 0,
        lastMonth: aiEventsLastMonth.length,
      },
    };
  },
});

export const listAllUsers = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const result = await ctx.db.query("users").paginate(args.paginationOpts);

    const profiles = await Promise.all(
      result.page.map((u) =>
        ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", u._id))
          .first(),
      ),
    );

    const page = result.page.map((u, i) => {
      const profile = profiles[i];
      return {
        _id: u._id,
        email: u.email ?? null,
        name: u.name ?? null,
        role: (profile?.role ?? "user") as "admin" | "moderator" | "user",
        createdAt: u._creationTime,
      };
    });

    return {
      page,
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});

export const viewErrorLogs = query({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    limit: v.optional(v.number()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const numItems = clampPageSize(args.limit);

    const q = ctx.db.query("errorLogs").withIndex("by_time").order("desc");
    const result = await q.paginate({
      cursor: args.cursor ?? null,
      numItems,
    });

    const filtered = args.source
      ? result.page.filter((l: Doc<"errorLogs">) => l.source === args.source)
      : result.page;

    return {
      page: filtered,
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});

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

    // Prevent last-admin lockout: an admin cannot demote themselves if
    // they are the only admin in the system. Demoting to non-admin would
    // leave no one able to restore admin access via the UI (only via
    // ADMIN_BOOTSTRAP_EMAILS env + re-login).
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

    // Audit log entry — admin actions on roles are always traceable.
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

export const listRoleAuditLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const numItems = clampPageSize(args.limit);

    const logs = await ctx.db
      .query("roleAuditLogs")
      .withIndex("by_time")
      .order("desc")
      .take(numItems);

    const enriched = await Promise.all(
      logs.map(async (log) => {
        const [actor, target] = await Promise.all([
          ctx.db.get(log.actorUserId),
          ctx.db.get(log.targetUserId),
        ]);
        return {
          _id: log._id,
          actorEmail: (actor as { email?: string } | null)?.email ?? null,
          targetEmail: (target as { email?: string } | null)?.email ?? null,
          previousRole: log.previousRole,
          newRole: log.newRole,
          timestamp: log.timestamp,
        };
      }),
    );

    return enriched;
  },
});

export const listFeedback = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const numItems = clampPageSize(args.limit);

    const items = await ctx.db
      .query("feedback")
      .withIndex("by_time")
      .order("desc")
      .take(numItems);

    const enriched = await Promise.all(
      items.map(async (f) => {
        const user = f.userId ? await ctx.db.get(f.userId) : null;
        return {
          _id: f._id,
          subject: f.subject,
          message: f.message,
          submitterEmail: (user as { email?: string } | null)?.email ?? null,
          timestamp: f.timestamp,
        };
      }),
    );

    return enriched;
  },
});
