import { query } from "../_generated/server";
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
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const TOP_N = 20;

function clampPageSize(limit: number | undefined): number {
  if (!limit || limit <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(limit, MAX_PAGE_SIZE);
}

function countBy<T>(items: T[], key: (t: T) => string | null | undefined): Array<{ value: string; count: number }> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    const clean = k.trim();
    if (!clean) continue;
    counts.set(clean, (counts.get(clean) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N);
}

// --- Admin (role-gated) ---

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

export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const d7 = now - 7 * DAY;
    const d30 = now - 30 * DAY;

    const users = await ctx.db.query("users").collect();
    const profiles = await ctx.db.query("userProfiles").collect();
    const profilesByUser = new Map(profiles.map((p) => [p.userId, p]));

    const totalUsers = users.length;
    const signedUp7 = users.filter((u) => u._creationTime >= d7).length;
    const signedUp30 = users.filter((u) => u._creationTime >= d30).length;

    const profileComplete = profiles.filter(
      (p) =>
        p.fullName?.trim() &&
        p.location?.trim() &&
        p.targetRole?.trim() &&
        p.experienceLevel?.trim(),
    ).length;

    const publicEnabled = profiles.filter((p) => p.publicEnabled).length;

    const files = await ctx.db.query("files").collect();
    const totalBytes = files.reduce((sum, f) => sum + f.fileSize, 0);
    const imageCount = files.filter((f) => f.fileType.startsWith("image/")).length;
    const pdfCount = files.filter((f) => f.fileType === "application/pdf").length;

    return {
      totalUsers,
      signedUp7,
      signedUp30,
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
        files: files.length,
        totalBytes,
        imageCount,
        pdfCount,
      },
      profilesCount: profiles.length,
      profilesWithoutUser: profiles.filter((p) => !users.find((u) => u._id === p.userId)).length,
      _probe: profilesByUser.size,
    };
  },
});

export const getProfileAggregates = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const profiles = await ctx.db.query("userProfiles").collect();

    const topTargetRoles = countBy(profiles, (p) => p.targetRole?.toLowerCase());
    const topLocations = countBy(profiles, (p) => p.location?.toLowerCase());
    const topExperience = countBy(profiles, (p) => p.experienceLevel?.toLowerCase());

    const allSkills: string[] = [];
    const allInterests: string[] = [];
    for (const p of profiles) {
      if (p.skills) for (const s of p.skills) allSkills.push(s.toLowerCase());
      if (p.interests) for (const i of p.interests) allInterests.push(i.toLowerCase());
    }
    const topSkills = countBy(allSkills, (s) => s);
    const topInterests = countBy(allInterests, (i) => i);

    return {
      topTargetRoles,
      topLocations,
      topExperience,
      topSkills,
      topInterests,
      totalProfiles: profiles.length,
    };
  },
});

export const getFeatureAdoption = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const users = await ctx.db.query("users").collect();
    const total = users.length || 1;

    const [
      cvs,
      applications,
      checklists,
      roadmaps,
      interviews,
      plans,
      goals,
      budgetVars,
      portfolios,
      contacts,
      chatSessions,
    ] = await Promise.all([
      ctx.db.query("cvs").collect(),
      ctx.db.query("jobApplications").collect(),
      ctx.db.query("documentChecklists").collect(),
      ctx.db.query("skillRoadmaps").collect(),
      ctx.db.query("mockInterviews").collect(),
      ctx.db.query("financialPlans").collect(),
      ctx.db.query("careerGoals").collect(),
      ctx.db.query("budgetVariables").collect(),
      ctx.db.query("portfolioItems").collect(),
      ctx.db.query("contacts").collect(),
      ctx.db.query("chatConversations").collect(),
    ]);

    const uniq = <T extends { userId: unknown }>(rows: T[]) =>
      new Set(rows.map((r) => String(r.userId))).size;

    return {
      totalUsers: users.length,
      adoption: [
        { slice: "CV Generator", users: uniq(cvs), pct: Math.round((uniq(cvs) / total) * 100), rows: cvs.length },
        { slice: "Lamaran", users: uniq(applications), pct: Math.round((uniq(applications) / total) * 100), rows: applications.length },
        { slice: "Ceklis Dokumen", users: uniq(checklists), pct: Math.round((uniq(checklists) / total) * 100), rows: checklists.length },
        { slice: "Roadmap Skill", users: uniq(roadmaps), pct: Math.round((uniq(roadmaps) / total) * 100), rows: roadmaps.length },
        { slice: "Simulasi Wawancara", users: uniq(interviews), pct: Math.round((uniq(interviews) / total) * 100), rows: interviews.length },
        { slice: "Kalkulator Keuangan", users: uniq(plans), pct: Math.round((uniq(plans) / total) * 100), rows: plans.length },
        { slice: "Goal Karir", users: uniq(goals), pct: Math.round((uniq(goals) / total) * 100), rows: goals.length },
        { slice: "Budget Envelopes", users: uniq(budgetVars), pct: Math.round((uniq(budgetVars) / total) * 100), rows: budgetVars.length },
        { slice: "Portofolio", users: uniq(portfolios), pct: Math.round((uniq(portfolios) / total) * 100), rows: portfolios.length },
        { slice: "Networking", users: uniq(contacts), pct: Math.round((uniq(contacts) / total) * 100), rows: contacts.length },
        { slice: "AI Agent Chat", users: uniq(chatSessions), pct: Math.round((uniq(chatSessions) / total) * 100), rows: chatSessions.length },
      ].sort((a, b) => b.pct - a.pct),
    };
  },
});

export const getSignupTrend = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const DAYS = 30;
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const startMs = now - (DAYS - 1) * DAY;

    const users = await ctx.db.query("users").collect();

    const buckets = new Map<string, number>();
    for (let i = 0; i < DAYS; i++) {
      const d = new Date(startMs + i * DAY);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, 0);
    }
    for (const u of users) {
      if (u._creationTime < startMs) continue;
      const key = new Date(u._creationTime).toISOString().slice(0, 10);
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
    }
    return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
  },
});

export const listUsersWithProfiles = query({
  args: {},
  handler: async (ctx) => {
    // User-management table is the core admin tool — gated by role,
    // not by super-admin email. Super-admin still passes via
    // requireAdmin's email-bypass branch.
    await requireAdmin(ctx);

    const users = await ctx.db
      .query("users")
      .order("desc")
      .take(200);

    const profiles = await ctx.db.query("userProfiles").collect();
    const byUser = new Map(profiles.map((p) => [String(p.userId), p]));

    return users.map((u) => {
      const p = byUser.get(String(u._id));
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
    });
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

    const roadmaps = await ctx.db.query("skillRoadmaps").order("desc").collect();
    const users = await ctx.db.query("users").collect();
    const emailMap = new Map(
      users.map((u) => [String(u._id), (u as { email?: string }).email ?? ""]),
    );

    return roadmaps.map((r) => ({
      _id: r._id,
      userId: r.userId,
      userEmail: emailMap.get(String(r.userId)) ?? "",
      careerPath: r.careerPath,
      skillsCount: r.skills.length,
      progress: r.progress,
      createdAt: r._creationTime,
      skills: r.skills,
    }));
  },
});
