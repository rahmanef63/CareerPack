import { mutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { renderWelcomeEmail, sendEmail } from "./_shared/email";

/**
 * Parse `ADMIN_BOOTSTRAP_EMAILS` — comma-separated list of emails that
 * auto-promote to role=admin on their next `seedForCurrentUser` call
 * (which runs on every login via `useAuth.login` → `seedForCurrentUser`).
 * Lowercased + trimmed. Empty string = no admins seeded.
 */
function adminBootstrapEmails(): Set<string> {
  const raw = process.env.ADMIN_BOOTSTRAP_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0),
  );
}

export const seedForCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Auth required. Earlier versions had an unauth fallback that picked
    // the "first user in the DB" if no email matched — that path was a
    // public oracle + plant-into-victim-account exploit. Removed.
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Tidak terautentikasi");

    const authUser = await ctx.db.get(userId);
    const authEmail = (authUser as { email?: string } | null)?.email?.toLowerCase() ?? "";
    const authName = (authUser as { name?: string } | null)?.name ?? "";
    const shouldBeAdmin = authEmail.length > 0 && adminBootstrapEmails().has(authEmail);

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!existingProfile) {
      await ctx.db.insert("userProfiles", {
        userId,
        fullName: authName,
        location: "",
        targetRole: "",
        experienceLevel: "",
        ...(shouldBeAdmin ? { role: "admin" as const } : {}),
      });

      // First-time signup with a real email — fire welcome email out-of-band.
      // Anonymous accounts have no email; skip those silently. Failures land
      // in the backend log and never block the seed.
      if (authEmail.length > 0) {
        await ctx.scheduler.runAfter(0, internal.seed.deliverWelcomeEmail, {
          to: authEmail,
          fullName: "",
        });
      }
    } else if (shouldBeAdmin && existingProfile.role !== "admin") {
      // Existing user whose email was just added to the env list — promote
      // on next login. Does not demote anyone; role removal is manual via
      // api.admin.updateUserRole.
      await ctx.db.patch(existingProfile._id, { role: "admin" });
    }

    return { ok: true };
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
      console.error(`[welcome] email delivery failed reason=${result.reason} to=${args.to}`);
    }
    return result;
  },
});
