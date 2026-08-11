import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { optionalUser, requireUser, requireOwnedDoc } from "../_shared/auth";
import type { Doc } from "../_generated/dataModel";
import { summarizeSalaries } from "./salaryStats";

const MAX_LIST = 100;
const MAX_SCAN_HISTORY = 50;
/**
 * Salary insights scan cap. Percentiles are computed over at most this
 * many *most-recent* listings, so when the table exceeds it the result
 * is a recent-window sample, not a population stat. `getSalaryInsights`
 * surfaces `capped` when this bound is hit so the UI can label it
 * honestly ("dari N lowongan terbaru") rather than implying full coverage.
 */
const MAX_SALARY_SCAN = 500;

type JobListing = Doc<"jobListings">;
type UserProfile = Doc<"userProfiles">;

/** Lowercase, drop punctuation and spacing, so "Node.js" / "node" /
 *  "NodeJS" collapse to one token. Exact string equality made a profile's
 *  "Node.js" miss a listing tagged "node" — different spellings of the same
 *  skill were cancelling each other out. */
function skillKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Split a role into words even when the stored value lost its spaces.
 *  `[ -]` in the old import sanitiser deleted spaces, so real profiles hold
 *  "AIProductBuilder/FullStackDeveloper" — one token that matches no job
 *  title, zeroing the 40-point role component and pinning every score at 30. */
function roleWords(role: string): string[] {
  return role
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length >= 3);
}

function scoreJob(profile: UserProfile | null, job: JobListing): number {
  if (!profile) return 0;

  let score = 0;
  const max = 100;

  const role = profile.targetRole?.toLowerCase() ?? "";
  const title = job.title.toLowerCase();
  if (role && title.includes(role)) score += 40;
  else {
    const words = roleWords(profile.targetRole ?? "");
    const hits = words.filter((w) => title.includes(w)).length;
    // Partial credit scales with how much of the role the title covers, so a
    // "Full Stack Developer" looking at "Senior Full Stack Developer" is not
    // scored the same as one glancing at "Developer Advocate".
    if (hits > 0) score += Math.min(20 + (hits - 1) * 10, 40);
  }

  const userSkills = new Set((profile.skills ?? []).map(skillKey));
  const skillMatches = job.requiredSkills.filter((s) =>
    userSkills.has(skillKey(s)),
  ).length;
  score += Math.min(skillMatches * 10, 40);

  const userLevel = profile.experienceLevel?.toLowerCase() ?? "";
  if (userLevel && job.seniority.toLowerCase().includes(userLevel))
    score += 10;

  const userLoc = profile.location?.toLowerCase() ?? "";
  if (job.workMode === "remote") score += 10;
  else if (userLoc && job.location.toLowerCase().includes(userLoc))
    score += 10;

  return Math.min(score, max);
}

export const listJobs = query({
  args: {
    workMode: v.optional(v.string()),
    category: v.optional(v.string()),
    source: v.optional(v.string()),
    /** When true, only returns user-paste rows where addedBy === current
     *  user. Returns [] when unauthenticated (no error — used for the
     *  "Lowongan Saya" tab which renders empty-state on logout). */
    mineOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, MAX_LIST);

    // "Mine only" — user's own pastes, read straight off by_addedBy_posted.
    // Filtering addedBy after a global postedAt window silently dropped a
    // user's listings once other users' newer pastes filled the window.
    if (args.mineOnly) {
      const userId = await optionalUser(ctx);
      if (!userId) return [];
      const rows = await ctx.db
        .query("jobListings")
        .withIndex("by_addedBy_posted", (q) => q.eq("addedBy", userId))
        .order("desc")
        .take(MAX_LIST);
      return applyClientFilters(rows, args).slice(0, limit);
    }

    // Source-scoped (explore by feed origin). Uses by_source_posted.
    if (args.source && args.source !== "all") {
      const rows = await ctx.db
        .query("jobListings")
        .withIndex("by_source_posted", (q) =>
          q.eq("source", args.source as string),
        )
        .order("desc")
        .take(MAX_LIST);
      return applyClientFilters(rows, args).slice(0, limit);
    }

    // workMode-scoped — uses dedicated index.
    if (args.workMode && args.workMode !== "all") {
      const rows = await ctx.db
        .query("jobListings")
        .withIndex("by_workMode", (q) =>
          q.eq("workMode", args.workMode as string),
        )
        .order("desc")
        .take(MAX_LIST);
      return applyClientFilters(rows, args).slice(0, limit);
    }

    // Default — by posted date desc.
    const rows = await ctx.db
      .query("jobListings")
      .withIndex("by_posted")
      .order("desc")
      .take(MAX_LIST);
    return applyClientFilters(rows, args).slice(0, limit);
  },
});

