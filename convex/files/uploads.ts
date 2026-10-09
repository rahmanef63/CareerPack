import { internalMutation, httpAction, type MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { randomToken } from "../_shared/pkce";
import { sha256Hex } from "../_shared/clientIp";
import { requireEnv } from "../_shared/env";
import { isAllowedOrigin } from "../_shared/origin";
import { enforceRateLimit, enforceGlobalWriteLimit } from "../_shared/rateLimit";
import { assertAllowedFile, MAX_DOC_BYTES } from "./allowlist";
import { sniffMime } from "../mcp/_vendor/mcpFiles";

const TTL = 3_600_000;

/** A one-use capability binds accepted bytes to the requesting account. */
export async function issueUpload(ctx: MutationCtx, userId: Id<"users">): Promise<string> {
  const base = requireEnv("CONVEX_SITE_URL").replace(/\/+$/, "");
  await enforceRateLimit(ctx, userId, { key: "files:upload", max: 20, windowMs: TTL });
  await enforceGlobalWriteLimit(ctx, "files:upload", 200);
  const token = randomToken();
  const id = await ctx.db.insert("uploadIntents", { userId, tokenHash: await sha256Hex(token), expiresAt: Date.now() + TTL });
  await ctx.scheduler.runAfter(TTL, internal.files.uploads.cleanup, { id });
  return `${base}/files/upload?t=${token}`;
}

export const claim = internalMutation({
  args: { tokenHash: v.string() }, returns: v.union(v.null(), v.id("uploadIntents")),
  handler: async (ctx, { tokenHash }) => {
    const row = await ctx.db.query("uploadIntents").withIndex("by_token", q => q.eq("tokenHash", tokenHash)).unique();
    if (!row || row.claimedAt !== undefined || row.expiresAt <= Date.now() || !(await ctx.db.get(row.userId))) return null;
    await ctx.db.patch(row._id, { claimedAt: Date.now() });
    return row._id;
  },
});

export const finish = internalMutation({
  args: { id: v.id("uploadIntents"), storageId: v.id("_storage"), fileType: v.string(), fileSize: v.number() }, returns: v.null(),
  handler: async (ctx, { id, storageId, fileType, fileSize }) => {
    const row = await ctx.db.get(id);
    if (!row || row.claimedAt === undefined || row.storageId || row.expiresAt <= Date.now()) throw new Error("Upload kedaluwarsa");
    assertAllowedFile(fileType, fileSize);
    await ctx.db.patch(id, { storageId, fileType, fileSize });
    return null;
  },
});

/** Only the authenticated MCP byte ingester calls this, after content checks. */
export const stageTrustedUpload = internalMutation({
  args: { userId: v.id("users"), storageId: v.id("_storage"), fileType: v.string(), fileSize: v.number() }, returns: v.null(),
  handler: async (ctx, args) => {
    await enforceRateLimit(ctx, args.userId, { key: "files:upload", max: 20, windowMs: TTL });
    await enforceGlobalWriteLimit(ctx, "files:upload", 200);
    assertAllowedFile(args.fileType, args.fileSize);
    const id = await ctx.db.insert("uploadIntents", { ...args, tokenHash: randomToken(), claimedAt: Date.now(), expiresAt: Date.now() + TTL });
    await ctx.scheduler.runAfter(TTL, internal.files.uploads.cleanup, { id });
    return null;
  },
});

export const cleanup = internalMutation({
  args: { id: v.id("uploadIntents") }, returns: v.null(),
  handler: async (ctx, { id }) => {
    const row = await ctx.db.get(id);
    if (!row) return null;
    if (row.storageId) await ctx.storage.delete(row.storageId);
    await ctx.db.delete(id);
    return null;
  },
});

/** The browser and MCP registration paths share this ownership boundary. */
export async function registerUploadedFile(ctx: MutationCtx, userId: Id<"users">, args: {
  storageId: string; fileName: string; fileType: string; fileSize: number;
}): Promise<Id<"files">> {
  const existing = await ctx.db.query("files").withIndex("by_storage", q => q.eq("storageId", args.storageId)).take(2);
  if (existing.length) {
    if (existing.length !== 1 || existing[0].uploadedBy !== userId) throw new Error("File tidak ditemukan");
    return existing[0]._id;
  }
  const upload = await ctx.db.query("uploadIntents").withIndex("by_storage", q => q.eq("storageId", args.storageId)).unique();
  if (!upload || upload.userId !== userId || upload.expiresAt <= Date.now()) throw new Error("File tidak ditemukan — unggah ulang");
  const meta = await ctx.db.system.get(upload.storageId as Id<"_storage">);
  if (!meta || !upload.fileType || upload.fileType !== args.fileType || upload.fileSize !== args.fileSize || meta.size !== args.fileSize || (meta.contentType !== undefined && meta.contentType !== upload.fileType)) throw new Error("Metadata file tidak sesuai");
  assertAllowedFile(upload.fileType, meta.size);
  const name = args.fileName.trim();
  if (!name || name.length > 200) throw new Error("Nama file 1-200 karakter");
  const id = await ctx.db.insert("files", {
    storageId: args.storageId, fileName: name, fileType: upload.fileType,
    fileSize: meta.size, uploadedBy: userId, tenantId: userId.toString(), createdAt: Date.now(),
  });
  // Registration consumes the pending row; the scheduled cleanup becomes a no-op.
  await ctx.db.delete(upload._id);
  return id;
}

export const handleUpload = httpAction(async (ctx, request) => {
  const origin = request.headers.get("origin");
  const headers: Record<string, string> = { "Cache-Control": "no-store", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
  if (isAllowedOrigin(origin)) { headers["Access-Control-Allow-Origin"] = origin!; headers.Vary = "Origin"; }
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (origin && !isAllowedOrigin(origin)) return new Response("Forbidden", { status: 403, headers });
  const token = new URL(request.url).searchParams.get("t");
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return new Response("Upload tidak valid", { status: 403, headers });
  const id = await ctx.runMutation(internal.files.uploads.claim, { tokenHash: await sha256Hex(token) });
  if (!id) return new Response("Upload tidak berlaku", { status: 403, headers });
  let storageId: Id<"_storage"> | undefined;
  try {
    // Content-Length is only advisory; streamed bytes enforce the real ceiling.
    if (Number(request.headers.get("content-length")) > MAX_DOC_BYTES) throw new Error("File terlalu besar");
    const reader = request.body?.getReader();
    if (!reader) throw new Error("File kosong");
    const chunks: Uint8Array[] = [];
    let size = 0;
    let timer: ReturnType<typeof setTimeout>;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => { void reader.cancel(); reject(new Error("Upload terlalu lama")); }, 60_000);
    });
    try {
      while (true) {
        const { value, done } = await Promise.race([reader.read(), deadline]);
        if (done) break;
        size += value.byteLength;
        if (size > MAX_DOC_BYTES) throw new Error("File terlalu besar");
        chunks.push(value);
      }
    } finally { clearTimeout(timer!); void reader.cancel(); }
    const blob = new Blob(chunks as BlobPart[]);
    const type = sniffMime(new Uint8Array(await blob.slice(0, 512).arrayBuffer()));
    if (!type || type !== request.headers.get("content-type")?.split(";")[0].trim()) throw new Error("Isi file tidak sesuai tipe");
    assertAllowedFile(type, size);
    storageId = await ctx.storage.store(blob.slice(0, size, type));
    await ctx.runMutation(internal.files.uploads.finish, { id, storageId, fileType: type, fileSize: size });
    return new Response(JSON.stringify({ storageId }), { headers: { ...headers, "Content-Type": "application/json" } });
  } catch {
    if (storageId) await ctx.storage.delete(storageId);
    await ctx.runMutation(internal.files.uploads.cleanup, { id });
    return new Response("File ditolak atau upload gagal", { status: 400, headers });
  }
});
