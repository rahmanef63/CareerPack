import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { optionalUser, requireUser, requireOwnedDoc } from "../_shared/auth";
import type { Doc } from "../_generated/dataModel";

const MAX_LIST = 50;
const MAX_SCAN_HISTORY = 50;

type JobListing = Doc<"jobListings">;
type UserProfile = Doc<"userProfiles">;

function scoreJob(profile: UserProfile | null, job: JobListing): number {
  if (!profile) return 0;

  let score = 0;
  const max = 100;

  const role = profile.targetRole?.toLowerCase() ?? "";
  const title = job.title.toLowerCase();
  if (role && title.includes(role)) score += 40;
  else if (role && role.split(" ").some((w) => w && title.includes(w)))
    score += 20;

  const userSkills = (profile.skills ?? []).map((s) => s.toLowerCase());
  const skillMatches = job.requiredSkills.filter((s) =>
    userSkills.includes(s.toLowerCase()),
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
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, MAX_LIST);
    let cursor = ctx.db.query("jobListings").withIndex("by_posted").order("desc");
    if (args.workMode && args.workMode !== "all") {
      cursor = ctx.db
        .query("jobListings")
        .withIndex("by_workMode", (q) =>
          q.eq("workMode", args.workMode as string),
        )
        .order("desc");
    }
    return await cursor.take(limit);
  },
});

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
  args: { cvId: v.id("cvs") },
  handler: async (ctx, args) => {
    // We can't use requireOwnedDoc here because internalQuery has no
    // auth context. The caller (action) has already established userId
    // via getAuthUserId — we just read by id and check ownership.
    const cv = await ctx.db.get(args.cvId);
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
