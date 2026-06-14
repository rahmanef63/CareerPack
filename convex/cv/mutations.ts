import { mutation, internalMutation, type MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "../_shared/auth";
import { enforceRateLimit, AI_RATE_LIMITS } from "../_shared/rateLimit";
import { assertShortText, capLen, capStringArray } from "../_shared/validate";
import { assertOwnedStorages } from "../files/ownership";
import type { Id } from "../_generated/dataModel";

/**
 * Cascade FK references when a CV is deleted. `atsScans.cvId` is a
 * REQUIRED FK so the row would be unreadable if left dangling — must
 * delete. `jobApplications.cvId` is optional, so we just unset it
 * (preserves the application record + its history).
 */
async function cascadeRemoveCV(
  ctx: MutationCtx,
  userId: Id<"users">,
  cvId: Id<"cvs">,
) {
  const scans = await ctx.db
    .query("atsScans")
    .withIndex("by_user_cv", (q) => q.eq("userId", userId).eq("cvId", cvId))
    .collect();
  for (const s of scans) await ctx.db.delete(s._id);

  const apps = await ctx.db
    .query("jobApplications")
    .withIndex("by_user_cv", (q) => q.eq("userId", userId).eq("cvId", cvId))
    .collect();
  for (const a of apps) await ctx.db.patch(a._id, { cvId: undefined });
}

export const createCV = mutation({
  args: {
    title: v.string(),
    template: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const user = await ctx.db.get(userId);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return await ctx.db.insert("cvs", {
      userId,
      title: args.title,
      template: args.template,
      personalInfo: {
        fullName: profile?.fullName || user?.name || "",
        email: user?.email || "",
        phone: profile?.phone || "",
        location: profile?.location || "",
        summary: profile?.bio || "",
      },
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      languages: [],
      projects: [],
      isDefault: false,
    });
  },
});

/** Per-entry caps for the CV array fields. Each top-level array is also
 * capped at 50 entries so a hostile client can't bloat a single doc. */
const CV_ENTRY_MAX = 50;

type CVUpdates = {
  title?: string;
  personalInfo?: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    portfolio?: string;
    summary: string;
    avatarStorageId?: string;
    avatarUrl?: string;
    dateOfBirth?: string;
  };
  experience?: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  education?: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa?: string;
  }>;
  skills?: Array<{ id: string; name: string; category: string; proficiency: number }>;
  certifications?: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
  }>;
  languages?: Array<{ language: string; proficiency: string }>;
  projects?: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }>;
  // Pass-through — bounded enums/booleans, no free-text to cap.
  displayPrefs?: {
    showPicture?: boolean;
    showAge?: boolean;
    showGraduationYear?: boolean;
    templateId?: string;
  };
};

function assertCount<T>(arr: T[], label: string): T[] {
  if (arr.length > CV_ENTRY_MAX) {
    throw new Error(`${label} maksimal ${CV_ENTRY_MAX} entri`);
  }
  return arr;
}

/**
 * Cap CV string + array fields before they hit the DB. `updateCV`
 * previously patched the whole `updates` object verbatim, so free-text
 * could be stored unbounded. Returns a new object with validated values;
 * control chars are rejected and oversize throws the shared Indonesian
 * messages. Mirrors the caps used by the profile + application mutations.
 */
