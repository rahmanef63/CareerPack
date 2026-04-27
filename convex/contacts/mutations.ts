import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "../_shared/auth";

export const createContact = mutation({
  args: {
    name: v.string(),
    role: v.union(
      v.literal("recruiter"),
      v.literal("mentor"),
      v.literal("peer"),
      v.literal("other"),
    ),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    avatarEmoji: v.optional(v.string()),
    avatarHue: v.optional(v.string()),
    favorite: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await ctx.db.insert("contacts", {
      userId,
      name: args.name.trim(),
      role: args.role,
      company: args.company,
      position: args.position,
      email: args.email,
      phone: args.phone,
      linkedinUrl: args.linkedinUrl,
      notes: args.notes,
      avatarEmoji: args.avatarEmoji,
      avatarHue: args.avatarHue,
      favorite: args.favorite ?? false,
      lastInteraction: Date.now(),
    });
  },
});

export const updateContact = mutation({
  args: {
    contactId: v.id("contacts"),
    name: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("recruiter"),
        v.literal("mentor"),
        v.literal("peer"),
        v.literal("other"),
      ),
    ),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    avatarEmoji: v.optional(v.string()),
    avatarHue: v.optional(v.string()),
    favorite: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { contactId, ...rest } = args;
    await requireOwnedDoc(ctx, contactId, "Kontak");
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val !== undefined) patch[k] = val;
    }
    await ctx.db.patch(contactId, patch);
  },
});

export const deleteContact = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.contactId, "Kontak");
    await ctx.db.delete(args.contactId);
  },
});

export const bulkDeleteContacts = mutation({
  args: { contactIds: v.array(v.id("contacts")) },
  handler: async (ctx, args) => {
    let deleted = 0;
    for (const id of args.contactIds) {
      await requireOwnedDoc(ctx, id, "Kontak");
      await ctx.db.delete(id);
      deleted++;
    }
    return { deleted };
  },
});

export const toggleContactFavorite = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const c = await requireOwnedDoc(ctx, args.contactId, "Kontak");
    await ctx.db.patch(args.contactId, { favorite: !c.favorite });
  },
});

export const bumpContactInteraction = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.contactId, "Kontak");
    await ctx.db.patch(args.contactId, { lastInteraction: Date.now() });
  },
});
