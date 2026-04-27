import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser } from "../_shared/auth";
import {
  preflightPayload,
  sanitizeApplication,
  sanitizeContact,
  sanitizeCV,
  sanitizeGoal,
  sanitizePortfolioItem,
  sanitizeProfile,
} from "./sanitize";
import type { QuickFillResult } from "./types";
import type { Id, Doc } from "../_generated/dataModel";

/**
 * Quick-fill orchestrator — takes a single JSON payload (parsed
 * server-side via v.any() — we don't trust shape) and dispatches
 * each section to its underlying table.
 *
 * Best-effort: a malformed section is skipped, not blocked. The
 * result object reports per-section counts so the UI can show
 * "✓ Profil, ✓ CV, ⚠ 3 dari 5 portofolio (2 dilewati: URL invalid)".
 *
 * Idempotency: we DO NOT delete existing data. Profile is upsert
 * (patch existing or insert new), CV is inserted as a new entry,
 * portfolio / goals / applications / contacts are appended. Users
 * who run this twice get duplicates by design — every run logs to
 * `quickFillBatches` so the user can undo a specific bad import
 * without losing other entries.
 */
export const quickFill = mutation({
  args: {
    payload: v.any(),
    scope: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<QuickFillResult & { batchId: Id<"quickFillBatches"> | null }> => {
    const userId = await requireUser(ctx);
    const result: QuickFillResult & {
      batchId: Id<"quickFillBatches"> | null;
    } = {
      profile: false,
      cv: false,
      portfolio: { added: 0, skipped: 0 },
      goals: { added: 0, skipped: 0 },
      applications: { added: 0, skipped: 0 },
      contacts: { added: 0, skipped: 0 },
      warnings: [],
      batchId: null,
    };

    const pre = preflightPayload(args.payload);
    if (!pre.ok) {
      result.warnings.push(pre.reason ?? "Payload tidak valid");
      return result;
    }

    const payload = args.payload as Record<string, unknown>;

    // Track inserted IDs + profile snapshot for undo.
    const cvIds: Id<"cvs">[] = [];
    const portfolioIds: Id<"portfolioItems">[] = [];
    const goalIds: Id<"careerGoals">[] = [];
    const applicationIds: Id<"jobApplications">[] = [];
    const contactIds: Id<"contacts">[] = [];
    let profileTouched = false;
    let profileWasInsert = false;
    let profileSnapshot: unknown = null;

    // ---- Profile (upsert) ------------------------------------------
    if (payload.profile !== undefined) {
      const cleaned = sanitizeProfile(payload.profile);
      if (!cleaned) {
        result.warnings.push(
          "Profil dilewati: butuh fullName + location + targetRole.",
        );
      } else {
        const existing = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();
        if (existing) {
          // Snapshot pre-patch so undo can restore. Drop _id+_creationTime
          // since those are immutable and not patch-able anyway.
          const { _id: _omitId, _creationTime: _omitTs, ...rest } = existing;
          profileSnapshot = rest;
          profileWasInsert = false;
          await ctx.db.patch(existing._id, {
            fullName: cleaned.fullName,
            location: cleaned.location,
            targetRole: cleaned.targetRole,
            phone: cleaned.phone,
            bio: cleaned.bio,
            experienceLevel: cleaned.experienceLevel,
            skills: cleaned.skills,
            interests: cleaned.interests,
          });
        } else {
          profileSnapshot = null;
          profileWasInsert = true;
          await ctx.db.insert("userProfiles", {
            userId,
            fullName: cleaned.fullName,
            location: cleaned.location,
            targetRole: cleaned.targetRole,
            experienceLevel: cleaned.experienceLevel ?? "junior",
            phone: cleaned.phone,
            bio: cleaned.bio,
            skills: cleaned.skills,
            interests: cleaned.interests,
          });
        }
        profileTouched = true;
        result.profile = true;
      }
    }

    // ---- CV (always insert as new) ---------------------------------
    if (payload.cv !== undefined) {
      const cleaned = sanitizeCV(payload.cv);
      if (!cleaned) {
        result.warnings.push(
          "CV dilewati: butuh personalInfo.fullName + personalInfo.email (atau alias di root: fullName/name + email).",
        );
      } else {
        const cvId = await ctx.db.insert("cvs", {
          userId,
          ...cleaned.cv,
        });
        cvIds.push(cvId);
        result.cv = true;
        const d = cleaned.dropped;
        const dropDetails: string[] = [];
        if (d.experience) dropDetails.push(`${d.experience} pengalaman (butuh company + position + startDate)`);
        if (d.education) dropDetails.push(`${d.education} pendidikan (butuh institution)`);
        if (d.skills) dropDetails.push(`${d.skills} skill (butuh name)`);
        if (d.certifications) dropDetails.push(`${d.certifications} sertifikasi (butuh name)`);
        if (d.languages) dropDetails.push(`${d.languages} bahasa (butuh language + proficiency)`);
        if (d.projects) dropDetails.push(`${d.projects} proyek (butuh name)`);
        if (dropDetails.length > 0) {
          result.warnings.push(`CV: dilewati ${dropDetails.join("; ")}.`);
        }
      }
    }

    // ---- Portfolio ---------------------------------------------------
    if (Array.isArray(payload.portfolio)) {
      for (const raw of payload.portfolio) {
        const cleaned = sanitizePortfolioItem(raw);
        if (!cleaned) {
          result.portfolio.skipped++;
          continue;
        }
        const id = await ctx.db.insert("portfolioItems", {
          userId,
          ...cleaned,
        });
        portfolioIds.push(id);
        result.portfolio.added++;
      }
      if (result.portfolio.skipped > 0) {
        result.warnings.push(
          `${result.portfolio.skipped} portofolio dilewati (data minimum: title + description + date).`,
        );
      }
    }

    // ---- Goals -------------------------------------------------------
    if (Array.isArray(payload.goals)) {
      for (const raw of payload.goals) {
        const cleaned = sanitizeGoal(raw);
        if (!cleaned) {
          result.goals.skipped++;
          continue;
        }
        const id = await ctx.db.insert("careerGoals", {
          userId,
          ...cleaned,
        });
        goalIds.push(id);
        result.goals.added++;
      }
      if (result.goals.skipped > 0) {
        result.warnings.push(
          `${result.goals.skipped} goal dilewati (butuh title + description).`,
        );
      }
    }

    // ---- Applications -----------------------------------------------
    if (Array.isArray(payload.applications)) {
      for (const raw of payload.applications) {
        const cleaned = sanitizeApplication(raw);
        if (!cleaned) {
          result.applications.skipped++;
          continue;
        }
        const id = await ctx.db.insert("jobApplications", {
          userId,
          company: cleaned.company,
          position: cleaned.position,
          location: cleaned.location,
          salary: cleaned.salary,
          status: cleaned.status,
          appliedDate: cleaned.appliedDate,
          source: cleaned.source,
          notes: cleaned.notes,
          interviewDates: [],
          documents: [],
        });
        applicationIds.push(id);
        result.applications.added++;
      }
      if (result.applications.skipped > 0) {
        result.warnings.push(
          `${result.applications.skipped} lamaran dilewati (butuh company + position).`,
        );
      }
    }

    // ---- Contacts ----------------------------------------------------
    if (Array.isArray(payload.contacts)) {
      for (const raw of payload.contacts) {
        const cleaned = sanitizeContact(raw);
        if (!cleaned) {
          result.contacts.skipped++;
          continue;
        }
        const id = await ctx.db.insert("contacts", {
          userId,
          ...cleaned,
        });
        contactIds.push(id);
        result.contacts.added++;
      }
      if (result.contacts.skipped > 0) {
        result.warnings.push(
          `${result.contacts.skipped} kontak dilewati (butuh name).`,
        );
      }
    }

    // Persist a batch row only if at least one thing was actually
    // inserted or patched. Empty calls don't pollute the log.
    const anything =
      profileTouched ||
      cvIds.length > 0 ||
      portfolioIds.length > 0 ||
      goalIds.length > 0 ||
      applicationIds.length > 0 ||
      contactIds.length > 0;
    if (anything) {
      const batchId = await ctx.db.insert("quickFillBatches", {
        userId,
        scope: args.scope ?? "all",
        createdAt: Date.now(),
        profileTouched,
        profileWasInsert,
        profileSnapshot: profileSnapshot ?? undefined,
        cvIds,
        portfolioIds,
        goalIds,
        applicationIds,
        contactIds,
        warnings: result.warnings,
        undone: false,
      });
      result.batchId = batchId;
    }

    return result;
  },
});

/**
 * Roll back a single Quick Fill batch. Deletes only the rows that
 * particular import inserted (preserving everything else the user
 * has added since), and reverts the profile patch from the snapshot.
 * The batch row is kept and marked `undone:true` so the history view
 * still shows it.
 */
export const undoBatch = mutation({
  args: { batchId: v.id("quickFillBatches") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const batch = await ctx.db.get(args.batchId);
    if (!batch) throw new Error("Batch tidak ditemukan");
    if (batch.userId !== userId) throw new Error("Batch tidak ditemukan");
    if (batch.undone) throw new Error("Batch sudah pernah dibatalkan");

    let deleted = 0;

    // Inline delete loops — the cross-table generic helper hits TS
    // discriminated-union narrowing weirdness that's not worth
    // working around. Each table's userId is a string at runtime so
    // the comparison is the same shape regardless.
    const safeDelete = async (
      ids: Array<Id<"cvs"> | Id<"portfolioItems"> | Id<"careerGoals"> | Id<"jobApplications"> | Id<"contacts">>,
    ) => {
      for (const id of ids) {
        const doc = await ctx.db.get(id);
        if (!doc) continue;
        // All five tables include `userId` per their schema fragments.
        const ownerId = (doc as unknown as { userId: Id<"users"> }).userId;
        if (ownerId !== userId) continue;
        await ctx.db.delete(id);
        deleted++;
      }
    };

    await safeDelete(batch.cvIds);
    await safeDelete(batch.portfolioIds);
    await safeDelete(batch.goalIds);
    await safeDelete(batch.applicationIds);
    await safeDelete(batch.contactIds);

    // Profile revert — patch back to snapshot, or delete the row if
    // the batch is the one that created it.
    if (batch.profileTouched) {
      const profileRow = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      if (profileRow) {
        if (batch.profileWasInsert) {
          await ctx.db.delete(profileRow._id);
        } else if (batch.profileSnapshot) {
          // Snapshot was a Doc<"userProfiles"> minus the system fields.
          // Cast back to that shape — `replace` is union-typed across
          // all tables, so we narrow via `unknown` then the concrete
          // doc type.
          type ProfileWithoutSystem = Omit<Doc<"userProfiles">, "_id" | "_creationTime">;
          const snap = batch.profileSnapshot as unknown as ProfileWithoutSystem;
          await ctx.db.replace(profileRow._id, snap);
        }
      }
    }

    await ctx.db.patch(args.batchId, {
      undone: true,
      undoneAt: Date.now(),
    });

    return { deleted };
  },
});
