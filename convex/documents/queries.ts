import { query } from "../_generated/server";
import { optionalUser } from "../_shared/auth";

export const getUserDocumentChecklist = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("documentChecklists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});
