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
 * who run this twice get duplicates by design — the dialog warns
 * before each run.
 */
export const quickFill = mutation({
  args: { payload: v.any() },
  handler: async (ctx, args): Promise<QuickFillResult> => {
    const userId = await requireUser(ctx);
    const result: QuickFillResult = {
      profile: false,
      cv: false,
      portfolio: { added: 0, skipped: 0 },
      goals: { added: 0, skipped: 0 },
      applications: { added: 0, skipped: 0 },
      contacts: { added: 0, skipped: 0 },
      warnings: [],
    };

    const pre = preflightPayload(args.payload);
    if (!pre.ok) {
      result.warnings.push(pre.reason ?? "Payload tidak valid");
      return result;
    }

    const payload = args.payload as Record<string, unknown>;

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
        const data = {
          userId,
          fullName: cleaned.fullName,
          phone: cleaned.phone,
          location: cleaned.location,
          targetRole: cleaned.targetRole,
          experienceLevel: cleaned.experienceLevel,
          bio: cleaned.bio,
          skills: cleaned.skills,
          interests: cleaned.interests,
        };
        if (existing) {
          await ctx.db.patch(existing._id, data);
        } else {
          await ctx.db.insert("userProfiles", data);
        }
        result.profile = true;
      }
    }

    // ---- CV (always insert as new) ---------------------------------
    if (payload.cv !== undefined) {
      const cleaned = sanitizeCV(payload.cv);
      if (!cleaned) {
        result.warnings.push(
          "CV dilewati: butuh personalInfo.fullName + personalInfo.email.",
        );
      } else {
        await ctx.db.insert("cvs", {
          userId,
          ...cleaned,
        });
        result.cv = true;
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
        await ctx.db.insert("portfolioItems", {
          userId,
          ...cleaned,
        });
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
        await ctx.db.insert("careerGoals", {
          userId,
          ...cleaned,
        });
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
        await ctx.db.insert("jobApplications", {
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
        await ctx.db.insert("contacts", {
          userId,
          ...cleaned,
        });
        result.contacts.added++;
      }
      if (result.contacts.skipped > 0) {
        result.warnings.push(
          `${result.contacts.skipped} kontak dilewati (butuh name).`,
        );
      }
    }

    return result;
  },
});
