import { mutation, internalMutation, type MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "../_shared/auth";
import { assertShortText, capLen } from "../_shared/validate";
import { enforceRateLimit } from "../_shared/rateLimit";
import { MCP_WRITE_LIMIT, MCP_WRITE_DAILY_LIMIT } from "../mcp/data/limits";
import type { Id } from "../_generated/dataModel";

/**
 * Kanban status whitelist. Mirrors the canonical `ApplicationStatus`
 * union (`@/shared/types`) — the backend can't import frontend types,
 * so this set is kept in sync by hand. `accepted` is also accepted
 * because the AI-agent capability (`CareerDashboardCapabilities`) emits
 * it; rejecting it would break that live flow.
 */
const APPLICATION_STATUS_WHITELIST = new Set([
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
  "accepted",
]);

/**
 * Cascade-clean FKs that point at this application. `calendarEvents`
 * keeps the event row but unsets `applicationId` so the user still
 * sees the booked slot in their agenda — they only lose the link
 * back to the (now-deleted) application row.
 */
async function cascadeRemoveApplication(
  ctx: MutationCtx,
  userId: Id<"users">,
  applicationId: Id<"jobApplications">,
) {
  const events = await ctx.db
    .query("calendarEvents")
    .withIndex("by_user_application", (q) =>
      q.eq("userId", userId).eq("applicationId", applicationId),
    )
    .collect();
  for (const e of events) await ctx.db.patch(e._id, { applicationId: undefined });
}

/**
 * Cap free-text so a hostile client can't store unbounded blobs that
 * amplify admin-side aggregate scans. Control chars rejected. Shared with
 * the MCP path below so a cap can never be tightened in one and not the other.
 */
function applicationFields(a: {
  company: string;
  position: string;
  location: string;
  source: string;
  salary?: string;
  notes?: string;
}) {
  return {
    company: assertShortText(a.company, 120, "Perusahaan"),
    position: assertShortText(a.position, 120, "Posisi"),
    location: assertShortText(a.location, 120, "Lokasi"),
    salary: capLen("Gaji", a.salary, 60),
    source: assertShortText(a.source, 120, "Sumber"),
    notes: capLen("Catatan", a.notes, 600),
  };
}

export const createApplication = mutation({
  args: {
    company: v.string(),
    position: v.string(),
    location: v.string(),
    salary: v.optional(v.string()),
    source: v.string(),
    notes: v.optional(v.string()),
    /** Optional FK to the CV used. Validated for ownership when provided. */
    cvId: v.optional(v.id("cvs")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (args.cvId) {
      // Ownership check — `requireOwnedDoc` throws "CV tidak ditemukan"
      // on a foreign id, which is the same surface as a deleted row.
      await requireOwnedDoc(ctx, args.cvId, "CV");
    }
    return await ctx.db.insert("jobApplications", {
      userId,
      cvId: args.cvId,
      ...applicationFields(args),
      status: "applied",
      appliedDate: Date.now(),
      interviewDates: [],
      documents: [],
    });
  },
});

export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("jobApplications"),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const application = await requireOwnedDoc(ctx, args.applicationId, "Lamaran");
    const status = args.status.trim();
    if (!APPLICATION_STATUS_WHITELIST.has(status)) {
      throw new Error("Status tidak valid");
    }
    // Cap free-text like createApplication so a hostile client can't store
    // unbounded notes that amplify admin-side aggregate scans.
    await ctx.db.patch(args.applicationId, {
      status,
      notes: capLen("Catatan", args.notes, 600) ?? application.notes,
    });
  },
});

export const addInterviewDate = mutation({
  args: {
    applicationId: v.id("jobApplications"),
    type: v.string(),
    date: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const application = await requireOwnedDoc(ctx, args.applicationId, "Lamaran");
    if (!Number.isFinite(args.date)) {
      throw new Error("Tanggal wawancara tidak valid");
    }
    await ctx.db.patch(args.applicationId, {
      interviewDates: [
        ...application.interviewDates,
        {
          type: assertShortText(args.type, 60, "Jenis wawancara"),
          date: args.date,
          notes: capLen("Catatan", args.notes, 600),
        },
      ],
    });
  },
});

export const deleteApplication = mutation({
  args: { applicationId: v.id("jobApplications") },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.applicationId, "Lamaran");
    const userId = await requireUser(ctx);
    await cascadeRemoveApplication(ctx, userId, args.applicationId);
    await ctx.db.delete(args.applicationId);
  },
});

