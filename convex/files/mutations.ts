import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser } from "../_shared/auth";
import type { Id } from "../_generated/dataModel";

const ALLOWED_IMAGE_TYPES = new Set(["image/webp"]);
const ALLOWED_DOC_TYPES = new Set(["application/pdf"]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_DOC_BYTES = 50 * 1024 * 1024;

const MAX_FILENAME_LEN = 200;
const MAX_MIME_LEN = 100;
const MAX_STORAGE_ID_LEN = 200;

function trimLen(field: string, value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) {
    throw new Error(`${field} 1-${max} karakter`);
  }
  return trimmed;
}

function assertAllowedFile(fileType: string, fileSize: number) {
  if (ALLOWED_IMAGE_TYPES.has(fileType)) {
    if (fileSize > MAX_IMAGE_BYTES) {
      throw new Error("Gambar terlalu besar (maks 10 MB)");
    }
    return;
  }
  if (ALLOWED_DOC_TYPES.has(fileType)) {
    if (fileSize > MAX_DOC_BYTES) {
      throw new Error("Dokumen terlalu besar (maks 50 MB)");
    }
    return;
  }
  throw new Error("Tipe file tidak didukung");
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveFile = mutation({
  args: {
    storageId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const storageId = trimLen("Storage ID", args.storageId, MAX_STORAGE_ID_LEN);
    const fileName = trimLen("Nama file", args.fileName, MAX_FILENAME_LEN);
    const fileType = trimLen("Tipe file", args.fileType, MAX_MIME_LEN);

    if (!Number.isFinite(args.fileSize) || args.fileSize <= 0) {
      throw new Error("Ukuran file tidak valid");
    }
    assertAllowedFile(fileType, args.fileSize);

    const existing = await ctx.db
      .query("files")
      .withIndex("by_storage", (q) => q.eq("storageId", storageId))
      .first();
    if (existing) return existing._id;

    const tenantId = userId.toString();

    return await ctx.db.insert("files", {
      storageId,
      fileName,
      fileType,
      fileSize: args.fileSize,
      uploadedBy: userId,
      tenantId,
      createdAt: Date.now(),
    });
  },
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

    await ctx.db.delete(record._id);
    try {
      await ctx.storage.delete(record.storageId);
    } catch {
      // benign — storage blob already gone or transient error
    }
  },
});
