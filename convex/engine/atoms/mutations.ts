import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireUser } from "../../_shared/auth";
import { sanitizeAIInput } from "../../_shared/sanitize";
import {
  ATOM_TYPES,
  atomHash,
  experienceAchievementRef,
  singletonRef,
  type AtomType,
} from "./lib";

const typeValidator = v.union(
  ...ATOM_TYPES.map((t) => v.literal(t)),
) as ReturnType<typeof v.union<[ReturnType<typeof v.literal<AtomType>>]>>;

/**
 * Insert a single attested claim into the ledger. Idempotent on
 * (userId, hash) — replays return the existing atom unchanged.
 */
export const add = mutation({
  args: {
    cvId: v.id("cvs"),
    claim: v.string(),
    type: typeValidator,
    sourceRef: v.optional(v.string()),
    proofStorageId: v.optional(v.id("_storage")),
  },
  returns: v.id("truthAtoms"),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    // Ownership check on the parent CV.
    const cv = await ctx.db.get(args.cvId);
    if (!cv || cv.userId !== userId) throw new Error("CV tidak ditemukan");

    const claim = sanitizeAIInput(args.claim).trim();
    if (claim.length === 0) throw new Error("Klaim tidak boleh kosong");
    if (claim.length > 2_000) throw new Error("Klaim terlalu panjang (max 2000)");

    const attestedAt = Date.now();
    const hash = atomHash({
      userId,
      cvId: args.cvId,
      claim,
      type: args.type,
      sourceRef: args.sourceRef,
      attestedAt,
    });

    // Dedup — same hash + same user = already attested, return existing.
    const existing = await ctx.db
      .query("truthAtoms")
      .withIndex("by_hash", (q) => q.eq("hash", hash))
      .first();
    if (existing && existing.userId === userId) return existing._id;

    return await ctx.db.insert("truthAtoms", {
      userId,
      cvId: args.cvId,
      claim,
      type: args.type,
      sourceRef: args.sourceRef,
      proofStorageId: args.proofStorageId,
      hash,
      attestedAt,
    });
  },
});

/**
 * Supersede an existing atom — never mutates the original row. The
 * old atom keeps its content but gains `supersededBy` pointing to the
 * new atom, preserving claim history for audit.
 */
export const supersede = mutation({
  args: {
    atomId: v.id("truthAtoms"),
    claim: v.string(),
  },
  returns: v.id("truthAtoms"),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const old = await ctx.db.get(args.atomId);
    if (!old || old.userId !== userId) {
      throw new Error("Atom tidak ditemukan");
    }
    if (old.supersededBy !== undefined) {
      throw new Error("Atom sudah digantikan");
    }

    const claim = sanitizeAIInput(args.claim).trim();
    if (claim.length === 0) throw new Error("Klaim tidak boleh kosong");
    if (claim.length > 2_000) throw new Error("Klaim terlalu panjang");

    const attestedAt = Date.now();
    const hash = atomHash({
      userId,
      cvId: old.cvId,
      claim,
      type: old.type,
      sourceRef: old.sourceRef,
      attestedAt,
    });

    const newId = await ctx.db.insert("truthAtoms", {
      userId,
      cvId: old.cvId,
      claim,
      type: old.type,
      sourceRef: old.sourceRef,
      proofStorageId: old.proofStorageId,
      hash,
      attestedAt,
    });
    await ctx.db.patch(args.atomId, { supersededBy: newId });
    return newId;
  },
});

/**
 * Hard-delete an atom — used when the user retracts a claim. The
 * audit-trail purist option would be a `retractedAt` field instead,
 * but for Phase 1 we keep the API surface small. Soft-delete via
 * supersession is the preferred path for edits.
 */
export const remove = mutation({
  args: { atomId: v.id("truthAtoms") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const atom = await ctx.db.get(args.atomId);
    if (!atom || atom.userId !== userId) {
      throw new Error("Atom tidak ditemukan");
    }
    await ctx.db.delete(args.atomId);
    return null;
  },
});

/**
 * Bootstrap the ledger from an existing CV's experience.achievements
 * + skills + projects + certifications + summary. Idempotent via the
 * hash dedup in `add`. Run once per CV when the user opts in to the
 * Truth Ledger flow.
 *
 * Returns the number of newly-inserted atoms (existing ones counted as
 * 0 due to hash dedup).
 */
export const seedFromCV = mutation({
  args: { cvId: v.id("cvs") },
  returns: v.object({
    inserted: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, { cvId }) => {
    const userId = await requireUser(ctx);
    const cv = await ctx.db.get(cvId);
    if (!cv || cv.userId !== userId) throw new Error("CV tidak ditemukan");

    let inserted = 0;
    let skipped = 0;

    const upsert = async (
      claim: string,
      type: AtomType,
      sourceRef: string | undefined,
    ): Promise<void> => {
      const trimmed = sanitizeAIInput(claim).trim();
      if (trimmed.length === 0) return;

      // Use a deterministic attestedAt for the seed pass so re-seeding
      // the same CV produces the same hashes → idempotent.
      const attestedAt = cv._creationTime;
      const hash = atomHash({
        userId,
        cvId,
        claim: trimmed,
        type,
        sourceRef,
        attestedAt,
      });
      const existing = await ctx.db
        .query("truthAtoms")
        .withIndex("by_hash", (q) => q.eq("hash", hash))
        .first();
      if (existing && existing.userId === userId) {
        skipped++;
        return;
      }
      await ctx.db.insert("truthAtoms", {
        userId,
        cvId,
        claim: trimmed,
        type,
        sourceRef,
        hash,
        attestedAt,
      });
      inserted++;
    };

    if (cv.personalInfo?.summary) {
      await upsert(cv.personalInfo.summary, "summary", "summary:profile");
    }

    for (const exp of cv.experience ?? []) {
      const roleRef = singletonRef("role", exp.id);
      await upsert(
        `${exp.position} di ${exp.company}`,
        "role",
        roleRef,
      );
      const achievements = exp.achievements ?? [];
      for (let i = 0; i < achievements.length; i++) {
        await upsert(
          achievements[i],
          "achievement",
          experienceAchievementRef(exp.id, i),
        );
      }
    }

    for (const edu of cv.education ?? []) {
      const ref = singletonRef("education", edu.id);
      await upsert(
        `${edu.degree} ${edu.field} di ${edu.institution}`,
        "education",
        ref,
      );
    }

    for (const skill of cv.skills ?? []) {
      const ref = singletonRef("skill", skill.id);
      await upsert(skill.name, "skill", ref);
    }

    for (const cert of cv.certifications ?? []) {
      const ref = singletonRef("certification", cert.id);
      await upsert(`${cert.name} — ${cert.issuer}`, "certification", ref);
    }

    for (const proj of cv.projects ?? []) {
      const ref = singletonRef("project", proj.id);
      const summary = proj.description
        ? `${proj.name}: ${proj.description}`
        : proj.name;
      await upsert(summary, "project", ref);
    }

    return { inserted, skipped };
  },
});
