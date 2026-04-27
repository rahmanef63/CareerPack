import { query } from "../_generated/server";
import { optionalUser } from "../_shared/auth";

/**
 * History of Quick Fill imports for the current user, newest first.
 * Returns the full row including ID arrays so the UI can show a
 * meaningful "x CV, y goals, …" line for each batch and call
 * `undoBatch(batchId)` from a button.
 */
export const listBatches = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("quickFillBatches")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return rows;
  },
});
