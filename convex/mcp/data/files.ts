import { internalQuery, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { enforceRateLimit } from "../../_shared/rateLimit";
import { assertShortText } from "../../_shared/validate";
import { MCP_WRITE_LIMIT, MCP_WRITE_DAILY_LIMIT } from "./limits";

/**
 * Data layer for convex/mcp/tools/files.ts. Internal only, `userId` is an
 * argument and is re-checked — see convex/mcp/data/cv.ts.
 *
 * Two things are deliberately absent from every payload here:
 *   - `storageId`. It is the only thing needed to mint a download URL for a
 *     blob, so it must not land in a third party's transcript. Tools address
 *     files by their `files` row id instead, which is useless outside an
 *     ownership check.
 *   - the signed URL itself, for the same reason and more so.
 * Uploads are absent too: they need a binary PUT to a one-shot URL, which is
 * not something a JSON-RPC tool call can do.
 *
 * Ownership on this table is `tenantId === userId.toString()`, NOT a `userId`
 * field — see the long note on `tenantId` in convex/files/schema.ts. The
 * comparison is against the string form; comparing the Id directly silently
 * never matches.
 */

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
