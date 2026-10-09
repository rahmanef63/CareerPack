import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { issueUpload, registerUploadedFile } from "./uploads";
import { requireUser } from "../_shared/auth";
import type { Id } from "../_generated/dataModel";

const MAX_FILENAME_LEN = 200;

function trimLen(field: string, value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) {
    throw new Error(`${field} 1-${max} karakter`);
  }
  return trimmed;
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await issueUpload(ctx, await requireUser(ctx));
  },
});

export const saveFile = mutation({
  args: {
    storageId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
  },
  returns: v.id("files"),
  handler: async (ctx, args) => registerUploadedFile(ctx, await requireUser(ctx), args),
});

/**
 * Library metadata patch — tags + note. The owner check uses the
 * existing tenant gating; non-owners get the same "not found" error
 * as elsewhere to avoid leaking existence.
 */
export const updateFileMetadata = mutation({
  args: {
    fileId: v.id("files"),
    tags: v.optional(v.array(v.string())),
    note: v.optional(v.string()),
    fileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const file = await ctx.db.get(args.fileId);
    if (!file || file.tenantId !== userId.toString()) {
      throw new Error("File tidak ditemukan");
    }
    const patch: Record<string, unknown> = {};
    if (args.tags !== undefined) {
      const cleaned = Array.from(
        new Set(
          args.tags
            .map((t) => t.trim().toLowerCase())
            .filter((t) => t.length > 0 && t.length <= 30),
        ),
      ).slice(0, 20);
      patch.tags = cleaned;
    }
    if (args.note !== undefined) {
      const trimmed = args.note.trim();
      patch.note = trimmed.length > 0 ? trimmed.slice(0, 500) : undefined;
    }
    if (args.fileName !== undefined) {
      const trimmed = trimLen("Nama file", args.fileName, MAX_FILENAME_LEN);
      patch.fileName = trimmed;
    }
    await ctx.db.patch(args.fileId, patch);
  },
});

export const deleteFile = mutation({
  args: {
    fileId: v.optional(v.id("files")),
    storageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (!args.fileId && !args.storageId) {
      throw new Error("fileId atau storageId wajib diisi");
    }

    let record: { _id: Id<"files">; storageId: string; tenantId: string } | null = null;
    if (args.fileId) {
      const r = await ctx.db.get(args.fileId);
      if (r) record = { _id: r._id, storageId: r.storageId, tenantId: r.tenantId };
    } else if (args.storageId) {
      const r = await ctx.db
        .query("files")
        .withIndex("by_storage", (q) => q.eq("storageId", args.storageId!))
        .first();
      if (r) record = { _id: r._id, storageId: r.storageId, tenantId: r.tenantId };
    }

    if (!record) throw new Error("File tidak ditemukan");
    if (record.tenantId !== userId.toString()) {
      throw new Error("File tidak ditemukan");
    }

    const owners = await ctx.db.query("files").withIndex("by_storage", q => q.eq("storageId", record!.storageId)).take(2);
    if (owners.length !== 1) throw new Error("File perlu diperiksa administrator");
    await ctx.db.delete(record._id);
    try {
      await ctx.storage.delete(record.storageId);
    } catch {
      // benign — storage blob already gone or transient error
    }
  },
});
