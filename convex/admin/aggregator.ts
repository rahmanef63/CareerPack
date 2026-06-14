import { internalMutation } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

/**
 * Hourly admin-dashboard aggregator.
 *
 * Replaces the unbounded `.collect()` calls that used to fire on every
 * Admin Dashboard tick. Originally the 5 DashboardPanel/ChartsPanel scans
 * (`users`, `cvs`, `jobApplications`, `rateLimitEvents`, `errorLogs`);
 * 2026-06-15 it also subsumed the super-admin analytics scans that were
 * still hitting `userProfiles`, `files`, and the 11 feature-adoption tables
 * (incl. `chatConversations` WITH its heavy `messages[]`) on every reactive
 * tick. Cron runs once per hour and upserts a single `adminStats` doc keyed
 * by `"global"`; the admin queries then read O(1) from that doc.
 *
 * Staleness budget: ≤ 1 hour. Acceptable for an internal-ops dashboard;
 * fast iterators (active load, current spike) can still be derived from
 * the most-recent daily bucket which the aggregator refreshes hourly.
 */

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_N = 10;
// Top-N width for the profile-aggregate rankings surfaced on the analytics
// dashboard (target role / location / experience / skills / interests).
const TOP_N_PROFILE = 20;

type Counted = { value: string; count: number };

