import { internalQuery, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { enforceRateLimit } from "../../_shared/rateLimit";
import { assertShortText } from "../../_shared/validate";
import { MCP_WRITE_LIMIT, MCP_WRITE_DAILY_LIMIT } from "./limits";
// Shared with the app's own upload path so the two cannot drift.
import { assertAllowedFile } from "../../files/allowlist";

/**
 * Everything that pins a storageId and would break if the blob vanished:
 * portfolio covers + media, CV avatars, the profile avatar, truth-ledger
 * proofs. The first three are the set files/queries.listMyFiles shows in the
 * library — kept in sync by hand because that query resolves signed URLs this
 * layer must not touch.
 */
async function referencesTo(
  ctx: MutationCtx,
  userId: Id<"users">,
  storageId: string,
): Promise<string[]> {
  const labels: string[] = [];

  const portfolio = await ctx.db
    .query("portfolioItems")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const item of portfolio) {
    if (
      item.coverStorageId === storageId ||
      (item.media ?? []).some((m) => m.storageId === storageId)
    ) {
      labels.push(`Portofolio: ${item.title}`);
    }
  }

  const cvs = await ctx.db
    .query("cvs")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const cv of cvs) {
    if (cv.personalInfo.avatarStorageId === storageId) {
      labels.push(`CV: ${cv.title}`);
    }
  }

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  if (profile?.avatarStorageId === storageId) labels.push("Foto profil");

  // Truth-ledger proof (ijazah, sertifikat) — the one pin listMyFiles does
  // NOT surface, and the only one with no repair: `truthAtoms` is append-only
  // (convex/engine/schema.ts), so a user cannot re-attach the evidence to the
  // claim it backs, only supersede the claim itself.
  const atoms = await ctx.db
    .query("truthAtoms")
    .withIndex("by_user_cv", (q) => q.eq("userId", userId))
    .collect();
  for (const atom of atoms) {
    if (atom.proofStorageId === storageId) {
      labels.push(`Bukti klaim: ${atom.claim.slice(0, 60)}`);
    }
  }

  return labels;
}

export const listFiles = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("files")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.userId.toString()))
      .collect();
    return {
      items: rows
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((f) => ({
          file_id: f._id,
          file_name: f.fileName,
          file_type: f.fileType,
          file_size: f.fileSize,
          tags: f.tags ?? [],
          note: f.note ?? null,
          created_at: new Date(f.createdAt).toISOString(),
        })),
      total: rows.length,
    };
  },
});

export const setFileMetadata = internalMutation({
  args: {
    userId: v.id("users"),
    fileId: v.id("files"),
    fileName: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);

    const file = await ctx.db.get(args.fileId);
    if (!file || file.tenantId !== args.userId.toString()) {
      throw new Error("File tidak ditemukan");
    }

    const patch: Record<string, unknown> = {};
    if (args.fileName !== undefined) {
      const name = assertShortText(args.fileName, 200, "Nama file");
      if (name.length === 0) throw new Error("Nama file tidak boleh kosong");
      patch.fileName = name;
    }
    if (args.tags !== undefined) {
      patch.tags = Array.from(
        new Set(
          args.tags
            .map((t) => t.trim().toLowerCase())
            .filter((t) => t.length > 0 && t.length <= 30),
        ),
      ).slice(0, 20);
    }
    if (args.note !== undefined) {
      const note = assertShortText(args.note, 500, "Catatan");
      patch.note = note.length > 0 ? note : undefined;
    }
    if (Object.keys(patch).length === 0) {
      throw new Error("Tidak ada field yang diubah");
    }

    await ctx.db.patch(args.fileId, patch);
    return {
      file_id: args.fileId,
      file_name: patch.fileName ?? file.fileName,
      tags: patch.tags ?? file.tags ?? [],
      // `in`, not `??`: clearing the note sets `patch.note` to undefined, and
      // a nullish fallback would echo the note that was just deleted.
      note: ("note" in patch ? patch.note : file.note) ?? null,
    };
  },
});

