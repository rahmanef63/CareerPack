import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserConversation = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("chatConversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const saveMessage = mutation({
  args: {
    role: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db
      .query("chatConversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const newMessage = {
      id: crypto.randomUUID(),
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
    };

    if (conversation) {
      const updatedMessages = [...conversation.messages, newMessage];
      await ctx.db.patch(conversation._id, {
        messages: updatedMessages,
      });
    } else {
      await ctx.db.insert("chatConversations", {
        userId,
        messages: [newMessage],
      });
    }
  },
});

export const clearConversation = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db
      .query("chatConversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (conversation) {
      await ctx.db.patch(conversation._id, {
        messages: [],
      });
    }
  },
});
