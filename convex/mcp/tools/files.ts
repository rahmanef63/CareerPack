import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { ToolDef } from "../types";
import {
  mintFileToken,
  FILE_URL_TTL_SECONDS,
} from "../../_shared/signedFileUrl";
import { requireEnv } from "../../_shared/env";

/**
 * MCP tools for the `files` domain — the Content Library, where uploaded
 * PDFs and images live.
 *
 * Read the contract in convex/mcp/tools/index.ts first. The short version:
 * `userId` arrives from the access token, never from `args`, and every
 * `internal.mcp.data.files.*` function re-checks ownership — on this table
 * that is `tenantId === userId.toString()`, see convex/files/schema.ts.
 *
 * No tool returns a raw storageId — it is enough to fetch the blob from
 * anywhere, forever, and everything a tool returns is copied into a third
 * party's transcript. Files are addressed by their row id instead, which is
 * useless without the ownership check.
 *
 * `files_read_url` is the one deliberate exception, added on the owner's
 * instruction so an AI host can actually see an image. It does NOT hand out a
 * storage URL: it mints a link that carries its own one-hour expiry, HMAC-bound
 * to the file id and the owner (convex/_shared/signedFileUrl.ts), redeemed
 * through a route that re-checks ownership at fetch time. A leaked transcript
 * therefore goes stale on its own, and the link cannot be edited to point at a
 * different file. Uploading is a two-step dance for the duller reason that a
 * JSON-RPC call cannot carry bytes.
 */

function requireArg(args: Record<string, unknown>, key: string): string {
  const raw = args[key];
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error(`Parameter ${key} wajib diisi.`);
  }
  return raw;
}

function optionalArg(
  args: Record<string, unknown>,
  key: string,
): string | undefined {
  const raw = args[key];
  return typeof raw === "string" ? raw : undefined;
}

