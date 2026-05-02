import type { ActionCtx } from "../_generated/server";
import { api } from "../_generated/api";

/**
 * Server-side skill handler — executed inline by the chat action when
 * the AI emits a tool_call for a `kind: "query"` skill. The result is
 * fed back to the model as a `role: "tool"` message so it can chain
 * further tool calls (e.g. list events → pick id → emit delete-event).
 *
 * Mutation/compose/navigate skills do NOT have handlers here — those
 * are returned to the client unexecuted, rendered as ApproveActionCard,
 * and applied via the slice's capability binder after user approval.
 *
 * Adding a new query skill: 1) declare it in the slice manifest with
 * `kind: "query"`, 2) add an entry here mapping skill.id → handler.
 * Handlers receive the ActionCtx (so they can call internal queries
 * with the user's auth) and the AI-emitted args.
 */
export type SkillHandler = (
  ctx: ActionCtx,
  args: Record<string, unknown>,
) => Promise<unknown>;

export const SKILL_HANDLERS: Record<string, SkillHandler> = {
  "calendar.list-events": async (ctx) => {
    const events = await ctx.runQuery(api.calendar.queries.listEvents, {});
    // Trim to fields the AI actually needs to reason about. Drop
    // _creationTime / userId / reminderSentAt / applicationId — noise
    // for the model. Cap to 50 most recent so token cost is bounded.
    return events.slice(0, 50).map((e) => ({
      eventId: e._id,
      title: e.title,
      date: e.date,
      time: e.time,
      location: e.location,
      type: e.type,
      notes: e.notes ?? "",
    }));
  },

  "applications.list": async (ctx) => {
    const apps = await ctx.runQuery(
      api.applications.queries.getUserApplications,
      {},
    );
    return apps.slice(0, 50).map((a) => ({
      applicationId: a._id,
      company: a.company,
      position: a.position,
      location: a.location,
      status: a.status,
      source: a.source,
      salary: a.salary ?? "",
      appliedDate: a.appliedDate ?? null,
      notes: a.notes ?? "",
    }));
  },

  "contacts.list": async (ctx) => {
    const contacts = await ctx.runQuery(api.contacts.queries.listContacts, {});
    return contacts.slice(0, 50).map((c) => ({
      contactId: c._id,
      name: c.name,
      role: c.role,
      company: c.company ?? "",
      position: c.position ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      linkedinUrl: c.linkedinUrl ?? "",
      favorite: Boolean(c.favorite),
      notes: c.notes ?? "",
    }));
  },

  "documents.list": async (ctx) => {
    const checklist = await ctx.runQuery(
      api.documents.queries.getUserDocumentChecklist,
      {},
    );
    if (!checklist) return [];
    return (checklist.documents ?? []).slice(0, 100).map((d) => ({
      documentId: d.id,
      title: d.name,
      category: d.category ?? "",
      subcategory: d.subcategory ?? "",
      required: Boolean(d.required),
      completed: Boolean(d.completed),
      notes: d.notes ?? "",
      expiryDate: d.expiryDate ?? null,
    }));
  },
};
