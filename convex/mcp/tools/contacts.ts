import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { ToolDef } from "../types";

/**
 * MCP tools for the `contacts` domain — the user's professional network
 * (recruiters, mentors, peers).
 *
 * Read the contract in convex/mcp/tools/index.ts first. The short version:
 * `userId` arrives from the access token, never from `args`, and the
 * `internal.contacts.*.mcp*` functions re-check it against every row.
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

/** Mirrors ROLE_WHITELIST in convex/contacts/mutations.ts. */
const ROLE_VALUES = ["recruiter", "mentor", "peer", "other"];

export const contactsTools: ToolDef[] = [
  {
    name: "contacts_list",
    description:
      "List the user's professional contacts with contact_id, name, role, company, position, email, phone, LinkedIn, notes, whether they are starred, and when the user last spoke to them. USE THIS FIRST for anything about people — every other contacts_* tool needs a contact_id and this is the only place they come from. Also the tool to answer 'who do I know at X' or 'who have I not followed up with'. Capped at 300, most recently added first.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: {
      title: "List contacts",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId) =>
      await ctx.runQuery(internal.contacts.queries.mcpList, { userId }),
  },

  {
    name: "contacts_create",
    description:
      "Add someone to the user's network. name and role are required; role must be one of recruiter, mentor, peer, other — pick 'other' rather than inventing a value. Everything else is optional, so save a contact with just a name rather than interrogating the user for fields they did not offer. Check contacts_list first when the person may already be there: this always inserts a new row and will happily create a duplicate.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Full name." },
        role: {
          type: "string",
          enum: ROLE_VALUES,
          description: "How this person relates to the user's job search.",
        },
        company: { type: "string", description: "Where they work." },
        position: { type: "string", description: "Their job title." },
        email: { type: "string", description: "Email address." },
        phone: { type: "string", description: "Phone number." },
        linkedin_url: { type: "string", description: "LinkedIn profile URL." },
        notes: {
          type: "string",
          description: "How they met, what was discussed, follow-ups.",
        },
        favorite: {
          type: "boolean",
          description: "Star this contact. Defaults to false.",
        },
      },
      required: ["name", "role"],
      additionalProperties: false,
    },
    annotations: {
      title: "Create contact",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.contacts.mutations.mcpCreate, {
        userId,
        name: requireArg(args, "name"),
        role: requireArg(args, "role"),
        company: optionalArg(args, "company"),
        position: optionalArg(args, "position"),
        email: optionalArg(args, "email"),
        phone: optionalArg(args, "phone"),
        linkedinUrl: optionalArg(args, "linkedin_url"),
        notes: optionalArg(args, "notes"),
        favorite: optionalBool(args, "favorite"),
      }),
  },

  {
    name: "contacts_update",
    description:
      "Edit an existing contact — a job change, a new email, a starred flag. Needs a contact_id from contacts_list. Send ONLY the fields that change; every field sent REPLACES the stored value, so passing notes wipes the previous note instead of appending to it. Read the current notes with contacts_list and send the merged text when the user wants to add to them. Use contacts_log_interaction, not this, when all that happened is that they talked.",
    inputSchema: {
      type: "object",
      properties: {
        contact_id: { type: "string", description: "Id from contacts_list." },
        name: { type: "string", description: "New name." },
        role: {
          type: "string",
          enum: ROLE_VALUES,
          description: "New relationship type.",
        },
        company: { type: "string", description: "New company." },
        position: { type: "string", description: "New job title." },
        email: { type: "string", description: "New email." },
        phone: { type: "string", description: "New phone number." },
        linkedin_url: { type: "string", description: "New LinkedIn URL." },
        notes: { type: "string", description: "Replaces the stored notes." },
        favorite: { type: "boolean", description: "Star or unstar." },
      },
      required: ["contact_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Update contact",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.contacts.mutations.mcpUpdate, {
        userId,
        contactId: requireArg(args, "contact_id") as Id<"contacts">,
        name: optionalArg(args, "name"),
        role: optionalArg(args, "role"),
        company: optionalArg(args, "company"),
        position: optionalArg(args, "position"),
        email: optionalArg(args, "email"),
        phone: optionalArg(args, "phone"),
        linkedinUrl: optionalArg(args, "linkedin_url"),
        notes: optionalArg(args, "notes"),
        favorite: optionalBool(args, "favorite"),
      }),
  },

  {
    name: "contacts_log_interaction",
    description:
      "Stamp a contact as spoken-to just now — the tool for 'I messaged Budi today', 'just had a call with my mentor'. This only moves the last-contacted timestamp that drives the 'who have I gone quiet on' view; it writes no note. When the user also says WHAT was discussed, call contacts_update with the merged notes as well.",
    inputSchema: {
      type: "object",
      properties: {
        contact_id: { type: "string", description: "Id from contacts_list." },
      },
      required: ["contact_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Log contact interaction",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.contacts.mutations.mcpLogInteraction, {
        userId,
        contactId: requireArg(args, "contact_id") as Id<"contacts">,
      }),
  },

  {
    name: "contacts_delete",
    description:
      "Permanently remove one contact and everything recorded about them. There is no undo, so confirm with the user first — and prefer contacts_update when they only want to correct or unstar the entry.",
    inputSchema: {
      type: "object",
      properties: {
        contact_id: { type: "string", description: "Id from contacts_list." },
      },
      required: ["contact_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Delete contact",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.contacts.mutations.mcpDelete, {
        userId,
        contactId: requireArg(args, "contact_id") as Id<"contacts">,
      }),
  },
];
