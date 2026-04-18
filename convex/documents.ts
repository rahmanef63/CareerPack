import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { optionalUser, requireUser } from "./_lib/auth";

const defaultDocuments = {
  local: [
    { id: "resume", name: "Updated Resume/CV", category: "Application", required: true },
    { id: "cover-letter", name: "Cover Letter Template", category: "Application", required: true },
    { id: "portfolio", name: "Portfolio/Work Samples", category: "Application", required: false },
    { id: "references", name: "Professional References", category: "Application", required: true },
    { id: "certifications", name: "Relevant Certifications", category: "Credentials", required: false },
    { id: "transcripts", name: "Educational Transcripts", category: "Credentials", required: false },
  ],
  international: [
    { id: "passport", name: "Valid Passport", category: "Identity", required: true },
    { id: "visa", name: "Work Visa/Permit", category: "Legal", required: true },
    { id: "degree-evaluation", name: "Degree Evaluation/Recognition", category: "Education", required: true },
    { id: "language-test", name: "Language Proficiency Test", category: "Skills", required: true },
    { id: "police-clearance", name: "Police Clearance Certificate", category: "Legal", required: true },
    { id: "medical-exam", name: "Medical Examination", category: "Health", required: true },
    { id: "bank-statements", name: "Bank Statements", category: "Financial", required: true },
    { id: "employment-letter", name: "Job Offer Letter", category: "Employment", required: false },
    { id: "insurance", name: "Health Insurance", category: "Health", required: false },
  ],
};

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

export const createDocumentChecklist = mutation({
  args: {
    type: v.string(),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const existing = await ctx.db
      .query("documentChecklists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) await ctx.db.delete(existing._id);

    const documents = defaultDocuments[args.type as keyof typeof defaultDocuments] || [];
    const documentsWithStatus = documents.map((doc) => ({
      ...doc,
      completed: false,
      notes: "",
    }));

    return await ctx.db.insert("documentChecklists", {
      userId,
      type: args.type,
      country: args.country,
      documents: documentsWithStatus,
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

    const checklist = await ctx.db
      .query("documentChecklists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!checklist) throw new Error("Checklist tidak ditemukan");

    const updatedDocuments = checklist.documents.map((doc) => {
      if (doc.id === args.documentId) {
        return {
          ...doc,
          completed: args.completed,
          notes: args.notes || doc.notes,
          expiryDate: args.expiryDate || doc.expiryDate,
        };
      }
      return doc;
    });

    const completedCount = updatedDocuments.filter((doc) => doc.completed).length;
    const progress = Math.round((completedCount / updatedDocuments.length) * 100);

    await ctx.db.patch(checklist._id, {
      documents: updatedDocuments,
      progress,
    });
  },
});
