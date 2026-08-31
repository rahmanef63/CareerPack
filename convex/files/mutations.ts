import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { assertAllowedFile } from "./allowlist";
import { requireUser } from "../_shared/auth";
import type { Id } from "../_generated/dataModel";

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

    const tenantId = userId.toString();

    // Dedup only within the caller's own tenant — never return another
    // tenant's row id for a shared storageId.
    const existing = await ctx.db
      .query("files")
      .withIndex("by_storage", (q) => q.eq("storageId", storageId))
      .first();
    if (existing && existing.tenantId === tenantId) return existing._id;

    // Same-content dedup by (name, size) — the storageId check above only
    // catches re-uploading the exact same blob. It never fires for CV
    // export, which re-renders and re-uploads a brand-new storage blob
    // every time even when the exported document is byte-identical, so the
    // library silently accumulated several rows named e.g.
    // "rahman-fakhrul-ai-full-stack-cv-2026....pdf" (2026-08-31 audit).
    // Name+size isn't a cryptographic guarantee of identical content, but
    // for a personal content library — export re-runs of the same
    // document, not adversarial input — it's the same practical signal a
    // person uses to spot "didn't I already save this?" by eye, and it's
    // free: no content hashing, no schema change, no upload-flow change.
    const byNameAndSize = await ctx.db
      .query("files")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .filter((q) =>
        q.and(
          q.eq(q.field("fileName"), fileName),
          q.eq(q.field("fileSize"), args.fileSize),
        ),
      )
      .first();
    if (byNameAndSize) {
      // The newly-uploaded blob is now an orphan — nothing references it.
      try {
        await ctx.storage.delete(storageId);
      } catch {
        // benign — best-effort cleanup, not worth failing the save over
      }
      return byNameAndSize._id;
    }

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
