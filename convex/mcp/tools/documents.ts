import { internal } from "../../_generated/api";
import type { ToolDef } from "../types";

/**
 * MCP tools for the `documents` domain — the checklist of paperwork a job
 * search or a move abroad needs (CV, KTP, ijazah, visa, ...).
 *
 * Read the contract in convex/mcp/tools/index.ts first. The short version:
 * `userId` arrives from the access token, never from `args`, and the
 * `internal.documents.*.mcp*` functions scope every read/write to it.
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
  return typeof raw === "string" && raw.length > 0 ? raw : undefined;
}

export const documentsTools: ToolDef[] = [
  {
    name: "documents_list",
    description:
      "Read the user's document checklist: every item with its document_id, name, category, whether it is required, whether they already have it, notes and expiry date, plus an overall progress percentage. USE THIS FIRST for anything about paperwork — documents_set_status needs a document_id and this is where they come from. Returns null when the user has no checklist yet; in that case offer documents_start_from_country.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: {
      title: "List document checklist",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId) =>
      await ctx.runQuery(internal.documents.queries.mcpGetChecklist, { userId }),
  },

  {
    name: "documents_set_status",
    description:
      "Mark one checklist item as obtained or not — the tool for 'my passport is done', 'I still need the transcript'. Needs a document_id from documents_list; that id is a short template key like 'passport', NOT a database id. Set completed true when the user has the document in hand. notes and expiry_date REPLACE what is stored, so omit them to leave them alone. expiry_date is YYYY-MM-DD and matters for documents that lapse (passport, police record, medical check).",
    inputSchema: {
      type: "object",
      properties: {
        document_id: {
          type: "string",
          description: "document_id from documents_list.",
        },
        completed: {
          type: "boolean",
          description: "True when the user already has this document.",
        },
        notes: {
          type: "string",
          description: "Replaces the stored note when supplied.",
        },
        expiry_date: {
          type: "string",
          description: "YYYY-MM-DD. Replaces the stored expiry when supplied.",
        },
      },
      required: ["document_id", "completed"],
      additionalProperties: false,
    },
    annotations: {
      title: "Set document status",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) => {
      const completed = args.completed;
      if (typeof completed !== "boolean") {
        throw new Error("Parameter completed wajib true atau false.");
      }
      return await ctx.runMutation(internal.documents.mutations.mcpSetStatus, {
        userId,
        documentId: requireArg(args, "document_id"),
        completed,
        notes: optionalArg(args, "notes"),
        expiryDate: optionalArg(args, "expiry_date"),
      });
    },
  },

  {
    name: "documents_list_countries",
    description:
      "List the ready-made country document checklists the app ships with — each entry's two-letter country code, label, and how many documents it contains. Call this before documents_start_from_country so you pass a code that actually exists; the set is curated and small, so do not assume a country is present just because the user named it.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: {
      title: "List country checklists",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx) =>
      await ctx.runQuery(
        internal.documents.queries.mcpListCountryTemplates,
        {},
      ),
  },

  {
    name: "documents_start_from_country",
    description:
      "Replace the user's checklist with the ready-made list for one country — use it for 'set up my documents for Japan' or when documents_list returned null. country is the ISO-3166-1 alpha-2 code from documents_list_countries ('ID', 'JP', 'DE'). Items the user had already ticked off keep their completed flag, notes and expiry when the same document_id exists in the new list; anything not in the new list is dropped, so confirm with the user before switching an established checklist to a different country.",
    inputSchema: {
      type: "object",
      properties: {
        country: {
          type: "string",
          description: "Two-letter code from documents_list_countries.",
        },
      },
      required: ["country"],
      additionalProperties: false,
    },
    annotations: {
      title: "Start checklist from country",
      readOnlyHint: false,
      // Rebuilds the whole checklist and can drop items the user had ticked
      // off — hosts should confirm, even though surviving items keep state.
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.documents.mutations.mcpStartFromCountry, {
        userId,
        country: requireArg(args, "country"),
      }),
  },
];