export const deleteFile = internalMutation({
  args: { userId: v.id("users"), fileId: v.id("files") },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);

    const file = await ctx.db.get(args.fileId);
    if (!file || file.tenantId !== args.userId.toString()) {
      throw new Error("File tidak ditemukan");
    }

    // The blob goes with the row, and nothing else re-uploads it. A CV whose
    // avatar this was renders a broken image forever, and the model cannot
    // see that from the listing — so refuse instead, and let the user detach
    // it in the app where they can see what they are breaking.
    const used = await referencesTo(ctx, args.userId, file.storageId);
    if (used.length > 0) {
      throw new Error(
        `File masih dipakai oleh ${used.join(", ")}. Lepaskan dulu di aplikasi sebelum menghapus.`,
      );
    }

    await ctx.db.delete(args.fileId);
    try {
      await ctx.storage.delete(file.storageId);
    } catch {
      // Benign: blob already gone. The row is what the app reads, and it is
      // deleted either way — throwing here would report a failure for a
      // deletion that did happen.
    }
    return { deleted: true, file_name: file.fileName };
  },
});

/**
 * One-shot PUT target for an upload. Convex expires these on its own and each
 * accepts a single request, so there is nothing to bound here beyond the write
 * limits — the storageId it returns is useless without `registerFile` below,
 * which is where ownership is actually written.
 */
export const uploadUrl = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);
    return {
      upload_url: await ctx.storage.generateUploadUrl(),
      expires_in_seconds: 60 * 60,
    };
  },
});

/**
 * Record an uploaded blob as a library file. Mirrors `api.files.mutations.saveFile`
 * — same type/size allowlist, same tenant dedup — rather than calling it,
 * because that one reads the caller from the session and MCP has none.
 */
export const registerFile = internalMutation({
  args: {
    userId: v.id("users"),
    storageId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_LIMIT);
    await enforceRateLimit(ctx, args.userId, MCP_WRITE_DAILY_LIMIT);

    const fileName = assertShortText(args.fileName, 200, "Nama file");
    const fileType = assertShortText(args.fileType, 100, "Tipe file");
    if (!Number.isFinite(args.fileSize) || args.fileSize <= 0) {
      throw new Error("Ukuran file tidak valid");
    }
    assertAllowedFile(fileType, args.fileSize);

    // The blob must actually exist. Without this a caller could mint rows for
    // storage ids it guessed, and the listing would show files that 404.
    const meta = await ctx.db.system.get(args.storageId as Id<"_storage">);
    if (!meta) throw new Error("Storage ID tidak ditemukan — unggah dulu ke upload_url.");

    const tenantId = args.userId.toString();
    const existing = await ctx.db
      .query("files")
      .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
      .first();
    // Never hand back another tenant's row for a storageId they also hold.
    if (existing && existing.tenantId === tenantId) {
      return { file_id: existing._id, file_name: existing.fileName, created: false };
    }
    if (existing) throw new Error("Storage ID tidak ditemukan — unggah dulu ke upload_url.");

    const fileId = await ctx.db.insert("files", {
      storageId: args.storageId,
      fileName,
      fileType,
      fileSize: args.fileSize,
      uploadedBy: args.userId,
      tenantId,
      createdAt: Date.now(),
    });
    return { file_id: fileId, file_name: fileName, created: true };
  },
});

/**
 * Ownership check + a token. The URL is assembled by the tool, which knows the
 * deployment origin; this stays a pure query so it can be called from either.
 */
export const readToken = internalQuery({
  args: { userId: v.id("users"), fileId: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file || file.tenantId !== args.userId.toString()) {
      throw new Error("File tidak ditemukan");
    }
    return {
      fileId: args.fileId as string,
      userId: args.userId.toString(),
      file_name: file.fileName,
      file_type: file.fileType,
    };
  },
});

/** Redeem path for the HTTP route. Re-checks ownership: a token is minted for
 *  an hour, and the row can change hands or be deleted inside that hour. */
export const resolveSignedFile = internalQuery({
  args: { fileId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    let file;
    try {
      file = await ctx.db.get(args.fileId as Id<"files">);
    } catch {
      return null;
    }
    if (!file || file.tenantId !== args.userId) return null;
    const url = await ctx.storage.getUrl(file.storageId);
    if (!url) return null;
    return { url, fileName: file.fileName, fileType: file.fileType };
  },
});
