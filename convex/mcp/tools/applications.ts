import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { ToolDef } from "../types";

/**
 * MCP tools for the `applications` domain — the job tracker.
 *
 * Read the contract in convex/mcp/tools/index.ts first. The short version:
 * `userId` arrives from the access token, never from `args`, and the
 * `internal.applications.*.mcp*` functions re-check it against every row.
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

/** Models emit ISO 8601; the schema stores epoch ms. Rejecting the parse
 *  here turns a silent `NaN` write into a sentence the model can act on. */
function requireInstant(args: Record<string, unknown>, key: string): number {
  const ms = Date.parse(requireArg(args, key));
  if (Number.isNaN(ms)) {
    throw new Error(
      `Parameter ${key} harus tanggal ISO 8601, mis. 2026-08-14T10:00:00+07:00.`,
    );
  }
  return ms;
}

/** Mirrors APPLICATION_STATUS_WHITELIST in convex/applications/mutations.ts.
 *  Repeated in the schema so the model reads the legal values before it
 *  calls, instead of learning them from a rejection. */
const STATUS_VALUES = [
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
  "accepted",
];

export const applicationsTools: ToolDef[] = [
  {
    name: "applications_list",
    description:
      "List the user's job applications, newest first: company, position, location, status, source, salary, notes, when they applied, and any interview dates already logged. USE THIS FIRST for anything about applications — every other applications_* tool needs an application_id and this is the only place ids come from. Also the tool for counting questions ('how many jobs have I applied to', 'what is still in interview'). Optional status filter narrows server-side; omit it to see everything. Capped at 200 rows.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: STATUS_VALUES,
          description:
            "Return only applications in this stage. Omit for all stages.",
        },
      },
      additionalProperties: false,
    },
    annotations: {
      title: "List job applications",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runQuery(internal.applications.queries.mcpList, {
        userId,
        status: optionalArg(args, "status"),
      }),
  },

  {
    name: "applications_create",
    description:
      "Record a new job application. company, position, location and source are all required — source is where the job was found ('LinkedIn', 'JobStreet', 'referral', 'company website'); ask the user rather than guessing it. status defaults to 'applied'; set it only when the user says they are already further along ('I have an interview next week' -> 'interview'). The applied date is set to now, so do not use this to backfill an application from months ago without telling the user the date will be today. cv_id links the CV that was sent — get it from cv_list.",
    inputSchema: {
      type: "object",
      properties: {
        company: { type: "string", description: "Hiring company name." },
        position: { type: "string", description: "Role applied for." },
        location: {
          type: "string",
          description: "Job location, e.g. 'Jakarta' or 'Remote'.",
        },
        source: {
          type: "string",
          description: "Where the job was found, e.g. 'LinkedIn', 'referral'.",
        },
        salary: {
          type: "string",
          description:
            "Free-text salary or range as the user says it, e.g. '10-15 juta'.",
        },
        notes: { type: "string", description: "Anything worth remembering." },
        status: {
          type: "string",
          enum: STATUS_VALUES,
          description: "Defaults to 'applied'.",
        },
        cv_id: {
          type: "string",
          description: "Id from cv_list — the CV sent with this application.",
        },
      },
      required: ["company", "position", "location", "source"],
      additionalProperties: false,
    },
    annotations: {
      title: "Create job application",
      readOnlyHint: false,
      destructiveHint: false,
      // Calling twice creates two rows — the user ends up with a duplicate
      // to delete, so hosts should not auto-retry this one.
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.applications.mutations.mcpCreate, {
        userId,
        company: requireArg(args, "company"),
        position: requireArg(args, "position"),
        location: requireArg(args, "location"),
        source: requireArg(args, "source"),
        salary: optionalArg(args, "salary"),
        notes: optionalArg(args, "notes"),
        status: optionalArg(args, "status"),
        cvId: optionalArg(args, "cv_id") as Id<"cvs"> | undefined,
      }),
  },

  {
    name: "applications_update_status",
    description:
      "Move one application to a new stage — the tool for 'I got rejected by X', 'they invited me to interview', 'I accepted the offer'. Needs an application_id from applications_list. Passing notes REPLACES the existing notes; omit it to keep them. Use applications_add_interview instead when the user is telling you WHEN an interview is, not that the stage changed.",
    inputSchema: {
      type: "object",
      properties: {
        application_id: {
          type: "string",
          description: "Id from applications_list.",
        },
        status: {
          type: "string",
          enum: STATUS_VALUES,
          description: "New stage.",
        },
        notes: {
          type: "string",
          description: "Replaces the current notes when supplied.",
        },
      },
      required: ["application_id", "status"],
      additionalProperties: false,
    },
    annotations: {
      title: "Update application status",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.applications.mutations.mcpUpdateStatus, {
        userId,
        applicationId: requireArg(args, "application_id") as Id<"jobApplications">,
        status: requireArg(args, "status"),
        notes: optionalArg(args, "notes"),
      }),
  },

  {
    name: "applications_add_interview",
    description:
      "Append a scheduled interview to one application. `type` is the round as the user describes it ('HR screening', 'technical', 'user interview', 'final'). `date` is an ISO 8601 instant — include the time and an offset, e.g. '2026-08-14T10:00:00+07:00'; the app's users are on WIB (UTC+7), so a bare '2026-08-14T10:00:00' is read as UTC and lands 7 hours early. This only records the round on the application — it does NOT put anything in the calendar, so call calendar_create_event too when the user wants a reminder.",
    inputSchema: {
      type: "object",
      properties: {
        application_id: {
          type: "string",
          description: "Id from applications_list.",
        },
        type: {
          type: "string",
          description: "Interview round, e.g. 'HR screening', 'technical'.",
        },
        date: {
          type: "string",
          description:
            "ISO 8601 instant with offset, e.g. '2026-08-14T10:00:00+07:00'.",
        },
        notes: { type: "string", description: "Anything to prepare." },
      },
      required: ["application_id", "type", "date"],
      additionalProperties: false,
    },
    annotations: {
      title: "Add interview date",
      readOnlyHint: false,
      destructiveHint: false,
      // Appends to an array: a retry adds a second identical round.
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.applications.mutations.mcpAddInterviewDate, {
        userId,
        applicationId: requireArg(args, "application_id") as Id<"jobApplications">,
        type: requireArg(args, "type"),
        date: requireInstant(args, "date"),
        notes: optionalArg(args, "notes"),
      }),
  },

  {
    name: "applications_delete",
    description:
      "Permanently delete one job application and its logged interview rounds. There is no undo, so confirm with the user first and never infer this from a status change — a rejected application is still worth keeping, use applications_update_status with 'rejected'. Calendar events booked against it survive but lose the link back.",
    inputSchema: {
      type: "object",
      properties: {
        application_id: {
          type: "string",
          description: "Id from applications_list.",
        },
      },
      required: ["application_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Delete job application",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.applications.mutations.mcpDelete, {
        userId,
        applicationId: requireArg(args, "application_id") as Id<"jobApplications">,
      }),
  },
];
