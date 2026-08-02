import type { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Parse `ADMIN_BOOTSTRAP_EMAILS` — comma-separated list of emails that
 * auto-promote to role=admin. Lowercased + trimmed; empty = no admins seeded.
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

/**
 * Give a user the row every other feature assumes exists: their `userProfiles`
 * record, seeded with the name they typed at sign-up, plus the welcome email
 * and the ADMIN_BOOTSTRAP_EMAILS promotion.
 *
 * Lifted out of `seedForCurrentUser` because that mutation is called from the
 * BROWSER after `signIn` resolves, and the WebSocket auth context attaches
 * asynchronously afterwards — so the call raced, threw "Tidak terautentikasi",
 * and `useAuth` swallowed it. The 6×200ms retry there was meant to cover the
 * gap and did not: a census of the 2026-07-31 production export found 23 of 35
 * email accounts with NO profile row at all. Every one of those people typed a
 * name into the sign-up form, then landed on a dashboard that greeted them by a
 * fragment of their email address and told them to "Tambah nama lengkap" — and
 * none of them got a welcome email, because it is scheduled from the same
 * branch that never ran.
 *
 * Now also called from `afterUserCreatedOrUpdated` in convex/auth.ts, which
 * runs INSIDE the mutation that inserts the users row. There is no client, no
 * token, and no race there. The browser call stays as-is: it is idempotent,
 * and it is still what promotes an existing user whose email was added to
 * ADMIN_BOOTSTRAP_EMAILS after they first signed up.
 *
 * Idempotent by construction — safe to call on every login, and safe to call
 * twice concurrently, since the second call finds the profile and falls into
 * the promote-only branch.
 */
export async function bootstrapUser(ctx: MutationCtx, userId: string) {
  const authUser = await ctx.db.get(userId as never);
  if (!authUser) return { ok: false as const, reason: "no such user" };

  const authEmail = (authUser as { email?: string }).email?.toLowerCase()?.trim() ?? "";
  const authName = (authUser as { name?: string }).name ?? "";
  const shouldBeAdmin = authEmail.length > 0 && adminBootstrapEmails().has(authEmail);

  const existingProfile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId as never))
    .first();

  if (!existingProfile) {
    await ctx.db.insert("userProfiles", {
      userId: userId as never,
      fullName: authName,
      location: "",
      targetRole: "",
      experienceLevel: "",
      ...(shouldBeAdmin ? { role: "admin" as const } : {}),
    });

    // Anonymous accounts have no email — skip silently rather than scheduling
    // a send to "".
    if (authEmail.length > 0) {
      await ctx.scheduler.runAfter(0, internal.seed.deliverWelcomeEmail, {
        to: authEmail,
        fullName: authName,
      });
    }
    return { ok: true as const, created: true };
  }

  if (shouldBeAdmin && existingProfile.role !== "admin") {
    await ctx.db.patch(existingProfile._id, { role: "admin" });
  }
  return { ok: true as const, created: false };
}
