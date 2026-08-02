import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { ToolDef } from "../types";

/**
 * MCP tools for the `calendar` domain — interviews, deadlines and study
 * reminders.
 *
 * Read the contract in convex/mcp/tools/index.ts first. The short version:
 * `userId` arrives from the access token, never from `args`, and the
 * `internal.calendar.*.mcp*` functions re-check it against every row.
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

function optionalNumber(
  args: Record<string, unknown>,
  key: string,
): number | undefined {
  const raw = args[key];
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    throw new Error(`Parameter ${key} harus berupa angka.`);
  }
  return raw;
}

/**
 * Repeated in every date-bearing description because the model has no other
 * way to know it: the app stores a bare wall-clock and the reminder cron
 * anchors it to WIB (convex/calendar/reminders.ts APP_UTC_OFFSET). A model
 * that helpfully converts the user's "9 pagi" to UTC schedules 16:00.
 */
const TIME_RULE =
  "date is YYYY-MM-DD and time is HH:MM on a 24-hour clock, both written as the user's own wall clock (Indonesian users, WIB) — do NOT convert to UTC.";

export const calendarTools: ToolDef[] = [
  {
    name: "calendar_list_events",
    description:
      `List the user's calendar entries with their event_id, title, date, time, location, type, notes and reminder. USE THIS FIRST for anything about the schedule — 'what do I have tomorrow', 'when is the Tokopedia interview' — and before calendar_update_event or calendar_delete_event, which both need an event_id. Narrow with from/to (both YYYY-MM-DD, inclusive) instead of listing everything and filtering yourself; omitting both returns the earliest 200 events, which for an established user is mostly the past. ${TIME_RULE}`,
    inputSchema: {
      type: "object",
      properties: {
        from: {
          type: "string",
          description: "Inclusive start date, YYYY-MM-DD.",
        },
        to: { type: "string", description: "Inclusive end date, YYYY-MM-DD." },
      },
      additionalProperties: false,
    },
    annotations: {
      title: "List calendar events",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runQuery(internal.calendar.queries.mcpListEvents, {
        userId,
        from: optionalArg(args, "from"),
        to: optionalArg(args, "to"),
      }),
  },

  {
    name: "calendar_create_event",
    description:
      `Put an entry on the user's calendar — use it for anything they mention with a future date or time: an interview, an application deadline, a study session. ${TIME_RULE} Resolve relative dates ('besok', 'Senin depan') against today before calling. Use type 'interview' for interviews, 'deadline' for cut-off dates, 'reminder' for study or follow-up nudges, 'other' otherwise. When the user gives no hour, default time to '09:00' and say so. reminder_minutes schedules a notification that many minutes before the start (15, 60, 1440 for a day ahead); leave it out when they did not ask to be reminded. application_id links the entry to a tracked job — take it from applications_list.`,
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "What the entry is." },
        date: { type: "string", description: "YYYY-MM-DD, local wall clock." },
        time: { type: "string", description: "HH:MM, 24-hour, local wall clock." },
        type: {
          type: "string",
          enum: ["interview", "deadline", "reminder", "other"],
          description: "Entry kind.",
        },
        location: {
          type: "string",
          description: "Address or meeting URL. Optional.",
        },
        notes: { type: "string", description: "Anything to prepare." },
        reminder_minutes: {
          type: "number",
          description:
            "Notify this many minutes before the start. Omit for no reminder.",
        },
        application_id: {
          type: "string",
          description: "Id from applications_list to link this to a job.",
        },
      },
      required: ["title", "date", "time", "type"],
      additionalProperties: false,
    },
    annotations: {
      title: "Create calendar event",
      readOnlyHint: false,
      destructiveHint: false,
      // Calling twice books the same slot twice; the user has to delete one.
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.calendar.mutations.mcpCreateEvent, {
        userId,
        title: requireArg(args, "title"),
        date: requireArg(args, "date"),
        time: requireArg(args, "time"),
        type: requireArg(args, "type"),
        location: optionalArg(args, "location"),
        notes: optionalArg(args, "notes"),
        reminderMinutes: optionalNumber(args, "reminder_minutes"),
        applicationId: optionalArg(args, "application_id") as
          | Id<"jobApplications">
          | undefined,
      }),
  },

  {
    name: "calendar_update_event",
    description:
      `Change fields on an existing calendar entry — rescheduling, a new location, an added note. Needs an event_id from calendar_list_events. Send ONLY the fields that change; anything omitted is left alone, and every field sent REPLACES the old value rather than appending to it. Moving the date, the time or the reminder re-arms the reminder, so a notification already sent will fire again for the new slot. ${TIME_RULE}`,
    inputSchema: {
      type: "object",
      properties: {
        event_id: {
          type: "string",
          description: "Id from calendar_list_events.",
        },
        title: { type: "string", description: "New title." },
        date: { type: "string", description: "New date, YYYY-MM-DD." },
        time: { type: "string", description: "New time, HH:MM 24-hour." },
        type: {
          type: "string",
          enum: ["interview", "deadline", "reminder", "other"],
          description: "New entry kind.",
        },
        location: { type: "string", description: "New location or URL." },
        notes: { type: "string", description: "Replaces the existing notes." },
        reminder_minutes: {
          type: "number",
          description: "New lead time in minutes before the start.",
        },
      },
      required: ["event_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Update calendar event",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.calendar.mutations.mcpUpdateEvent, {
        userId,
        eventId: requireArg(args, "event_id") as Id<"calendarEvents">,
        title: optionalArg(args, "title"),
        date: optionalArg(args, "date"),
        time: optionalArg(args, "time"),
        type: optionalArg(args, "type"),
        location: optionalArg(args, "location"),
        notes: optionalArg(args, "notes"),
        reminderMinutes: optionalNumber(args, "reminder_minutes"),
      }),
  },

  {
    name: "calendar_delete_event",
    description:
      "Permanently remove one calendar entry. There is no undo, so confirm with the user first. When they are moving something rather than cancelling it, use calendar_update_event — deleting and recreating loses the link to any job application the entry was attached to.",
    inputSchema: {
      type: "object",
      properties: {
        event_id: {
          type: "string",
          description: "Id from calendar_list_events.",
        },
      },
      required: ["event_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Delete calendar event",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.calendar.mutations.mcpDeleteEvent, {
        userId,
        eventId: requireArg(args, "event_id") as Id<"calendarEvents">,
      }),
  },
];
