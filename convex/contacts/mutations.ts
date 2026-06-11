import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "../_shared/auth";
import { makeBulkDelete } from "../_shared/bulkDelete";
import { requireLen, capLen } from "../_shared/validate";

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
      name: requireLen("Nama", args.name, 200),
      role: args.role,
      company: capLen("Perusahaan", args.company, 200),
      position: capLen("Posisi", args.position, 200),
      email: capLen("Email", args.email, 320),
      phone: capLen("Telepon", args.phone, 50),
      linkedinUrl: capLen("LinkedIn", args.linkedinUrl, 500),
      notes: capLen("Catatan", args.notes, 2000),
      avatarEmoji: capLen("Emoji", args.avatarEmoji, 16),
      avatarHue: capLen("Warna", args.avatarHue, 32),
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
    if (rest.name !== undefined) patch.name = requireLen("Nama", rest.name, 200);
    if (rest.role !== undefined) patch.role = rest.role;
    if (rest.company !== undefined) patch.company = capLen("Perusahaan", rest.company, 200);
    if (rest.position !== undefined) patch.position = capLen("Posisi", rest.position, 200);
    if (rest.email !== undefined) patch.email = capLen("Email", rest.email, 320);
    if (rest.phone !== undefined) patch.phone = capLen("Telepon", rest.phone, 50);
    if (rest.linkedinUrl !== undefined) patch.linkedinUrl = capLen("LinkedIn", rest.linkedinUrl, 500);
    if (rest.notes !== undefined) patch.notes = capLen("Catatan", rest.notes, 2000);
    if (rest.avatarEmoji !== undefined) patch.avatarEmoji = capLen("Emoji", rest.avatarEmoji, 16);
    if (rest.avatarHue !== undefined) patch.avatarHue = capLen("Warna", rest.avatarHue, 32);
    if (rest.favorite !== undefined) patch.favorite = rest.favorite;
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

export const bulkDeleteContacts = makeBulkDelete("contacts", "Kontak");

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
