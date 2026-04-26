import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser } from "../_shared/auth";

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

export const updateDocumentStatus = mutation({
  args: {
    documentId: v.string(),
    completed: v.boolean(),
    notes: v.optional(v.string()),
    expiryDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

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
