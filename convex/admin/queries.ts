import { query } from "../_generated/server";
import type { QueryCtx } from "../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  requireAdmin,
  isSuperAdminCaller,
  requireSuperAdmin,
  optionalUser,
} from "../_shared/auth";
import type { Doc } from "../_generated/dataModel";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
// Cap for the role-gated management tables (`listUsersWithProfiles`,
// `listAllRoadmaps`) — bounds the reactive read and surfaces a `truncated`
// flag when more rows exist beyond the window.
const MANAGEMENT_TABLE_LIMIT = 200;

function clampPageSize(limit: number | undefined): number {
  if (!limit || limit <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(limit, MAX_PAGE_SIZE);
}

// --- Admin (role-gated) ---

/**
 * Reads denormalized counters from the `adminStats` singleton (recomputed
 * hourly by `internal.admin.aggregator.recomputeAdminStats`). Previously
 * full-scanned `users` + `cvs` + `jobApplications` + `rateLimitEvents` on
 * every dashboard tick — now O(1).
 *
 * Returns `computedAt` so the UI can render a "Last updated X min ago"
 * hint. Falls back to zero-shape when the cron hasn't run yet (fresh deploy).
 */
export const getGlobalStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const doc = await ctx.db
      .query("adminStats")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
    if (!doc) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalCVs: 0,
        totalApplications: 0,
        aiUsage: { totalRequests: 0, totalTokens: 0, lastMonth: 0 },
        computedAt: null as number | null,
      };
    }
    return {
      totalUsers: doc.totalUsers,
      activeUsers: doc.activeUsers30d,
      totalCVs: doc.totalCVs,
      totalApplications: doc.totalApplications,
      aiUsage: {
        totalRequests: doc.aiTotalRequests,
        totalTokens: 0,
        lastMonth: doc.aiLastMonth,
      },
      computedAt: doc.computedAt,
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

/**
 * 30-day rollup of AI usage + error trends, scoped for the admin dash.
 *
 * Returns:
 *   - `daily`: 30-element array (oldest → newest) of `{ date, requests, errors }`
 *   - `topUsers`: top-10 users by AI request count (last 30 days)
 *   - `topErrorSources`: top-10 sources from errorLogs (last 30 days)
 *   - `currentLoad`: requests in the last 60s + last 24h (rolling)
 *
 * Cost: scans `rateLimitEvents` and `errorLogs` once each. Both are
 * append-only logs that the daily `pruneAppendOnlyTables` cron sweeps
 * (errorLogs > 90d, rateLimitEvents > 7d), so unbounded growth is
 * mitigated upstream and these scans stay bounded.
 */
/**
 * 30-day rollup of AI usage + error trends. Reads denormalized
 * `adminStats` doc (recomputed hourly). Returns zero-shape when cron
 * hasn't yet populated the doc.
 *
 * Staleness budget: ≤ 1h. Acceptable for a trend chart spanning 30 days.
 */
export const getAIUsageStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const doc = await ctx.db
      .query("adminStats")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
    if (!doc) {
      return {
        daily: [] as Array<{ date: string; requests: number; errors: number }>,
        topUsers: [] as Array<{
          userId: string;
          email: string | null;
          name: string | null;
          count: number;
        }>,
        topErrorSources: [] as Array<{ value: string; count: number }>,
        currentLoad: { last60s: 0, last24h: 0 },
        totalRequests30d: 0,
        totalErrors30d: 0,
        computedAt: null as number | null,
      };
    }
    return {
      daily: doc.aiDaily30d,
      topUsers: doc.topAIUsers.map((u) => ({
        userId: u.userId as string,
        email: u.email,
        name: u.name,
        count: u.count,
      })),
      topErrorSources: doc.topErrorSources,
      currentLoad: { last60s: doc.aiLast60s, last24h: doc.aiLast24h },
      totalRequests30d: doc.aiTotalRequests30d,
      totalErrors30d: doc.totalErrors30d,
      computedAt: doc.computedAt,
    };
  },
});

/**
 * Distinct sources currently present in `errorLogs`. Powers the
 * ErrorLogsPanel filter dropdown so admin sees only sources that
 * actually have rows. Caps at 200 most-recent rows scanned — beyond
 * that, the slow-changing top sources will dominate anyway.
 */
