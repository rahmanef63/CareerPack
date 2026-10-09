import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { enforceGlobalWriteLimit } from "./_shared/rateLimit";

export const checkSignup = internalMutation({
  args: {}, returns: v.null(),
  handler: async ctx => {
    await enforceGlobalWriteLimit(ctx, "signup", 20);
    return null;
  },
});
