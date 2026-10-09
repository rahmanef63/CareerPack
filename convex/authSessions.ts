import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const isRevoked = internalQuery({
  args: { sessionId: v.string() }, returns: v.boolean(),
  handler: async (ctx, { sessionId }) => {
    const row = await ctx.db.query("authRevocations").withIndex("by_session", q => q.eq("sessionId", sessionId)).first();
    return !!row && row.expiresAt > Date.now();
  },
});

export const pruneRevocations = internalMutation({
  args: {}, returns: v.null(),
  handler: async ctx => {
    const rows = await ctx.db.query("authRevocations").withIndex("by_expiry", q => q.lte("expiresAt", Date.now())).take(500);
    for (const row of rows) await ctx.db.delete(row._id);
    return null;
  },
});
