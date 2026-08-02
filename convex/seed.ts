import { mutation, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./_shared/auth";
import { bootstrapUser } from "./_shared/bootstrapUser";
import { renderWelcomeEmail, sendEmail } from "./_shared/email";
import { redactEmail } from "./_shared/redact";

export const seedForCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Auth required. Earlier versions had an unauth fallback that picked
    // the "first user in the DB" if no email matched — that path was a
    // public oracle + plant-into-victim-account exploit. Removed.
    const userId = await requireUser(ctx);

    // Body moved to `_shared/bootstrapUser.ts` so convex/auth.ts can run the
    // same work from `afterUserCreatedOrUpdated`, inside the mutation that
    // creates the users row. This call is no longer the only path — it is the
    // retry-from-the-browser one, kept because it also promotes an existing
    // user whose email was added to ADMIN_BOOTSTRAP_EMAILS later.
    await bootstrapUser(ctx, userId);

    return { ok: true };
  },
});

/**
 * One-off repair for accounts created before the sign-up race was closed.
 *
 * Deliberately does NOT reuse `bootstrapUser`: that schedules the welcome
 * email, and these people registered days or weeks ago. A "welcome to
 * CareerPack" landing in an old inbox reads as a broken system, not a fix. It
 * only restores the missing `userProfiles` row, carrying across the name they
 * actually typed at sign-up, which is what the dashboard greeting and the
 * profile-completion card read.
 *
 * `apply: false` (the default) reports what it would do and writes nothing.
 */
export const backfillMissingProfiles = internalMutation({
  args: { apply: v.optional(v.boolean()) },
  handler: async (ctx, { apply = false }) => {
    const users = await ctx.db.query("users").collect();
    const repaired: string[] = [];

    for (const user of users) {
      const existing = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();
      if (existing) continue;

      repaired.push(redactEmail((user as { email?: string }).email ?? "(anonymous)"));
      if (!apply) continue;

      await ctx.db.insert("userProfiles", {
        userId: user._id,
        fullName: (user as { name?: string }).name ?? "",
        location: "",
        targetRole: "",
        experienceLevel: "",
      });
    }

    return { apply, scanned: users.length, repaired: repaired.length, accounts: repaired };
  },
});

/**
 * Welcome email — scheduled by the first-signup branch in
 * `seedForCurrentUser`. Resolves the dashboard URL from `APP_URL` env
 * (set in production) and falls back to a sensible default for dev.
 */
export const deliverWelcomeEmail = internalAction({
  args: { to: v.string(), fullName: v.string() },
  handler: async (ctx, args) => {
    const baseUrl = (process.env.APP_URL ?? "https://careerpack.local").replace(/\/$/, "");
    const dashboardUrl = `${baseUrl}/dashboard`;
    const { subject, html, text } = await renderWelcomeEmail(args.fullName, dashboardUrl, args.to);
    const result = await sendEmail(ctx, {
      to: args.to,
      subject,
      html,
      text,
      tag: "welcome",
      // Welcome respects unsubscribe — user opted out of marketing.
    });
    if (!result.ok) {
      console.error(`[welcome] email delivery failed reason=${result.reason} to=${redactEmail(args.to)}`);
    }
    return result;
  },
});
