import { mutation, internalMutation, type MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { requireUser } from "../_shared/auth";
import { enforceRateLimit } from "../_shared/rateLimit";
import { MCP_WRITE_LIMIT, MCP_WRITE_DAILY_LIMIT } from "../mcp/data/limits";
import type { Id } from "../_generated/dataModel";

const MAX_TYPE_LEN = 50;
const MAX_COUNTRY_LEN = 100;
const MAX_ID_LEN = 100;
const MAX_NAME_LEN = 200;
const MAX_CATEGORY_LEN = 50;
const MAX_SUBCATEGORY_LEN = 50;
const MAX_NOTES_LEN = 2000;
const MAX_DATE_LEN = 32;
const MAX_DOCS = 200;

function trimLen(field: string, value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) {
    throw new Error(`${field} 1-${max} karakter`);
  }
  return trimmed;
}

export const seedDocumentChecklist = mutation({
  args: {
    type: v.string(),
    country: v.optional(v.string()),
    template: v.array(v.object({
      id: v.string(),
      name: v.string(),
      category: v.string(),
      subcategory: v.optional(v.string()),
      required: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const type = trimLen("Tipe", args.type, MAX_TYPE_LEN);
    const country = args.country
      ? trimLen("Negara", args.country, MAX_COUNTRY_LEN)
      : undefined;

    if (args.template.length === 0 || args.template.length > MAX_DOCS) {
      throw new Error(`Template 1-${MAX_DOCS} dokumen`);
    }

    const documents = args.template.map((doc) => ({
      id: trimLen("ID dokumen", doc.id, MAX_ID_LEN),
      name: trimLen("Nama dokumen", doc.name, MAX_NAME_LEN),
      category: trimLen("Kategori", doc.category, MAX_CATEGORY_LEN),
      subcategory: doc.subcategory
        ? trimLen("Subkategori", doc.subcategory, MAX_SUBCATEGORY_LEN)
        : undefined,
      required: doc.required,
      completed: false,
      notes: "",
    }));

    const existing = await ctx.db
      .query("documentChecklists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      const prior = new Map(existing.documents.map((d) => [d.id, d]));
      const merged = documents.map((doc) => {
        const old = prior.get(doc.id);
        if (!old) return doc;
        return {
          ...doc,
          completed: old.completed,
          notes: old.notes,
          expiryDate: old.expiryDate,
        };
      });
      const progress = Math.round(
        (merged.filter((d) => d.completed).length / merged.length) * 100,
      );
      await ctx.db.patch(existing._id, {
        type,
        country,
        documents: merged,
        progress,
      });
      return existing._id;
    }

    return await ctx.db.insert("documentChecklists", {
      userId,
      type,
      country,
      documents,
      progress: 0,
    });
  },
});

/** Shared by the UI mutation and the MCP one below — the two differ only in
 *  how the caller's identity was established, never in what they may write. */
async function applyDocumentStatus(
  ctx: MutationCtx,
  userId: Id<"users">,
  args: {
    documentId: string;
    completed: boolean;
    notes?: string;
    expiryDate?: string;
  },
) {
  const documentId = trimLen("ID dokumen", args.documentId, MAX_ID_LEN);
  const notes = args.notes !== undefined
    ? args.notes.trim().slice(0, MAX_NOTES_LEN)
    : undefined;
  const expiryDate = args.expiryDate !== undefined
    ? args.expiryDate.trim().slice(0, MAX_DATE_LEN)
    : undefined;

  const checklist = await ctx.db
    .query("documentChecklists")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (!checklist) throw new Error("Checklist tidak ditemukan");

  let touched = false;
  const updatedDocuments = checklist.documents.map((doc) => {
    if (doc.id === documentId) {
      touched = true;
      return {
        ...doc,
        completed: args.completed,
        notes: notes !== undefined ? notes : doc.notes,
        expiryDate: expiryDate !== undefined ? expiryDate : doc.expiryDate,
      };
    }
    return doc;
  });

  if (!touched) throw new Error("Dokumen tidak ditemukan");

  const completedCount = updatedDocuments.filter((doc) => doc.completed).length;
  const progress = Math.round((completedCount / updatedDocuments.length) * 100);

  await ctx.db.patch(checklist._id, {
    documents: updatedDocuments,
    progress,
  });
  return { document_id: documentId, completed: args.completed, progress };
}

export const updateDocumentStatus = mutation({
  args: {
    documentId: v.string(),
    completed: v.boolean(),
    notes: v.optional(v.string()),
    expiryDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await applyDocumentStatus(ctx, userId, args);
  },
});

export const resetDocumentChecklist = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("documentChecklists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

/**
 * Instantiate the user's personal `documentChecklists` row from a
 * country's `documentTemplates` master list. Preserves prior
 * completion / notes / expiry on matching document ids (same merge
 * logic as `seedDocumentChecklist`).
 *
 * Idempotent — re-running same country re-merges over current state.
 */
async function applyCountryTemplate(
  ctx: MutationCtx,
  userId: Id<"users">,
  country: string,
) {
  const template = await ctx.db
    .query("documentTemplates")
    .withIndex("by_country", (q) => q.eq("country", country))
    .first();
  if (!template) {
    throw new Error(`Template untuk negara "${country}" tidak ditemukan`);
  }

  const existing = await ctx.db
    .query("documentChecklists")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  const prior = new Map(
    (existing?.documents ?? []).map((d) => [d.id, d]),
  );

  let preserved = 0;
  const documents = template.documents.map((td) => {
    const old = prior.get(td.id);
    if (old) {
      preserved++;
      return {
        id: td.id,
        name: td.title,
        category: td.category,
        subcategory: td.subcategory,
        required: td.required,
        completed: old.completed,
        notes: old.notes,
        expiryDate: old.expiryDate,
      };
    }
    return {
      id: td.id,
      name: td.title,
      category: td.category,
      subcategory: td.subcategory,
      required: td.required,
      completed: false,
      notes: "",
    };
  });

  const completedCount = documents.filter((d) => d.completed).length;
  const progress = Math.round((completedCount / documents.length) * 100);

  if (existing) {
    await ctx.db.patch(existing._id, {
      type: "country-template",
      country: template.country,
      documents,
      progress,
    });
    return {
      checklistId: existing._id,
      inserted: documents.length - preserved,
      preserved,
    };
  }

  const checklistId = await ctx.db.insert("documentChecklists", {
    userId,
    type: "country-template",
    country: template.country,
    documents,
    progress: 0,
  });
  return {
    checklistId,
    inserted: documents.length,
    preserved: 0,
  };
}

export const instantiateFromTemplate = mutation({
  args: { country: v.string() },
  returns: v.object({
    checklistId: v.id("documentChecklists"),
    inserted: v.number(),
    preserved: v.number(),
  }),
  handler: async (ctx, { country }) => {
    const userId = await requireUser(ctx);
    return await applyCountryTemplate(ctx, userId, country);
  },
});

// ---------------------------------------------------------------------------
// MCP (convex/mcp/tools/documents.ts). `requireUser` throws in an MCP request
// — no @convex-dev/auth session — so the user id arrives as an explicit arg
// resolved from the bearer token and scopes the `by_user` lookups below.
// ---------------------------------------------------------------------------

/** An MCP token outlives any browser tab and drives writes unattended. */
async function mcpQuota(ctx: MutationCtx, userId: Id<"users">) {
  await enforceRateLimit(ctx, userId, MCP_WRITE_LIMIT);
  await enforceRateLimit(ctx, userId, MCP_WRITE_DAILY_LIMIT);
}

export const mcpSetStatus = internalMutation({
  args: {
    userId: v.id("users"),
    documentId: v.string(),
    completed: v.boolean(),
    notes: v.optional(v.string()),
    expiryDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await mcpQuota(ctx, args.userId);
    return await applyDocumentStatus(ctx, args.userId, args);
  },
});

export const mcpStartFromCountry = internalMutation({
  args: { userId: v.id("users"), country: v.string() },
  handler: async (ctx, args) => {
    await mcpQuota(ctx, args.userId);
    // `documentTemplates.country` is stored uppercased; a model that sends
    // "jp" would otherwise get "template tidak ditemukan" for a country the
    // catalog does list.
    const country = args.country.trim().toUpperCase();
    const result = await applyCountryTemplate(ctx, args.userId, country);
    return { country, inserted: result.inserted, preserved: result.preserved };
  },
});
