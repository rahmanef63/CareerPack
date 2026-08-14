import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { ToolDef } from "../types";

/**
 * MCP tools for the `portfolio` domain — projects, certifications,
 * publications and other proof-of-work.
 *
 * Text fields, plus `portfolio_set_media` for reordering or clearing media the
 * user already has in their library. ATTACHING a new image no longer needs the
 * web UI: `portfolio_attach_media` (tools/portfolioMedia.ts) takes the file
 * directly through the OpenAI file-param contract. Typed links still need a
 * picker — see convex/portfolio/mutations.ts.
 *
 * Read the contract in convex/mcp/tools/index.ts first. The short version:
 * `userId` arrives from the access token, never from `args`, and the
 * `internal.portfolio.*.mcp*` functions re-check it against every row.
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

function optionalBool(
  args: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const raw = args[key];
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== "boolean") {
    throw new Error(`Parameter ${key} harus true atau false.`);
  }
  return raw;
}

function optionalStringList(
  args: Record<string, unknown>,
  key: string,
): string[] | undefined {
  const raw = args[key];
  if (raw === undefined || raw === null) return undefined;
  if (!Array.isArray(raw) || raw.some((s) => typeof s !== "string")) {
    throw new Error(`Parameter ${key} harus berupa daftar teks.`);
  }
  return raw as string[];
}

/** Mirrors CATEGORY_WHITELIST in convex/portfolio/mutations.ts. Anything
 *  outside this list is rejected, so the model has to see it up front. */
const CATEGORY_VALUES = [
  "project",
  "certification",
  "publication",
  "design",
  "writing",
  "speaking",
  "award",
  "openSource",
  "volunteer",
  "music",
  "photography",
  "teaching",
  "research",
  "video",
  "other",
];