function validateCVUpdates(updates: CVUpdates): CVUpdates {
  const out: CVUpdates = { ...updates };

  if (updates.title !== undefined) {
    out.title = assertShortText(updates.title, 120, "Judul CV");
  }

  if (updates.personalInfo !== undefined) {
    const p = updates.personalInfo;
    out.personalInfo = {
      ...p,
      fullName: assertShortText(p.fullName, 120, "Nama"),
      email: assertShortText(p.email, 120, "Email"),
      phone: assertShortText(p.phone, 30, "Telepon"),
      location: assertShortText(p.location, 120, "Lokasi"),
      summary: assertShortText(p.summary, 600, "Ringkasan"),
      linkedin: capLen("LinkedIn", p.linkedin, 300),
      portfolio: capLen("Portfolio", p.portfolio, 300),
      dateOfBirth: capLen("Tanggal lahir", p.dateOfBirth, 40),
    };
  }

  if (updates.experience !== undefined) {
    out.experience = assertCount(updates.experience, "Pengalaman").map((e) => ({
      ...e,
      company: assertShortText(e.company, 120, "Perusahaan"),
      position: assertShortText(e.position, 120, "Posisi"),
      startDate: assertShortText(e.startDate, 40, "Tanggal mulai"),
      endDate: capLen("Tanggal selesai", e.endDate, 40),
      description: assertShortText(e.description, 2000, "Deskripsi"),
      achievements: capStringArray(e.achievements, {
        maxEntries: CV_ENTRY_MAX,
        maxLen: 300,
        field: "Pencapaian",
        entryField: "Pencapaian",
      }),
    }));
  }

  if (updates.education !== undefined) {
    out.education = assertCount(updates.education, "Pendidikan").map((e) => ({
      ...e,
      institution: assertShortText(e.institution, 120, "Institusi"),
      degree: assertShortText(e.degree, 120, "Gelar"),
      field: assertShortText(e.field, 120, "Bidang"),
      startDate: assertShortText(e.startDate, 40, "Tanggal mulai"),
      endDate: assertShortText(e.endDate, 40, "Tanggal selesai"),
      gpa: capLen("IPK", e.gpa, 20),
    }));
  }

  if (updates.skills !== undefined) {
    out.skills = assertCount(updates.skills, "Skill").map((s) => ({
      ...s,
      name: assertShortText(s.name, 60, "Skill"),
      category: assertShortText(s.category, 60, "Kategori"),
    }));
  }

  if (updates.certifications !== undefined) {
    out.certifications = assertCount(updates.certifications, "Sertifikat").map((c) => ({
      ...c,
      name: assertShortText(c.name, 120, "Sertifikat"),
      issuer: assertShortText(c.issuer, 120, "Penerbit"),
      date: assertShortText(c.date, 40, "Tanggal"),
      expiryDate: capLen("Tanggal kedaluwarsa", c.expiryDate, 40),
    }));
  }

  if (updates.languages !== undefined) {
    out.languages = assertCount(updates.languages, "Bahasa").map((l) => ({
      ...l,
      language: assertShortText(l.language, 60, "Bahasa"),
      proficiency: assertShortText(l.proficiency, 40, "Kecakapan"),
    }));
  }

  if (updates.projects !== undefined) {
    out.projects = assertCount(updates.projects, "Proyek").map((p) => ({
      ...p,
      name: assertShortText(p.name, 120, "Proyek"),
      description: assertShortText(p.description, 2000, "Deskripsi"),
      link: capLen("Tautan", p.link, 300),
      technologies: capStringArray(p.technologies, {
        maxEntries: CV_ENTRY_MAX,
        maxLen: 60,
        field: "Teknologi",
        entryField: "Teknologi",
      }),
    }));
  }

  return out;
}

export const updateCV = mutation({
  args: {
    cvId: v.id("cvs"),
    updates: v.object({
      title: v.optional(v.string()),
      personalInfo: v.optional(v.object({
        fullName: v.string(),
        email: v.string(),
        phone: v.string(),
        location: v.string(),
        linkedin: v.optional(v.string()),
        portfolio: v.optional(v.string()),
        summary: v.string(),
        avatarStorageId: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        dateOfBirth: v.optional(v.string()),
      })),
      displayPrefs: v.optional(v.object({
        showPicture: v.optional(v.boolean()),
        showAge: v.optional(v.boolean()),
        showGraduationYear: v.optional(v.boolean()),
        templateId: v.optional(v.string()),
      })),
      experience: v.optional(v.array(v.object({
        id: v.string(),
        company: v.string(),
        position: v.string(),
        startDate: v.string(),
        endDate: v.optional(v.string()),
        current: v.boolean(),
        description: v.string(),
        achievements: v.array(v.string()),
      }))),
      education: v.optional(v.array(v.object({
        id: v.string(),
        institution: v.string(),
        degree: v.string(),
        field: v.string(),
        startDate: v.string(),
        endDate: v.string(),
        gpa: v.optional(v.string()),
      }))),
      skills: v.optional(v.array(v.object({
        id: v.string(),
        name: v.string(),
        category: v.string(),
        proficiency: v.number(),
      }))),
      certifications: v.optional(v.array(v.object({
        id: v.string(),
        name: v.string(),
        issuer: v.string(),
        date: v.string(),
        expiryDate: v.optional(v.string()),
      }))),
      languages: v.optional(v.array(v.object({
        language: v.string(),
        proficiency: v.string(),
      }))),
      projects: v.optional(v.array(v.object({
        id: v.string(),
        name: v.string(),
        description: v.string(),
        technologies: v.array(v.string()),
        link: v.optional(v.string()),
      }))),
    }),
  },
  handler: async (ctx, args) => {
    const cv = await requireOwnedDoc(ctx, args.cvId, "CV");
    const avatarStorageId = args.updates.personalInfo?.avatarStorageId;
    if (avatarStorageId) {
      await assertOwnedStorages(ctx, [avatarStorageId], cv.userId);
    }
    await ctx.db.patch(args.cvId, validateCVUpdates(args.updates));
    return args.cvId;
  },
});

