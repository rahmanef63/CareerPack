import { internalMutation } from "../_generated/server";
import { cascadeDeleteUser } from "./mutations";

/**
 * Daily cron target. Removes anonymous users (no email) older than 7
 * days, capped at 50 per run. See convex/crons.ts for the schedule.
 */
export const cleanupInactiveDemoUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const allUsers = await ctx.db.query("users").collect();
    const stale = allUsers.filter(
      (u) => !u.email && u._creationTime < cutoff,
    );
    const batch = stale.slice(0, 50);
    for (const u of batch) {
      await cascadeDeleteUser(ctx, u._id);
    }
    return { scanned: allUsers.length, candidates: stale.length, deleted: batch.length };
  },
});