export const portfolioTools: ToolDef[] = [
  {
    name: "portfolio_list",
    description:
      "List the user's portfolio entries: item_id, title, description, category, date, whether it is featured, links, tech stack, role, client, outcomes and skills. USE THIS FIRST for anything about the user's work or proof of experience — portfolio_update and portfolio_delete both need an item_id and this is the only place they come from. Uploaded images and files are reported only as a count; the assistant cannot read or attach them. Capped at 200, most recently added first.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: {
      title: "List portfolio",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId) =>
      await ctx.runQuery(internal.portfolio.queries.mcpList, { userId }),
  },

  {
    name: "portfolio_create",
    description:
      "Add one portfolio entry — a project, certification, talk, publication, award. title, description, category and date are required. category MUST be one of the listed values, spelled exactly ('openSource' is camelCase); use 'other' rather than inventing one. date is free text but write it as YYYY-MM or YYYY so entries sort sensibly. link is the single main URL (repo, live site, certificate); it does not carry images — attach those with portfolio_set_media after creating the entry. featured pins the entry to the top of the grid and to the user's public page — leave it off unless they ask.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Name of the work." },
        description: {
          type: "string",
          description: "What it was and what the user did.",
        },
        category: {
          type: "string",
          enum: CATEGORY_VALUES,
          description: "Kind of work. Exact spelling required.",
        },
        date: {
          type: "string",
          description: "When it happened. Prefer YYYY-MM or YYYY.",
        },
        link: { type: "string", description: "Main URL. Optional." },
        role: {
          type: "string",
          description: "The user's role on it, e.g. 'Lead developer'.",
        },
        client: { type: "string", description: "Client or organisation." },
        tech_stack: {
          type: "array",
          items: { type: "string" },
          description: "Tools or technologies used.",
        },
        featured: {
          type: "boolean",
          description: "Pin to the top. Defaults to false.",
        },
      },
      required: ["title", "description", "category", "date"],
      additionalProperties: false,
    },
    annotations: {
      title: "Create portfolio item",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.portfolio.mutations.mcpCreate, {
        userId,
        title: requireArg(args, "title"),
        description: requireArg(args, "description"),
        category: requireArg(args, "category"),
        date: requireArg(args, "date"),
        link: optionalArg(args, "link"),
        role: optionalArg(args, "role"),
        client: optionalArg(args, "client"),
        techStack: optionalStringList(args, "tech_stack"),
        featured: optionalBool(args, "featured"),
      }),
  },

  {
    name: "portfolio_update",
    description:
      "Edit one portfolio entry, including pinning or unpinning it with featured. Needs an item_id from portfolio_list. Send ONLY the fields that change; every field sent REPLACES the stored value, and tech_stack replaces the whole array rather than appending — read the current list with portfolio_list and send the merged one. Uploaded media and typed links are untouched by this tool and can only be changed in the web app.",
    inputSchema: {
      type: "object",
      properties: {
        item_id: { type: "string", description: "Id from portfolio_list." },
        title: { type: "string", description: "New title." },
        description: { type: "string", description: "New description." },
        category: {
          type: "string",
          enum: CATEGORY_VALUES,
          description: "New category, exact spelling.",
        },
        date: { type: "string", description: "New date." },
        link: { type: "string", description: "New main URL." },
        role: { type: "string", description: "New role." },
        client: { type: "string", description: "New client." },
        tech_stack: {
          type: "array",
          items: { type: "string" },
          description: "Replaces the whole tech stack list.",
        },
        featured: { type: "boolean", description: "Pin or unpin." },
      },
      required: ["item_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Update portfolio item",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.portfolio.mutations.mcpUpdate, {
        userId,
        itemId: requireArg(args, "item_id") as Id<"portfolioItems">,
        title: optionalArg(args, "title"),
        description: optionalArg(args, "description"),
        category: optionalArg(args, "category"),
        date: optionalArg(args, "date"),
        link: optionalArg(args, "link"),
        role: optionalArg(args, "role"),
        client: optionalArg(args, "client"),
        techStack: optionalStringList(args, "tech_stack"),
        featured: optionalBool(args, "featured"),
      }),
  },

  {
    name: "portfolio_delete",
    description:
      "Permanently delete one portfolio entry, including any media attached to it in the web app. There is no undo, so confirm with the user first — and use portfolio_update with featured false when all they want is to take it off their public page.",
    inputSchema: {
      type: "object",
      properties: {
        item_id: { type: "string", description: "Id from portfolio_list." },
      },
      required: ["item_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Delete portfolio item",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.portfolio.mutations.mcpDelete, {
        userId,
        itemId: requireArg(args, "item_id") as Id<"portfolioItems">,
      }),
  },

  {
    name: "portfolio_set_media",
    description:
      "Attach images (or PDFs) from the user's Content Library to a portfolio entry, and set its thumbnail. This is the step that puts a picture on a project card: upload with files_upload_url + files_register first, then pass those file_ids here. The FIRST image becomes the thumbnail shown on the card and on the user's public page. It REPLACES whatever media the entry already had rather than adding to it, so pass the complete list you want — including any existing file_ids from files_list if you are adding to a set. Pass an empty list to strip the media and the thumbnail off entirely.",
    inputSchema: {
      type: "object",
      properties: {
        item_id: { type: "string", description: "Id from portfolio_list." },
        file_ids: {
          type: "array",
          items: { type: "string" },
          description:
            "Ids from files_list, in display order. First image becomes the thumbnail. Empty list removes all media.",
        },
        caption: {
          type: "string",
          description: "Optional caption applied to the attached media. Max 200 characters.",
        },
      },
      required: ["item_id", "file_ids"],
      additionalProperties: false,
    },
    annotations: {
      title: "Attach media to portfolio entry",
      readOnlyHint: false,
      // Replaces rather than appends, so the same call twice is the same state.
      idempotentHint: true,
      // Passing a shorter list drops media the user may have wanted kept.
      destructiveHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.portfolio.mutations.mcpSetMedia, {
        userId,
        itemId: requireArg(args, "item_id") as Id<"portfolioItems">,
        fileIds: (Array.isArray(args.file_ids) ? args.file_ids : []) as Id<"files">[],
        caption: optionalArg(args, "caption"),
      }),
  },
];
