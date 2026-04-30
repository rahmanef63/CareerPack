/**
 * Cascade-delete every record owned by `userId`, then the user record
 * itself + auth artefacts. See docs/auth.md for the full delete contract.
 *
 * `roleAuditLogs` and `feedback` are intentionally NOT cascaded — both
 * survive user deletion so historical context stays reviewable.
 */

import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";

export async function cascadeDeleteUser(ctx: MutationCtx, userId: Id<"users">) {
  const owned = [
    "userProfiles",
    "jobApplications",
    "cvs",
    "skillRoadmaps",
    "documentChecklists",
    "mockInterviews",
    "financialPlans",
    "careerGoals",
    "notifications",
    "chatConversations",
    "calendarEvents",
    "portfolioItems",
    "contacts",
    "budgetVariables",
    "aiSettings",
    "atsScans",
    "quickFillBatches",
  ] as const;

  for (const table of owned) {
    const rows = await ctx.db
      .query(table)
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const r of rows) await ctx.db.delete(r._id);
  }

  const userFiles = await ctx.db
    .query("files")
    .withIndex("by_user", (q) => q.eq("uploadedBy", userId))
    .collect();
  for (const f of userFiles) {
    try {
      await ctx.storage.delete(f.storageId);
    } catch {
      /* blob may already be gone */
    }
    await ctx.db.delete(f._id);
  }

  const authSessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .collect();
  for (const s of authSessions) {
    const refreshTokens = await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", s._id))
      .collect();
    for (const r of refreshTokens) await ctx.db.delete(r._id);
    await ctx.db.delete(s._id);
  }

  const authAccounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
    .collect();
  for (const a of authAccounts) {
    const codes = await ctx.db
      .query("authVerificationCodes")
      .withIndex("accountId", (q) => q.eq("accountId", a._id))
      .collect();
    for (const c of codes) await ctx.db.delete(c._id);
    await ctx.db.delete(a._id);
  }

  const resets = await ctx.db
    .query("passwordResetTokens")
    .filter((q) => q.eq(q.field("userId"), userId))
    .collect();
  for (const t of resets) await ctx.db.delete(t._id);

  await ctx.db.delete(userId);
}
