import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { optionalUser, requireUser } from "./_lib/auth";

const MAX_MESSAGE_LEN = 4000;
const MAX_MESSAGES_PER_CONVO = 200;

export const getUserConversation = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
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
    const userId = await requireUser(ctx);

    if (args.role !== "user" && args.role !== "assistant" && args.role !== "system") {
      throw new Error("Role tidak valid");
    }
    const content = args.content.slice(0, MAX_MESSAGE_LEN);

    const conversation = await ctx.db
      .query("chatConversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const newMessage = {
      id: crypto.randomUUID(),
      role: args.role,
      content,
      timestamp: Date.now(),
    };

    if (conversation) {
      const updatedMessages = [...conversation.messages, newMessage].slice(-MAX_MESSAGES_PER_CONVO);
      await ctx.db.patch(conversation._id, { messages: updatedMessages });
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
    const userId = await requireUser(ctx);
    const conversation = await ctx.db
      .query("chatConversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (conversation) {
      await ctx.db.patch(conversation._id, { messages: [] });
    }
  },
});