export const filesTools: ToolDef[] = [
  {
    name: "files_list",
    description:
      "List every file the user has uploaded to their Content Library: name, MIME type, size in bytes, their tags and note, and when it was added — newest first. Use it to answer 'what have I uploaded' or to find the file_id the other files_* tools need. The CONTENTS are not readable through MCP and neither is a download link, so answer from the name, type and note only; if the user wants what is inside a PDF, ask them to paste it.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: {
      title: "List library files",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId) =>
      await ctx.runQuery(internal.mcp.data.files.listFiles, { userId }),
  },

  {
    name: "files_set_metadata",
    description:
      "Rename a library file or change its tags and note — the tool for tidying up ('tag this one as portfolio', 'rename it to CV 2026'). Send only what changes. tags REPLACE the existing list rather than being added to it, so read files_list first and send the full set; they are lowercased and de-duplicated, up to 20 of 30 characters. Send an empty string as note to clear it. This only touches labels; the file itself is untouched.",
    inputSchema: {
      type: "object",
      properties: {
        file_id: { type: "string", description: "Id from files_list." },
        file_name: {
          type: "string",
          description: "New display name. Max 200 characters.",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "COMPLETE replacement list of tags.",
        },
        note: {
          type: "string",
          description:
            "Free-text note about the file. Max 500 characters; empty string clears it.",
        },
      },
      required: ["file_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Update file metadata",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) => {
      const tags = args.tags;
      if (tags !== undefined && (!Array.isArray(tags) || tags.some((t) => typeof t !== "string"))) {
        throw new Error("Parameter tags harus berupa array teks.");
      }
      return await ctx.runMutation(internal.mcp.data.files.setFileMetadata, {
        userId,
        fileId: requireArg(args, "file_id") as Id<"files">,
        fileName: optionalArg(args, "file_name"),
        tags: tags as string[] | undefined,
        note: optionalArg(args, "note"),
      });
    },
  },

  {
    name: "files_delete",
    description:
      "Permanently delete one file — both the library entry and the stored bytes. This cannot be undone and the file cannot be re-created from anything CareerPack still holds; only call it when the user names that file and asks for it gone. It refuses, naming what it found, if the file is still used as a CV or profile photo, in a portfolio item, or as proof attached to a CV claim, because deleting it there would leave something broken the user cannot fix from here. Detaching it in the app first is the way through.",
    inputSchema: {
      type: "object",
      properties: {
        file_id: { type: "string", description: "Id from files_list." },
      },
      required: ["file_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Delete file",
      readOnlyHint: false,
      // The only tool in this domain that destroys bytes rather than rows.
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.mcp.data.files.deleteFile, {
        userId,
        fileId: requireArg(args, "file_id") as Id<"files">,
      }),
  },

  {
    name: "files_upload_url",
    description:
      "Step 1 of 2 for putting a NEW file in the Content Library. Returns a one-shot upload_url; PUT the raw bytes to it with the file's Content-Type, read the storage_id out of the JSON response, then call files_register with that storage_id to make it a library entry. Nothing is saved until you call files_register — an upload_url you never use leaves no trace. Images MUST be image/webp and at most 10 MB; documents MUST be application/pdf and at most 50 MB. Those are the same limits the app enforces, so converting a PNG or JPEG to WebP first is on you.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: {
      title: "Get upload URL",
      readOnlyHint: false,
      destructiveHint: false,
      // A second call mints a second URL — harmless, but not the same answer.
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId) =>
      await ctx.runMutation(internal.mcp.data.files.uploadUrl, { userId }),
  },

  {
    name: "files_register",
    description:
      "Step 2 of 2: turn bytes you already PUT to a files_upload_url into a Content Library entry the user can see and reuse. storage_id is the value the upload response returned. file_name is what the user will see in their library — give it a real name, not 'upload.webp'. file_type must match what you uploaded (image/webp or application/pdf) and file_size is the byte count. Refuses if the blob was never uploaded, so call it after the PUT succeeds, not before.",
    inputSchema: {
      type: "object",
      properties: {
        storage_id: { type: "string", description: "From the upload response." },
        file_name: { type: "string", description: "Display name. Max 200 characters." },
        file_type: {
          type: "string",
          description: "MIME type: image/webp or application/pdf.",
        },
        file_size: { type: "number", description: "Size in bytes." },
      },
      required: ["storage_id", "file_name", "file_type", "file_size"],
      additionalProperties: false,
    },
    annotations: {
      title: "Register uploaded file",
      readOnlyHint: false,
      destructiveHint: false,
      // Re-registering the same storage_id returns the existing row.
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.mcp.data.files.registerFile, {
        userId,
        storageId: requireArg(args, "storage_id"),
        fileName: requireArg(args, "file_name"),
        fileType: requireArg(args, "file_type"),
        fileSize: Number(args.file_size),
      }),
  },

  {
    name: "files_read_url",
    description:
      "Get a temporary link to the actual contents of one library file, so you can look at an image or hand the user a preview. The link EXPIRES ONE HOUR after it is issued and only works for this user's own files — treat it as short-lived, do not store it, and mint a fresh one rather than reusing an old one. Ask for it only when you genuinely need to see the file; the name, type and note from files_list answer most questions on their own.",
    inputSchema: {
      type: "object",
      properties: {
        file_id: { type: "string", description: "Id from files_list." },
      },
      required: ["file_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Get temporary file link",
      readOnlyHint: true,
      destructiveHint: false,
      // A fresh token each call, so the answer differs every time.
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) => {
      const meta = await ctx.runQuery(internal.mcp.data.files.readToken, {
        userId,
        fileId: requireArg(args, "file_id") as Id<"files">,
      });
      const { token, expiresAt } = await mintFileToken({
        fileId: meta.fileId,
        userId: meta.userId,
      });
      // siteUrl, not the .convex.cloud origin: the redeem route lives on the
      // HTTP router, which is served from the .convex.site host.
      const base = requireEnv("CONVEX_SITE_URL").replace(/\/+$/, "");
      return {
        url: `${base}/files/read?t=${encodeURIComponent(token)}`,
        file_name: meta.file_name,
        file_type: meta.file_type,
        expires_at: new Date(expiresAt).toISOString(),
        expires_in_seconds: FILE_URL_TTL_SECONDS,
      };
    },
  },
];
