import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { ToolDef } from "../types";

/**
 * MCP tools for the `files` domain — the Content Library, where uploaded
 * PDFs and images live.
 *
 * Read the contract in convex/mcp/tools/index.ts first. The short version:
 * `userId` arrives from the access token, never from `args`, and every
 * `internal.mcp.data.files.*` function re-checks ownership — on this table
 * that is `tenantId === userId.toString()`, see convex/files/schema.ts.
 *
 * No tool ever returns a storageId or a download URL. Either one is enough
 * to fetch the blob from anywhere, and everything a tool returns is copied
 * into a third party's transcript; files are addressed by their row id
 * instead, which is useless without the ownership check. Uploading is absent
 * for a duller reason: it needs a binary PUT to a one-shot URL, which a
 * JSON-RPC tool call cannot do.
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
];