function applyClientFilters(
  rows: JobListing[],
  args: { category?: string; workMode?: string },
): JobListing[] {
  let out = rows;
  if (args.category && args.category !== "all") {
    out = out.filter((r) => r.category === args.category);
  }
  if (args.workMode && args.workMode !== "all") {
    out = out.filter((r) => r.workMode === args.workMode);
  }
  return out;
}

export const getMatches = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const jobs = await ctx.db
      .query("jobListings")
      .withIndex("by_posted")
      .order("desc")
      .take(200);

    const scored = jobs
      .map((job) => ({ job, score: scoreJob(profile, job) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, args.limit ?? 6);

    return scored.filter((s) => s.score > 0);
  },
});

// ---------------------------------------------------------------------
// Salary insights — aggregate jobListings by category. Cheap full-table
// scan (cap MAX_SALARY_SCAN most-recent rows) since jobListings is
// bounded volume. Returns p25/p50/p75 in original currency; UI renders
// bars. `capped` flags that the scan hit the cap, i.e. percentiles
// describe the most-recent window rather than the full population — the
// UI uses it to keep its "based on N" copy honest.
// ---------------------------------------------------------------------

export const getSalaryInsights = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("jobListings")
      .withIndex("by_posted")
      .order("desc")
      .take(MAX_SALARY_SCAN);

    // Aggregation (currency separation + percentile math) lives in a
    // pure, unit-tested module — see matcher/salaryStats.ts.
    return {
      categories: summarizeSalaries(rows),
      // Total listings actually scanned (the percentile sample ceiling).
      scannedCount: rows.length,
      // True when we may have truncated older listings: stats are a
      // recent-window sample, not the whole table.
      capped: rows.length >= MAX_SALARY_SCAN,
    };
  },
});

// ---------------------------------------------------------------------
// ATS scan history
// ---------------------------------------------------------------------

export const listMyScans = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    const limit = Math.min(args.limit ?? MAX_SCAN_HISTORY, MAX_SCAN_HISTORY);
    const scans = await ctx.db
      .query("atsScans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
    return scans.map((s) => ({
      _id: s._id,
      cvId: s.cvId,
      jobListingId: s.jobListingId,
      jobTitle: s.jobTitle,
      jobCompany: s.jobCompany,
      score: s.score,
      grade: s.grade,
      createdAt: s.createdAt,
    }));
  },
});

export const getScan = query({
  args: { scanId: v.id("atsScans") },
  handler: async (ctx, args) => {
    const scan = await requireOwnedDoc(ctx, args.scanId, "Scan");
    return scan;
  },
});

/**
 * Reverse relation: every ATS scan this user has run against a
 * specific job listing. Lets the matcher tab show "you've scanned
 * this 3× — best score 78" inline on a JobCard.
 */
export const getATSScansByListing = query({
  args: { listingId: v.id("jobListings") },
  handler: async (ctx, args) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("atsScans")
      .withIndex("by_user_listing", (q) =>
        q.eq("userId", userId).eq("jobListingId", args.listingId),
      )
      .order("desc")
      .collect();
  },
});

// ---------------------------------------------------------------------
// Internal helpers — used by actions.scanCV
// ---------------------------------------------------------------------

export const _getOwnedCV = internalQuery({
  args: { cvId: v.id("cvs"), userId: v.id("users") },
  handler: async (ctx, args) => {
    // We can't use requireOwnedDoc here because internalQuery has no
    // auth context. The caller (action) passes the userId it established
    // via getAuthUserId — we read by id AND enforce ownership so one user
    // can't run an ATS scan against another user's CV (IDOR / data leak).
    const cv = await ctx.db.get(args.cvId);
    if (!cv || cv.userId !== args.userId) return null;
    return cv;
  },
});

export const _getListing = internalQuery({
  args: { listingId: v.id("jobListings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.listingId);
  },
});

// ---------------------------------------------------------------------
// Reactive scan-history list — used to refresh "Riwayat" tab without a
// custom hook re-fetch. Same shape as listMyScans but ensures the user
// is authenticated, throwing for unauth so the UI can render a nudge.
// ---------------------------------------------------------------------
export const requireListMyScans = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    const scans = await ctx.db
      .query("atsScans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(MAX_SCAN_HISTORY);
    return scans;
  },
});