export const bulkDeleteApplications = mutation({
  args: { ids: v.array(v.id("jobApplications")) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    let deleted = 0;
    for (const id of args.ids) {
      await requireOwnedDoc(ctx, id, "Lamaran");
      await cascadeRemoveApplication(ctx, userId, id);
      await ctx.db.delete(id);
      deleted++;
    }
    return { deleted };
  },
});

// ---------------------------------------------------------------------------
// MCP (convex/mcp/tools/applications.ts). These duplicate the guards above
// rather than reuse them because an MCP request carries no @convex-dev/auth
// session: `requireUser` throws and `requireOwnedDoc` calls it, so identity
// arrives as an explicit `userId` resolved from the bearer token and every
// document is re-checked against it here.
// ---------------------------------------------------------------------------

/** Throws the same "not found" the UI shows for a deleted row — a distinct
 *  "forbidden" would confirm to a guesser which ids exist. */
async function mcpOwned(
  ctx: MutationCtx,
  applicationId: Id<"jobApplications">,
  userId: Id<"users">,
) {
  const doc = await ctx.db.get(applicationId);
  if (!doc || doc.userId !== userId) throw new Error("Lamaran tidak ditemukan");
  return doc;
}

/** An MCP token outlives any browser tab and drives writes unattended. */
async function mcpQuota(ctx: MutationCtx, userId: Id<"users">) {
  await enforceRateLimit(ctx, userId, MCP_WRITE_LIMIT);
  await enforceRateLimit(ctx, userId, MCP_WRITE_DAILY_LIMIT);
}

export const mcpCreate = internalMutation({
  args: {
    userId: v.id("users"),
    company: v.string(),
    position: v.string(),
    location: v.string(),
    source: v.string(),
    salary: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    cvId: v.optional(v.id("cvs")),
  },
  handler: async (ctx, args) => {
    await mcpQuota(ctx, args.userId);

    if (args.cvId) {
      const cv = await ctx.db.get(args.cvId);
      if (!cv || cv.userId !== args.userId) {
        throw new Error("CV tidak ditemukan");
      }
    }
    const status = args.status?.trim() || "applied";
    if (!APPLICATION_STATUS_WHITELIST.has(status)) {
      throw new Error("Status tidak valid");
    }

    const applicationId = await ctx.db.insert("jobApplications", {
      userId: args.userId,
      cvId: args.cvId,
      ...applicationFields(args),
      status,
      appliedDate: Date.now(),
      interviewDates: [],
      documents: [],
    });
    return { application_id: applicationId, status };
  },
});

export const mcpUpdateStatus = internalMutation({
  args: {
    userId: v.id("users"),
    applicationId: v.id("jobApplications"),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await mcpQuota(ctx, args.userId);
    const application = await mcpOwned(ctx, args.applicationId, args.userId);

    const status = args.status.trim();
    if (!APPLICATION_STATUS_WHITELIST.has(status)) {
      throw new Error("Status tidak valid");
    }
    await ctx.db.patch(args.applicationId, {
      status,
      notes: capLen("Catatan", args.notes, 600) ?? application.notes,
    });
    return { application_id: args.applicationId, status };
  },
});

export const mcpAddInterviewDate = internalMutation({
  args: {
    userId: v.id("users"),
    applicationId: v.id("jobApplications"),
    type: v.string(),
    date: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await mcpQuota(ctx, args.userId);
    const application = await mcpOwned(ctx, args.applicationId, args.userId);

    if (!Number.isFinite(args.date)) {
      throw new Error("Tanggal wawancara tidak valid");
    }
    await ctx.db.patch(args.applicationId, {
      interviewDates: [
        ...application.interviewDates,
        {
          type: assertShortText(args.type, 60, "Jenis wawancara"),
          date: args.date,
          notes: capLen("Catatan", args.notes, 600),
        },
      ],
    });
    return {
      application_id: args.applicationId,
      interview_count: application.interviewDates.length + 1,
    };
  },
});

export const mcpDelete = internalMutation({
  args: { userId: v.id("users"), applicationId: v.id("jobApplications") },
  handler: async (ctx, args) => {
    await mcpQuota(ctx, args.userId);
    const application = await mcpOwned(ctx, args.applicationId, args.userId);

    await cascadeRemoveApplication(ctx, args.userId, args.applicationId);
    await ctx.db.delete(args.applicationId);
    return { deleted: true, company: application.company };
  },
});
