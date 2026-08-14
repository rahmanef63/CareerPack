import { internal } from "../../_generated/api";
import { mintFileToken } from "../../_shared/signedFileUrl";
import { requireEnv } from "../../_shared/env";
import type { ActionCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { ToolDef } from "../types";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "../../files/allowlist";
import {
  ConnectorError,
  fileParamsMeta,
  imagePolicy,
  openAIFileSchema,
  receiveFileIntoMedia,
  type FileStoreAdapter,
  type MediaAttachAdapter,
} from "../_vendor/mcpFiles";

/**
 * `portfolio_attach_media` — the file-param path into the portfolio.
 *
 * This is the CareerPack ADAPTER over `@rahmanef/mcp-files`. The shared
 * package owns everything protocol-shaped: the OpenAI file schema, the
 * SSRF-guarded download, the size and content checks. This file owns only what
 * is CareerPack's — where bytes live, what "attach" means, and Indonesian
 * error copy.
 *
 * Why it exists alongside `portfolio_set_media`: that tool takes `file_ids`
 * the caller must already have, and getting one required
 * `files_upload_url` → an HTTP PUT of the bytes → `files_register`. A language
 * model cannot perform the PUT, so that path was never reachable from ChatGPT
 * — only from a human with a terminal. Neither tool is removed; they answer
 * different questions.
 */

const ORIGIN_ENV = "CONVEX_SITE_URL";

/**
 * The shared package ships a permissive `imagePolicy` (png/jpeg/webp/gif/avif).
 * CareerPack is WebP-only ON PURPOSE — every writer converts before upload and
 * the rest of the product assumes nothing else is in the library, which is why
 * `files/allowlist.ts` exists as the single list. Narrowing here rather than
 * widening there is the whole point of the policy being a parameter: the
 * shared layer offers a default, the consumer constrains it.
 *
 * Derived from the allowlist rather than restated, so the two cannot drift.
 */
const CAREERPACK_IMAGE_POLICY = {
  ...imagePolicy,
  allowedMimeTypes: [...ALLOWED_IMAGE_TYPES],
  maxBytes: MAX_IMAGE_BYTES,
};

/** ConnectorError carries a stable machine code; the copy shown to a user in
 *  this product is Indonesian. Translating at the edge is what lets the shared
 *  package stay language-neutral. */
const MESSAGE_ID: Record<string, string> = {
  invalid_input: "Permintaan tidak lengkap.",
  url_rejected: "Lokasi file ditolak. Pastikan tautannya https dan masih berlaku.",
  unsupported_media_type: "Tipe file tidak didukung. Gambar harus image/webp — konversi dulu, lalu lampirkan ulang.",
  payload_too_large: "File terlalu besar. Maksimal 10MB.",
  timeout: "Mengunduh file terlalu lama. Coba lagi.",
  upstream_unavailable: "File tidak bisa diunduh. Tautan sementaranya mungkin sudah kedaluwarsa — lampirkan ulang.",
  internal: "Gagal memasang media. Tidak ada yang berubah.",
};

function toIndonesian(e: unknown): Error {
  if (e instanceof ConnectorError) {
    // Operator-side only. The correlation id is the join key between this line
    // and the sentence the user saw; `internal` never leaves the server.
    console.error(
      JSON.stringify({
        evt: "mcp.attach_media.failed",
        code: e.code,
        correlation_id: e.correlationId ?? null,
        detail: e.internal instanceof Error ? e.internal.message : String(e.internal ?? ""),
      }),
    );
    const base = MESSAGE_ID[e.code] ?? MESSAGE_ID.internal!;
    // The correlation id is the only internal detail that travels: it is
    // meaningless to an attacker and the only way to find the real log line.
    return new Error(e.correlationId ? `${base} (ref ${e.correlationId})` : base);
  }
  return e instanceof Error ? e : new Error(MESSAGE_ID.internal!);
}

/** Bytes → Convex storage → a `files` row, reusing the same registration the
 *  web uploader uses so quota, dedup and the type allowlist all still apply. */
function storeAdapter(ctx: ActionCtx, userId: Id<"users">): FileStoreAdapter {
  return {
    async save(input) {
      const storageId = await ctx.storage.store(
        new Blob([input.bytes as BlobPart], { type: input.mimeType }),
      );
      const row = await ctx.runMutation(internal.mcp.data.files.registerFile, {
        userId,
        storageId,
        fileName: input.fileName,
        fileType: input.mimeType,
        fileSize: input.sizeBytes,
      });
      // Same mint the files_read_url tool uses: an HMAC token bound to one
      // file and one owner, good for an hour.
      const meta = await ctx.runQuery(internal.mcp.data.files.readToken, {
        fileId: row.file_id as Id<"files">,
        userId,
      });
      const { token } = await mintFileToken({ fileId: meta.fileId, userId: meta.userId });
      const base = requireEnv(ORIGIN_ENV).replace(/\/+$/, "");
      return {
        id: row.file_id as string,
        // A signed, expiring link — CareerPack has no permanently public file
        // route, and inventing one here would widen the blast radius of a
        // leaked id far beyond this feature.
        url: `${base}/files/read?t=${encodeURIComponent(token)}`,
        mimeType: input.mimeType,
        fileName: input.fileName,
        sizeBytes: input.sizeBytes,
      };
    },
  };
}

function attachAdapter(ctx: ActionCtx, userId: Id<"users">, caption?: string): MediaAttachAdapter {
  return {
    async attach({ resourceId, media, usage }) {
      const res = await ctx.runMutation(internal.portfolio.mutations.mcpAttachMedia, {
        userId,
        itemId: resourceId as Id<"portfolioItems">,
        fileId: media.id as Id<"files">,
        usage: usage as "thumbnail" | "gallery" | "attachment",
        caption,
      });
      return {
        resourceId,
        mediaId: media.id,
        usage,
        url: media.url,
        // Appending never deletes, so the displaced cover is still attached
        // and putting it back is a second call, not a restore from backup.
        previous: res.previous_cover_storage_id
          ? { mediaId: res.previous_cover_storage_id, url: "" }
          : null,
      };
    },
  };
}

export const portfolioMediaTools: ToolDef[] = [
  {
    name: "portfolio_attach_media",
    description:
      "Attach an image you have generated or the user has provided to one of their portfolio entries, and optionally make it that entry's thumbnail. Use this whenever the user wants a picture on a project — it takes the image directly, so there is no upload step to arrange. Pass usage='thumbnail' to put it on the card, 'gallery' to add it to the entry's images, or 'attachment' for a supporting file. It ADDS to whatever media the entry already has and never removes any, so it is safe to call more than once; use portfolio_set_media instead when the user wants to reorder or remove existing media. The image MUST be image/webp and at most 10MB — this app stores every image as WebP, so convert before attaching; a PNG or JPEG is refused.",
    inputSchema: {
      type: "object",
      properties: {
        item_id: { type: "string", description: "Id from portfolio_list." },
        file: openAIFileSchema() as unknown as Record<string, unknown>,
        usage: {
          type: "string",
          enum: ["thumbnail", "gallery", "attachment"],
          description: "Where the image goes. Defaults to gallery.",
        },
        caption: { type: "string", description: "Optional caption. Max 200 characters." },
      },
      required: ["item_id", "file"],
      additionalProperties: false,
    },
    annotations: {
      title: "Attach an image to a portfolio entry",
      readOnlyHint: false,
      // Two calls with the same image are refused by the mutation rather than
      // duplicating it, but the first call does change state.
      idempotentHint: false,
      // Appends only. Nothing is deleted or overwritten, and a displaced
      // thumbnail stays attached — so this is reversible, unlike
      // portfolio_set_media which replaces the list wholesale.
      destructiveHint: false,
      // A portfolio entry is publicly visible, so its thumbnail is public
      // internet state even though the file belongs to the user.
      openWorldHint: true,
    },
    // Without this ChatGPT never offers a file for `file` and the tool is
    // unreachable for its entire purpose.
    meta: fileParamsMeta(["file"]),
    handler: async (ctx, userId, args) => {
      const itemId = args.item_id;
      const file = args.file as { download_url?: string; file_id?: string } | undefined;
      if (typeof itemId !== "string" || !itemId) throw new Error("item_id wajib diisi");
      if (!file?.download_url || !file?.file_id) throw new Error("file wajib dilampirkan");

      try {
        const result = await receiveFileIntoMedia({
          file: file as { download_url: string; file_id: string; mime_type?: string; file_name?: string },
          resourceId: itemId,
          usage: typeof args.usage === "string" ? args.usage : "gallery",
          store: storeAdapter(ctx, userId),
          attach: attachAdapter(ctx, userId, typeof args.caption === "string" ? args.caption : undefined),
          ingest: { policy: CAREERPACK_IMAGE_POLICY },
        });
        return {
          item_id: result.resourceId,
          file_id: result.mediaId,
          usage: result.usage,
          url: result.url,
          is_thumbnail: result.usage === "thumbnail",
        };
      } catch (e) {
        throw toIndonesian(e);
      }
    },
  },
];