export const listErrorSources = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const recent = await ctx.db
      .query("errorLogs")
      .withIndex("by_time")
      .order("desc")
      .take(200);
    const counts = new Map<string, number>();
    for (const r of recent) {
      counts.set(r.source, (counts.get(r.source) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => ({ source, count }));
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

export const listEmailEvents = query({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    limit: v.optional(v.number()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const numItems = clampPageSize(args.limit);
    const q = ctx.db.query("emailEvents").withIndex("by_time").order("desc");
    const result = await q.paginate({
      cursor: args.cursor ?? null,
      numItems,
    });
    const filtered = args.type
      ? result.page.filter((e: Doc<"emailEvents">) => e.type === args.type)
      : result.page;
    return {
      page: filtered,
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    };
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

// --- Analytics (super-admin only) ---

export const amISuperAdmin = query({
  args: {},
  handler: async (ctx) => {
    return await isSuperAdminCaller(ctx);
  },
});

/**
 * Non-throwing probe — true when the caller is either the super-admin
 * or has `role: "admin"` on their profile. Drives nav visibility for
 * the Admin Panel tile so role-bootstrapped admins (via
 * `ADMIN_BOOTSTRAP_EMAILS`) see the entry without needing
 * `SUPER_ADMIN_EMAIL` set.
 */
export const amIAdmin = query({
  args: {},
  handler: async (ctx) => {
    if (await isSuperAdminCaller(ctx)) return true;
    const userId = await optionalUser(ctx);
    if (!userId) return false;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return profile?.role === "admin";
  },
});

/**
 * Reads the denormalized `adminStats` singleton (recomputed hourly by
 * `internal.admin.aggregator.recomputeAdminStats`). Shared by the four
 * super-admin analytics queries below so each becomes an O(1) doc read
 * instead of a full-table `.collect()` that re-ran on every write while
 * an operator watched the dashboard. Returns `null` when the cron has not
 * yet populated the doc (fresh deploy) — callers render a zero-shape.
 */
async function readAdminStats(ctx: QueryCtx) {
  return await ctx.db
    .query("adminStats")
    .withIndex("by_key", (q) => q.eq("key", "global"))
    .first();
}

const EMPTY_TOP: Array<{ value: string; count: number }> = [];

export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const doc = await readAdminStats(ctx);
    const totalUsers = doc?.totalUsers ?? 0;
    const profilesCount = doc?.profilesCount ?? 0;
    const profileComplete = doc?.profileCompleteCount ?? 0;
    const publicEnabled = doc?.publicEnabledCount ?? 0;

    return {
      totalUsers,
      signedUp7: doc?.signedUp7 ?? 0,
      signedUp30: doc?.signedUp30 ?? 0,
      profileCompletePct:
        totalUsers === 0
          ? 0
          : Math.round((profileComplete / totalUsers) * 100),
      publicEnabled,
      publicEnabledPct:
        totalUsers === 0
          ? 0
          : Math.round((publicEnabled / totalUsers) * 100),
      storage: {
        files: doc?.storageFiles ?? 0,
        totalBytes: doc?.storageBytes ?? 0,
        imageCount: doc?.storageImageCount ?? 0,
        pdfCount: doc?.storagePdfCount ?? 0,
      },
      profilesCount,
      computedAt: doc?.computedAt ?? null,
    };
  },
});

export const getProfileAggregates = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const doc = await readAdminStats(ctx);
    return {
      topTargetRoles: doc?.topTargetRoles ?? EMPTY_TOP,
      topLocations: doc?.topLocations ?? EMPTY_TOP,
      topExperience: doc?.topExperience ?? EMPTY_TOP,
      topSkills: doc?.topSkills ?? EMPTY_TOP,
      topInterests: doc?.topInterests ?? EMPTY_TOP,
      totalProfiles: doc?.profilesCount ?? 0,
      computedAt: doc?.computedAt ?? null,
    };
  },
});

export const getFeatureAdoption = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const doc = await readAdminStats(ctx);
    return {
      totalUsers: doc?.totalUsers ?? 0,
      adoption:
        doc?.featureAdoption ??
        ([] as Array<{ slice: string; users: number; pct: number; rows: number }>),
      computedAt: doc?.computedAt ?? null,
    };
  },
});

export const getSignupTrend = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const doc = await readAdminStats(ctx);
    return doc?.signupTrend30d ?? [];
  },
});

export const listUsersWithProfiles = query({
  args: {},
  handler: async (ctx) => {
    // User-management table is the core admin tool — gated by role,
    // not by super-admin email. Super-admin still passes via
    // requireAdmin's email-bypass branch.
    await requireAdmin(ctx);

    // Bound to the most-recent N users. Profiles are resolved per-user via
    // the `by_user` index (≤ N point lookups) instead of an unbounded
    // `userProfiles.collect()` that grew with the whole user base on every
    // reactive tick.
    const users = await ctx.db
      .query("users")
      .order("desc")
      .take(MANAGEMENT_TABLE_LIMIT);

    return await Promise.all(
      users.map(async (u) => {
        const p = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", u._id))
          .first();
        return {
          userId: u._id,
          email: u.email ?? "",
          name: u.name ?? "",
          createdAt: u._creationTime,
          fullName: p?.fullName ?? "",
          location: p?.location ?? "",
          targetRole: p?.targetRole ?? "",
          experienceLevel: p?.experienceLevel ?? "",
          role: (p?.role ?? "user") as "admin" | "moderator" | "user",
          skillsCount: p?.skills?.length ?? 0,
          interestsCount: p?.interests?.length ?? 0,
          publicEnabled: Boolean(p?.publicEnabled),
          hasAvatar: Boolean(p?.avatarStorageId),
        };
      }),
    );
  },
});

export const listAllTemplates = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("roadmapTemplates").collect();
    return all.sort((a, b) => a.order - b.order);
  },
});

export const listAllRoadmaps = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    // Bound to the most-recent N roadmaps. Each row carries a `skills[]`
    // array, so an unbounded `.collect()` here ballooned with the whole
    // table on every reactive tick. We over-fetch by one to detect (and
    // surface) truncation, then resolve owner emails per-roadmap via point
    // lookups instead of a full `users.collect()`.
    const fetched = await ctx.db
      .query("skillRoadmaps")
      .order("desc")
      .take(MANAGEMENT_TABLE_LIMIT + 1);
    const truncated = fetched.length > MANAGEMENT_TABLE_LIMIT;
    const roadmaps = truncated ? fetched.slice(0, MANAGEMENT_TABLE_LIMIT) : fetched;

    const rows = await Promise.all(
      roadmaps.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        return {
          _id: r._id,
          userId: r.userId,
          userEmail: (user as { email?: string } | null)?.email ?? "",
          careerPath: r.careerPath,
          skillsCount: r.skills.length,
          progress: r.progress,
          createdAt: r._creationTime,
          skills: r.skills,
        };
      }),
    );

    return { rows, truncated };
  },
});
