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

  "cv.list": async (ctx) => {
    const cvs = await ctx.runQuery(api.cv.queries.getUserCVs, {});
    return cvs.slice(0, 20).map((c) => ({
      cvId: c._id,
      title: c.title,
      template: c.template,
      isDefault: Boolean(c.isDefault),
      summary: c.personalInfo?.summary ?? "",
      experienceCount: c.experience?.length ?? 0,
      skillsCount: c.skills?.length ?? 0,
      educationCount: c.education?.length ?? 0,
    }));
  },

  "roadmap.list": async (ctx) => {
    const r = await ctx.runQuery(api.roadmap.queries.getUserRoadmap, {});
    if (!r) return null;
    return {
      careerPath: r.careerPath,
      progress: r.progress,
      skills: r.skills.slice(0, 100).map((s) => ({
        skillId: s.id,
        name: s.name,
        level: s.level,
        status: s.status,
        estimatedHours: s.estimatedHours,
        resourceCount: s.resources?.length ?? 0,
      })),
    };
  },

  "roadmap.list-templates": async (ctx) => {
    const tpls = await ctx.runQuery(
      api.roadmap.templates.listPublicTemplates,
      {},
    );
    return tpls.slice(0, 60).map((t) => ({
      slug: t.slug,
      title: t.title,
      domain: t.domain,
      description: t.description,
      nodeCount: t.nodeCount,
      totalHours: t.totalHours,
      tags: t.tags ?? [],
    }));
  },

  "matcher.list-jobs": async (ctx) => {
    const jobs = await ctx.runQuery(api.matcher.queries.listJobs, {
      limit: 50,
    });
    return jobs.map((j) => ({
      jobId: j._id,
      title: j.title,
      company: j.company,
      location: j.location,
      workMode: j.workMode,
      seniority: j.seniority,
      employmentType: j.employmentType,
      source: j.source,
      requiredSkills: (j.requiredSkills ?? []).slice(0, 12),
      salaryMin: j.salaryMin ?? null,
      salaryMax: j.salaryMax ?? null,
      currency: j.currency ?? null,
    }));
  },

  "matcher.list-mine": async (ctx) => {
    const jobs = await ctx.runQuery(api.matcher.queries.listJobs, {
      mineOnly: true,
      limit: 50,
    });
    return jobs.map((j) => ({
      jobId: j._id,
      title: j.title,
      company: j.company,
      location: j.location,
      workMode: j.workMode,
      seniority: j.seniority,
      requiredSkills: (j.requiredSkills ?? []).slice(0, 12),
      postedAt: j.postedAt,
    }));
  },

  "matcher.list-scans": async (ctx) => {
    const scans = await ctx.runQuery(api.matcher.queries.listMyScans, {
      limit: 20,
    });
    return scans.map((s) => ({
      scanId: s._id,
      cvId: s.cvId,
      jobListingId: s.jobListingId ?? null,
      jobTitle: s.jobTitle,
      jobCompany: s.jobCompany ?? "",
      score: s.score,
      grade: s.grade,
      createdAt: s.createdAt,
    }));
  },

  "interview.list-sessions": async (ctx) => {
    const sessions = await ctx.runQuery(
      api.mockInterview.queries.getUserInterviews,
      {},
    );
    return sessions.slice(0, 30).map((s) => ({
      interviewId: s._id,
      type: s.type,
      role: s.role,
      difficulty: s.difficulty,
      overallScore: s.overallScore ?? null,
      completedAt: s.completedAt ?? null,
      questionCount: s.questions?.length ?? 0,
      answeredCount:
        s.questions?.filter((q) => q.userAnswer && q.userAnswer.length > 0)
          .length ?? 0,
    }));
  },

  "interview.get-analytics": async (ctx) => {
    return await ctx.runQuery(
      api.mockInterview.queries.getInterviewAnalytics,
      {},
    );
  },

  "financial.list-budget": async (ctx) => {
    const vars = await ctx.runQuery(
      api.financial.queries.listBudgetVariables,
      {},
    );
    return vars.map((v) => ({
      id: v._id,
      label: v.label,
      value: v.value,
      kind: v.kind,
      iconName: v.iconName,
      color: v.color,
      order: v.order,
    }));
  },

  "portfolio.list": async (ctx) => {
    const items = await ctx.runQuery(api.portfolio.queries.listPortfolio, {});
    return items.slice(0, 50).map((p) => ({
      itemId: p._id,
      title: p.title,
      category: p.category,
      description: p.description.length > 200
        ? p.description.slice(0, 200) + "…"
        : p.description,
      featured: Boolean(p.featured),
      date: p.date,
      link: p.link ?? null,
    }));
  },

  "notifications.list": async (ctx) => {
    const list = await ctx.runQuery(
      api.notifications.queries.getUserNotifications,
      {},
    );
    return list.slice(0, 50).map((n) => ({
      notificationId: n._id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      scheduledFor: n.scheduledFor ?? null,
      actionUrl: n.actionUrl ?? null,
      createdAt: n._creationTime,
    }));
  },

  "branding.get-status": async (ctx) => {
    const me = await ctx.runQuery(api.profile.queries.getCurrentUser, {});
    if (!me?.profile) return null;
    const p = me.profile;
    return {
      enabled: Boolean(p.publicEnabled),
      slug: p.publicSlug ?? null,
      headline: p.publicHeadline ?? null,
      theme: p.publicTheme ?? "linktree",
      mode: p.publicMode ?? "auto",
      availableForHire: Boolean(p.publicAvailableForHire),
      availabilityNote: p.publicAvailabilityNote ?? null,
      ctaLabel: p.publicCtaLabel ?? null,
      ctaUrl: p.publicCtaUrl ?? null,
    };
  },
};