/** Top-N { value, count }, trimmed + lower-cased keys, descending by count. */
function topCounts(values: Iterable<string | null | undefined>, n: number): Counted[] {
  const counts = new Map<string, number>();
  for (const raw of values) {
    if (!raw) continue;
    const clean = raw.trim();
    if (!clean) continue;
    counts.set(clean, (counts.get(clean) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

export const recomputeAdminStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoff = now - THIRTY_DAYS_MS;

    const [
      users,
      cvs,
      applications,
      rateEvents,
      errorLogs,
      profiles,
      files,
      checklists,
      roadmaps,
      interviews,
      plans,
      goals,
      budgetVars,
      portfolios,
      contacts,
    ] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("cvs").collect(),
      ctx.db.query("jobApplications").collect(),
      ctx.db.query("rateLimitEvents").collect(),
      ctx.db.query("errorLogs").collect(),
      ctx.db.query("userProfiles").collect(),
      ctx.db.query("files").collect(),
      ctx.db.query("documentChecklists").collect(),
      ctx.db.query("skillRoadmaps").collect(),
      ctx.db.query("mockInterviews").collect(),
      ctx.db.query("financialPlans").collect(),
      ctx.db.query("careerGoals").collect(),
      ctx.db.query("budgetVariables").collect(),
      ctx.db.query("portfolioItems").collect(),
      ctx.db.query("contacts").collect(),
    ]);

    // `chatConversations` rows carry a heavy `messages[]` array (up to
    // 200 × 4000 chars). Convex has no column projection, so reading a doc
    // always deserializes every field — to keep this scan from spiking on
    // the message payload we only ever touch `userId` below and never
    // `.messages`. The reactive `getFeatureAdoption` query no longer reads
    // this table at all (it now reads the denormalized counters here).
    const chatRows = await ctx.db.query("chatConversations").collect();

    const recentEvents = rateEvents.filter((e) => e.timestamp >= cutoff);
    const activeUserIds = new Set(recentEvents.map((e) => e.userId));
    const aiEvents = rateEvents.filter((e) => e.key.startsWith("ai:"));
    const aiEventsLastMonth = aiEvents.filter((e) => e.timestamp >= cutoff);

    const aiDayEvents = rateEvents.filter(
      (e) => e.key === "ai:day" && e.timestamp >= cutoff,
    );
    const recentErrors = errorLogs.filter((e) => e.timestamp >= cutoff);

    const startOfToday = Math.floor(now / DAY_MS) * DAY_MS;
    const aiDaily30d = Array.from({ length: 30 }, (_, i) => {
      const dayStart = startOfToday - (29 - i) * DAY_MS;
      const dayEnd = dayStart + DAY_MS;
      const requests = aiDayEvents.filter(
        (e) => e.timestamp >= dayStart && e.timestamp < dayEnd,
      ).length;
      const errors = recentErrors.filter(
        (e) => e.timestamp >= dayStart && e.timestamp < dayEnd,
      ).length;
      return {
        date: new Date(dayStart).toISOString().slice(0, 10),
        requests,
        errors,
      };
    });

    const userCounts = new Map<string, number>();
    for (const e of aiDayEvents) {
      userCounts.set(e.userId, (userCounts.get(e.userId) ?? 0) + 1);
    }
    const userById = new Map(users.map((u) => [u._id, u]));
    const topAIUsers = Array.from(userCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N)
      .map(([userId, count]) => {
        const u = userById.get(userId as Doc<"users">["_id"]);
        return {
          userId: userId as Doc<"users">["_id"],
          email: u?.email ?? null,
          name: u?.name ?? null,
          count,
        };
      });

    const sourceCounts = new Map<string, number>();
    for (const e of recentErrors) {
      const k = e.source?.trim();
      if (!k) continue;
      sourceCounts.set(k, (sourceCounts.get(k) ?? 0) + 1);
    }
    const topErrorSources = Array.from(sourceCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_N);

    const aiLast60s = rateEvents.filter(
      (e) => e.key === "ai:minute" && e.timestamp >= now - 60_000,
    ).length;
    const aiLast24h = rateEvents.filter(
      (e) => e.key === "ai:day" && e.timestamp >= now - DAY_MS,
    ).length;

    // ---- super-admin analytics rollups (formerly reactive .collect()s) ----

    // Overview: signup recency + profile completion + public opt-in + storage.
    const d7 = now - SEVEN_DAYS_MS;
    const d30 = now - THIRTY_DAYS_MS;
    const signedUp7 = users.filter((u) => u._creationTime >= d7).length;
    const signedUp30 = users.filter((u) => u._creationTime >= d30).length;
    const profileCompleteCount = profiles.filter(
      (p) =>
        p.fullName?.trim() &&
        p.location?.trim() &&
        p.targetRole?.trim() &&
        p.experienceLevel?.trim(),
    ).length;
    const publicEnabledCount = profiles.filter((p) => p.publicEnabled).length;
    const storageBytes = files.reduce((sum, f) => sum + f.fileSize, 0);
    const storageImageCount = files.filter((f) =>
      f.fileType.startsWith("image/"),
    ).length;
    const storagePdfCount = files.filter(
      (f) => f.fileType === "application/pdf",
    ).length;

    // Profile aggregates: top-N rankings across the user base.
    const topTargetRoles = topCounts(
      profiles.map((p) => p.targetRole?.toLowerCase()),
      TOP_N_PROFILE,
    );
    const topLocations = topCounts(
      profiles.map((p) => p.location?.toLowerCase()),
      TOP_N_PROFILE,
    );
    const topExperience = topCounts(
      profiles.map((p) => p.experienceLevel?.toLowerCase()),
      TOP_N_PROFILE,
    );
    const allSkills: string[] = [];
    const allInterests: string[] = [];
    for (const p of profiles) {
      if (p.skills) for (const s of p.skills) allSkills.push(s.toLowerCase());
      if (p.interests)
        for (const i of p.interests) allInterests.push(i.toLowerCase());
    }
    const topSkills = topCounts(allSkills, TOP_N_PROFILE);
    const topInterests = topCounts(allInterests, TOP_N_PROFILE);

    // Feature adoption: distinct users + row counts per slice. Reads the
    // `chatRows` metadata-only set (userId only — never `.messages`).
    const adoptionTotal = users.length || 1;
    const uniq = <T extends { userId: unknown }>(rows: T[]) =>
      new Set(rows.map((r) => String(r.userId))).size;
    const adoptionRow = (slice: string, rows: Array<{ userId: unknown }>) => {
      const u = uniq(rows);
      return {
        slice,
        users: u,
        pct: Math.round((u / adoptionTotal) * 100),
        rows: rows.length,
      };
    };
    const featureAdoption = [
      adoptionRow("CV Generator", cvs),
      adoptionRow("Lamaran", applications),
      adoptionRow("Ceklis Dokumen", checklists),
      adoptionRow("Roadmap Skill", roadmaps),
      adoptionRow("Simulasi Wawancara", interviews),
      adoptionRow("Kalkulator Keuangan", plans),
      adoptionRow("Goal Karir", goals),
      adoptionRow("Budget Envelopes", budgetVars),
      adoptionRow("Portofolio", portfolios),
      adoptionRow("Networking", contacts),
      // Only userId is read from chatRows — `messages[]` is never touched.
      adoptionRow(
        "AI Agent Chat",
        chatRows.map((c) => ({ userId: c.userId })),
      ),
    ].sort((a, b) => b.pct - a.pct);

    // Signup trend: per-day account counts over the trailing 30 days.
    const startMs = now - 29 * DAY_MS;
    const trendBuckets = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const key = new Date(startMs + i * DAY_MS).toISOString().slice(0, 10);
      trendBuckets.set(key, 0);
    }
    for (const u of users) {
      if (u._creationTime < startMs) continue;
      const key = new Date(u._creationTime).toISOString().slice(0, 10);
      if (trendBuckets.has(key)) {
        trendBuckets.set(key, (trendBuckets.get(key) ?? 0) + 1);
      }
    }
    const signupTrend30d = Array.from(trendBuckets.entries()).map(
      ([date, count]) => ({ date, count }),
    );

    const payload = {
      key: "global" as const,
      computedAt: now,
      totalUsers: users.length,
      activeUsers30d: activeUserIds.size,
      totalCVs: cvs.length,
      totalApplications: applications.length,
      aiTotalRequests: aiEvents.length,
      aiLastMonth: aiEventsLastMonth.length,
      aiDaily30d,
      topAIUsers,
      topErrorSources,
      aiTotalRequests30d: aiDayEvents.length,
      totalErrors30d: recentErrors.length,
      aiLast60s,
      aiLast24h,
      // super-admin analytics rollups
      signedUp7,
      signedUp30,
      profilesCount: profiles.length,
      profileCompleteCount,
      publicEnabledCount,
      storageFiles: files.length,
      storageBytes,
      storageImageCount,
      storagePdfCount,
      topTargetRoles,
      topLocations,
      topExperience,
      topSkills,
      topInterests,
      featureAdoption,
      signupTrend30d,
    };

    const existing = await ctx.db
      .query("adminStats")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return { ok: true as const, action: "patched", computedAt: now };
    }
    await ctx.db.insert("adminStats", payload);
    return { ok: true as const, action: "inserted", computedAt: now };
  },
});