export const deleteCV = mutation({
  args: { cvId: v.id("cvs") },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.cvId, "CV");
    const userId = await requireUser(ctx);
    await cascadeRemoveCV(ctx, userId, args.cvId);
    await ctx.db.delete(args.cvId);
  },
});

/**
 * Bulk delete with FK cascade — can't use the generic
 * `makeBulkDelete` factory because we need to clean up atsScans +
 * jobApplications.cvId per id before the row goes away.
 */
export const bulkDeleteCVs = mutation({
  args: { ids: v.array(v.id("cvs")) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    let deleted = 0;
    for (const id of args.ids) {
      await requireOwnedDoc(ctx, id, "CV");
      await cascadeRemoveCV(ctx, userId, id);
      await ctx.db.delete(id);
      deleted++;
    }
    return { deleted };
  },
});

/**
 * Granular helpers for AI agent CRUD. The full `updateCV` mutation
 * requires a deeply nested object — too unwieldy for the model to
 * synthesize correctly. These narrow handlers do read-modify-write
 * server-side so the agent can pass flat args.
 */

export const resolveDefaultCV = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const cvs = await ctx.db
      .query("cvs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (cvs.length === 0) return null;
    return cvs.find((c) => c.isDefault)?._id ?? cvs[0]._id;
  },
});

export const appendExperience = mutation({
  args: {
    cvId: v.optional(v.id("cvs")),
    company: v.string(),
    position: v.string(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    current: v.optional(v.boolean()),
    description: v.optional(v.string()),
    achievements: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const cvId = args.cvId ?? (await resolveCVId(ctx, userId));
    if (!cvId) throw new Error("Belum ada CV — buat CV dulu sebelum tambah pengalaman.");
    await requireOwnedDoc(ctx, cvId, "CV");
    const cv = await ctx.db.get(cvId);
    if (!cv) throw new Error("CV tidak ditemukan");

    const entry = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      company: args.company,
      position: args.position,
      startDate: args.startDate,
      endDate: args.endDate,
      current: args.current ?? !args.endDate,
      description: args.description ?? "",
      achievements: args.achievements ?? [],
    };
    await ctx.db.patch(cvId, {
      experience: [...(cv.experience ?? []), entry],
    });
    return { cvId, entryId: entry.id };
  },
});

export const appendSkills = mutation({
  args: {
    cvId: v.optional(v.id("cvs")),
    skills: v.array(v.string()),
    category: v.optional(v.string()),
    proficiency: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const cvId = args.cvId ?? (await resolveCVId(ctx, userId));
    if (!cvId) throw new Error("Belum ada CV — buat CV dulu sebelum tambah skill.");
    await requireOwnedDoc(ctx, cvId, "CV");
    const cv = await ctx.db.get(cvId);
    if (!cv) throw new Error("CV tidak ditemukan");

    const existing = new Set((cv.skills ?? []).map((s) => s.name.toLowerCase()));
    const newOnes = args.skills
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !existing.has(s.toLowerCase()))
      .map((name, i) => ({
        id: `skill-${Date.now()}-${i}`,
        name,
        category: args.category ?? "general",
        proficiency: args.proficiency ?? 3,
      }));
    if (newOnes.length === 0) return { cvId, added: 0 };
    await ctx.db.patch(cvId, {
      skills: [...(cv.skills ?? []), ...newOnes],
    });
    return { cvId, added: newOnes.length };
  },
});

export const setSummary = mutation({
  args: {
    cvId: v.optional(v.id("cvs")),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const cvId = args.cvId ?? (await resolveCVId(ctx, userId));
    if (!cvId) throw new Error("Belum ada CV — buat CV dulu sebelum edit ringkasan.");
    await requireOwnedDoc(ctx, cvId, "CV");
    const cv = await ctx.db.get(cvId);
    if (!cv) throw new Error("CV tidak ditemukan");
    const personalInfo = {
      ...cv.personalInfo,
      summary: args.summary,
    };
    await ctx.db.patch(cvId, { personalInfo });
    return { cvId };
  },
});

async function resolveCVId(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<Id<"cvs"> | null> {
  const cvs = await ctx.db
    .query("cvs")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  if (cvs.length === 0) return null;
  return cvs.find((c) => c.isDefault)?._id ?? cvs[0]._id;
}

// Quota check used by cv/actions.ts translate(). Called from action via
// internal.cv.mutations._checkTranslateQuota.
export const _checkTranslateQuota = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await enforceRateLimit(ctx, userId, AI_RATE_LIMITS["ai:minute"]);
    await enforceRateLimit(ctx, userId, AI_RATE_LIMITS["ai:day"]);
  },
});
