/**
 * Weekly Job Digest — Monday morning email with top job matches per
 * opted-in user. Run by `crons.weekly("digest-sweep", …)`.
 *
 * Idempotent: skips users where `lastDigestSentAt` is within the last
 * 6 days (so a cron retry won't double-send). Soft-fails per user — a
 * failed AI / Resend call doesn't kill the sweep.
 */
import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { renderJobDigestEmail, sendEmail, type DigestJobItem } from "../_shared/email";
import { redactEmail, redactId } from "../_shared/redact";
import type { Doc, Id } from "../_generated/dataModel";

const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;
const TOP_N = 5;
// One action handles at most this many opted-in profiles, then
// re-schedules itself with the continuation cursor. Keeps a growing
// opt-in list from blowing the action time budget and silently
// dropping the un-emailed tail until next Monday.
const PAGE_SIZE = 200;

export const _listOptedIn = internalQuery({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("userProfiles")
      .withIndex("by_digest", (q) => q.eq("digestEnabled", true))
      .paginate({ cursor: args.cursor ?? null, numItems: PAGE_SIZE });
    // Project only what the sweep needs — full Doc rows drag skills[],
    // interests[] and publicBlocks[] across the action boundary.
    // Recipient comes from the auth `users` row: `userProfiles.email`
    // is declared but no code path ever writes it, so reading it alone
    // meant the digest could never send.
    const rows = await Promise.all(
      page.page.map(async (p) => ({
        _id: p._id,
        userId: p.userId,
        fullName: p.fullName,
        email: (await ctx.db.get(p.userId))?.email ?? p.email ?? null,
        lastDigestSentAt: p.lastDigestSentAt ?? null,
      })),
    );
    return { rows, cursor: page.continueCursor, isDone: page.isDone };
  },
});

export const _topMatchesForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const jobs = await ctx.db
      .query("jobListings")
      .withIndex("by_posted")
      .order("desc")
      .take(200);

    const role = profile?.targetRole?.toLowerCase() ?? "";
    const userSkills = (profile?.skills ?? []).map((s) => s.toLowerCase());
    const userLevel = profile?.experienceLevel?.toLowerCase() ?? "";
    const userLoc = profile?.location?.toLowerCase() ?? "";

    const scored = jobs.map((job) => {
      let score = 0;
      const title = job.title.toLowerCase();
      if (role && title.includes(role)) score += 40;
      else if (role && role.split(" ").some((w) => w && title.includes(w))) score += 20;
      const skillMatches = job.requiredSkills.filter((s) =>
        userSkills.includes(s.toLowerCase()),
      ).length;
      score += Math.min(skillMatches * 10, 40);
      if (userLevel && job.seniority.toLowerCase().includes(userLevel)) score += 10;
      if (job.workMode === "remote") score += 10;
      else if (userLoc && job.location.toLowerCase().includes(userLoc)) score += 10;
      return { job, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N);
  },
});

export const _markDigestSent = internalMutation({
  args: { profileId: v.id("userProfiles"), at: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profileId, { lastDigestSentAt: args.at });
  },
});

interface DigestSweepResult {
  sent: number;
  skipped: number;
  failed: number;
  total: number;
}

interface DigestProfile {
  _id: Id<"userProfiles">;
  userId: Id<"users">;
  fullName: string;
  email: string | null;
  lastDigestSentAt: number | null;
}

export const sendWeeklyDigest = internalAction({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  handler: async (ctx, args): Promise<DigestSweepResult> => {
    const appUrl = (process.env.APP_URL ?? "https://careerpack.local").replace(/\/$/, "");
    const page: {
      rows: DigestProfile[];
      cursor: string;
      isDone: boolean;
    } = await ctx.runQuery(internal.notifications.digest._listOptedIn, {
      cursor: args.cursor ?? null,
    });
    const profiles = page.rows;

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const profile of profiles) {
      try {
        // Idempotency — skip if we already sent within 6 days.
        if (profile.lastDigestSentAt && Date.now() - profile.lastDigestSentAt < SIX_DAYS_MS) {
          skipped++;
          continue;
        }
        const recipient = profile.email;
        if (!recipient) {
          skipped++;
          continue;
        }

        const matches: Array<{ job: Doc<"jobListings">; score: number }> =
          await ctx.runQuery(
            internal.notifications.digest._topMatchesForUser,
            { userId: profile.userId },
          );
        if (matches.length === 0) {
          skipped++;
          continue;
        }

        const items: DigestJobItem[] = matches.map((m) => ({
          title: m.job.title,
          company: m.job.company,
          location: m.job.location,
          workMode: m.job.workMode,
          category: m.job.category,
          score: m.score,
          applyUrl: m.job.applyUrl,
          detailUrl: `${appUrl}/dashboard/matcher`,
        }));

        const rendered = await renderJobDigestEmail(
          profile.fullName,
          items,
          `${appUrl}/dashboard/matcher`,
          recipient,
        );
        const result = await sendEmail(ctx, {
          to: recipient,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          tag: "weekly-digest",
        });

        if (result.ok) {
          sent++;
          await ctx.runMutation(internal.notifications.digest._markDigestSent, {
            profileId: profile._id,
            at: Date.now(),
          });
        } else {
          failed++;
          console.warn(`[digest] send failed for ${redactEmail(recipient)}: ${result.reason}`);
        }
      } catch (err) {
        failed++;
        console.error(`[digest] error for profile ${redactId(profile._id)}:`, err);
      }
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.digest.sendWeeklyDigest,
        { cursor: page.cursor },
      );
    }

    console.log(`[digest] sent=${sent} skipped=${skipped} failed=${failed} total=${profiles.length} done=${page.isDone}`);
    return { sent, skipped, failed, total: profiles.length };
  },
});
