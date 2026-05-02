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
import type { Doc } from "../_generated/dataModel";

const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;
const TOP_N = 5;

export const _listOptedIn = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Profiles with digestEnabled=true. Volume is tiny in beta — full
    // scan is fine. Replace with index-by-flag if it ever grows.
    const profiles = await ctx.db.query("userProfiles").collect();
    return profiles.filter((p) => p.digestEnabled === true);
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

export const sendWeeklyDigest = internalAction({
  args: {},
  handler: async (ctx): Promise<DigestSweepResult> => {
    const appUrl = (process.env.APP_URL ?? "https://careerpack.local").replace(/\/$/, "");
    const profiles: Doc<"userProfiles">[] = await ctx.runQuery(
      internal.notifications.digest._listOptedIn,
      {},
    );

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
          console.warn(`[digest] send failed for ${recipient}: ${result.reason}`);
        }
      } catch (err) {
        failed++;
        console.error(`[digest] error for profile ${profile._id}:`, err);
      }
    }

    console.log(`[digest] sent=${sent} skipped=${skipped} failed=${failed} total=${profiles.length}`);
    return { sent, skipped, failed, total: profiles.length };
  },
});
