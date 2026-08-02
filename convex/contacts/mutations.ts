import { mutation, internalMutation, type MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "../_shared/auth";
import { makeBulkDelete } from "../_shared/bulkDelete";
import { requireLen, capLen } from "../_shared/validate";
import { enforceRateLimit } from "../_shared/rateLimit";
import { MCP_WRITE_LIMIT, MCP_WRITE_DAILY_LIMIT } from "../mcp/data/limits";
import type { Id } from "../_generated/dataModel";

/** Mirrors the `role` union on the public mutations — the MCP path takes a
 *  plain string off the wire, so the whitelist has to exist as data too. */
const ROLE_WHITELIST = new Set(["recruiter", "mentor", "peer", "other"]);

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

// ---------------------------------------------------------------------------
// MCP (convex/mcp/tools/contacts.ts). These duplicate the guards above rather
// than reuse them because an MCP request carries no @convex-dev/auth session:
// `requireUser` throws and `requireOwnedDoc` calls it, so identity arrives as
// an explicit `userId` resolved from the bearer token and every document is
// re-checked against it here.
// ---------------------------------------------------------------------------

/** Throws the same "not found" the UI shows for a deleted row — a distinct
 *  "forbidden" would confirm to a guesser which ids exist. */
async function mcpOwned(
  ctx: MutationCtx,
  contactId: Id<"contacts">,
  userId: Id<"users">,
) {
  const doc = await ctx.db.get(contactId);
  if (!doc || doc.userId !== userId) throw new Error("Kontak tidak ditemukan");
  return doc;
}

/** An MCP token outlives any browser tab and drives writes unattended. */
async function mcpQuota(ctx: MutationCtx, userId: Id<"users">) {
  await enforceRateLimit(ctx, userId, MCP_WRITE_LIMIT);
  await enforceRateLimit(ctx, userId, MCP_WRITE_DAILY_LIMIT);
}

function assertRole(role: string): string {
  if (!ROLE_WHITELIST.has(role)) throw new Error("Role tidak valid");
  return role;
}

export const mcpCreate = internalMutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    role: v.string(),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    favorite: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await mcpQuota(ctx, args.userId);

    const contactId = await ctx.db.insert("contacts", {
      userId: args.userId,
      name: requireLen("Nama", args.name, 200),
      role: assertRole(args.role),
      company: capLen("Perusahaan", args.company, 200),
      position: capLen("Posisi", args.position, 200),
      email: capLen("Email", args.email, 320),
      phone: capLen("Telepon", args.phone, 50),
      linkedinUrl: capLen("LinkedIn", args.linkedinUrl, 500),
      notes: capLen("Catatan", args.notes, 2000),
      favorite: args.favorite ?? false,
      lastInteraction: Date.now(),
    });
    return { contact_id: contactId, name: args.name };
  },
});

export const mcpUpdate = internalMutation({
  args: {
    userId: v.id("users"),
    contactId: v.id("contacts"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    favorite: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await mcpQuota(ctx, args.userId);
    await mcpOwned(ctx, args.contactId, args.userId);

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = requireLen("Nama", args.name, 200);
    if (args.role !== undefined) patch.role = assertRole(args.role);
    if (args.company !== undefined) patch.company = capLen("Perusahaan", args.company, 200);
    if (args.position !== undefined) patch.position = capLen("Posisi", args.position, 200);
    if (args.email !== undefined) patch.email = capLen("Email", args.email, 320);
    if (args.phone !== undefined) patch.phone = capLen("Telepon", args.phone, 50);
    if (args.linkedinUrl !== undefined) patch.linkedinUrl = capLen("LinkedIn", args.linkedinUrl, 500);
    if (args.notes !== undefined) patch.notes = capLen("Catatan", args.notes, 2000);
    if (args.favorite !== undefined) patch.favorite = args.favorite;

    await ctx.db.patch(args.contactId, patch);
    return { contact_id: args.contactId, updated: Object.keys(patch) };
  },
});

export const mcpDelete = internalMutation({
  args: { userId: v.id("users"), contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    await mcpQuota(ctx, args.userId);
    const contact = await mcpOwned(ctx, args.contactId, args.userId);
    await ctx.db.delete(args.contactId);
    return { deleted: true, name: contact.name };
  },
});

export const mcpLogInteraction = internalMutation({
  args: { userId: v.id("users"), contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    await mcpQuota(ctx, args.userId);
    await mcpOwned(ctx, args.contactId, args.userId);
    const at = Date.now();
    await ctx.db.patch(args.contactId, { lastInteraction: at });
    return { contact_id: args.contactId, last_interaction: new Date(at).toISOString() };
  },
});
