import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./_lib/auth";
import type { Doc, Id } from "./_generated/dataModel";

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
    cursor: v.optional(v.union(v.string(), v.null())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const numItems = clampPageSize(args.limit);

    const result = await ctx.db.query("users").paginate({
      cursor: args.cursor ?? null,
      numItems,
    });

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

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("Pengguna tidak ditemukan");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, { role: args.role });
      return;
    }

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

    // Reference callerId so lint doesn't flag — also useful if we add audit log later.
    void (callerId as Id<"users">);
  },
});
