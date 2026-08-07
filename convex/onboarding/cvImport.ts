import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc, authError } from "../_shared/auth";
import { assertShortText } from "../_shared/validate";
import { enforceRateLimit, IMPORT_RATE_LIMITS } from "../_shared/rateLimit";
import { stableHash } from "../_shared/stableHash";
import { validateProfileFields } from "../profile/mutations";
import { validateCVUpdates } from "../cv/mutations";
import type { Doc, Id } from "../_generated/dataModel";

/**
 * Apply a reviewed CV import.
 *
 * Deliberately not `createOrUpdateProfile` (6 required args, so the caller has
 * to read back and re-send fields it never touched — that is how the old
 * LinkedIn button wrote "Anonymous" / "—" / "mid-level" over real data) and
 * not `quickFill` (always inserts a fresh `cvs` row, so it can never merge).
 * The payload comes from the client merge engine and carries ONLY the keys
 * that change, plus a hash of what the client believed was stored for each of
 * them.
 */

/** Field lists the payload is filtered through — an unexpected key from the
 *  wire never reaches the validators, let alone the row. */
const PROFILE_TEXT_FIELDS = [
  "fullName",
  "phone",
  "location",
  "targetRole",
  "experienceLevel",
  "bio",
] as const;
const PROFILE_LIST_FIELDS = ["skills", "interests"] as const;
const CV_ARRAY_FIELDS = [
  "experience",
  "education",
  "skills",
  "certifications",
  "languages",
  "projects",
] as const;

/** Above this the snapshot alone would crowd the 1 MiB Convex document cap,
 *  so the batch row records the profile only and says so. */
const CV_SNAPSHOT_MAX = 400_000;

type ProfileFields = Parameters<typeof validateProfileFields>[0];
type CVUpdates = Parameters<typeof validateCVUpdates>[0];
type ProfilePatch = Partial<
  Omit<Doc<"userProfiles">, "_id" | "_creationTime" | "userId">
>;

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Column name -> what the user calls it. A drift warning is the one message
 *  in this flow the user has to act on, so it cannot read like a stack trace. */
const FIELD_LABEL: Record<string, string> = {
  fullName: "Nama lengkap",
  phone: "Nomor telepon",
  location: "Lokasi",
  targetRole: "Role tujuan",
  experienceLevel: "Level pengalaman",
  bio: "Bio",
  skills: "Skill",
  interests: "Minat",
  personalInfo: "Data pribadi di CV",
  experience: "Pengalaman kerja",
  education: "Pendidikan",
  certifications: "Sertifikat",
  languages: "Bahasa",
  projects: "Proyek",
};

function driftWarning(key: string): string {
  return `${FIELD_LABEL[key] ?? key} dilewati — kamu mengubahnya di tempat lain sejak meninjau impor ini.`;
}

/**
 * Keys whose stored value no longer hashes to what the client saw. The dialog
 * can sit open for minutes and there is no version column on any table, so
 * this is the entire concurrency story: a drifted key is dropped, the rest of
 * the import still lands.
 */
function driftedKeys(
  payload: Record<string, unknown>,
  expect: Record<string, string> | undefined,
  stored: Record<string, unknown> | null,
  warnings: string[],
): Set<string> {
  const skip = new Set<string>();
  if (!expect) return skip;
  for (const key of Object.keys(payload)) {
    const expected = expect[key];
    if (expected === undefined) continue;
    // The raw stored column, exactly what the engine hashed on the client. An
    // absent column hashes as `undefined` on both sides, so a never-written
    // field agrees without a special case.
    if (stableHash(stored?.[key]) === expected) continue;
    skip.add(key);
    warnings.push(driftWarning(key));
  }
  return skip;
}

function pickProfileFields(
  raw: Record<string, unknown>,
  skip: Set<string>,
): ProfileFields {
  const out: ProfileFields = {};
  for (const key of PROFILE_TEXT_FIELDS) {
    if (skip.has(key)) continue;
    const value = raw[key];
    if (typeof value === "string") out[key] = value;
  }
  for (const key of PROFILE_LIST_FIELDS) {
    if (skip.has(key)) continue;
    const value = raw[key];
    if (Array.isArray(value)) {
      out[key] = value.filter((entry): entry is string => typeof entry === "string");
    }
  }
  return out;
}

function pickCvUpdates(
  raw: Record<string, unknown>,
  skip: Set<string>,
): CVUpdates {
  const out: CVUpdates = {};
  const take = <K extends keyof CVUpdates>(
    key: K,
    accepts: (value: unknown) => boolean,
  ) => {
    if (skip.has(key)) return;
    const value = raw[key];
    if (value === undefined || !accepts(value)) return;
    out[key] = value as CVUpdates[K];
  };
  take("title", (value) => typeof value === "string");
  take("personalInfo", (value) => Object.keys(asRecord(value)).length > 0);
  for (const key of CV_ARRAY_FIELDS) take(key, Array.isArray);
  return out;
}

export const applyCvImport = mutation({
  args: {
    profile: v.optional(v.record(v.string(), v.any())),
    profileExpect: v.optional(v.record(v.string(), v.string())),
    cvId: v.optional(v.id("cvs")),
    createCv: v.optional(v.boolean()),
    cv: v.optional(v.any()),
    cvExpect: v.optional(v.record(v.string(), v.string())),
    source: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    /** null when the import changed nothing — there is no undo to offer. */
    batchId: Id<"quickFillBatches"> | null;
    profileTouched: boolean;
    cv: "created" | "merged" | "unchanged";
    warnings: string[];
  }> => {
    const userId = await requireUser(ctx);

    // Demo accounts have no email. Their UI reads a localStorage overlay, so a
    // server write shows nothing changing — and both quickFill demo gates are
    // client-side only, which is exactly the kind of gate that stops existing
    // the moment somebody calls the mutation directly.
    const user = await ctx.db.get(userId);
    if (!user?.email) {
      // authError, not a plain Error: prod Convex redacts an uncaught Error to
      // "Server Error", and this message is the only thing telling the visitor
      // what to do about it.
      throw authError(
        "Impor CV tidak tersedia untuk akun demo. Daftar gratis dulu untuk menyimpan ke server.",
      );
    }

    await enforceRateLimit(ctx, userId, IMPORT_RATE_LIMITS["import:merge"]);

    // Persisted verbatim onto the batch row, so it gets the same cap as every
    // other free-text column rather than trusting the caller's label.
    const source = assertShortText(args.source, 40, "Sumber");

    const warnings: string[] = [];
    const createCv = args.createCv === true;

    const profileDoc = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    // Ownership before the hash, not after: a drift warning on somebody else's
    // document would answer "does this id exist and what is in it".
    const cvDoc =
      !createCv && args.cvId
        ? await requireOwnedDoc(ctx, args.cvId, "CV")
        : null;

    const rawProfile = asRecord(args.profile);
    const rawCv = asRecord(args.cv);

    const profileDrift = driftedKeys(
      rawProfile,
      args.profileExpect,
      profileDoc as Record<string, unknown> | null,
      warnings,
    );
    // A create has nothing to have drifted from — there is no stored document
    // and the whole payload is an addition. Skipping the comparison rather
    // than relying on it agreeing keeps a caller that sends `createCv` next to
    // a `cvExpect` built against some other row from inserting a stripped CV.
    const cvDrift = createCv
      ? new Set<string>()
      : driftedKeys(
          rawCv,
          args.cvExpect,
          cvDoc as Record<string, unknown> | null,
          warnings,
        );

    // ---- Snapshots, taken before the first write -----------------------
    let profileSnapshot: unknown = null;
    if (profileDoc) {
      const { _id: _omitId, _creationTime: _omitTs, ...rest } = profileDoc;
      profileSnapshot = rest;
    }

    const cvSnapshots: Array<{ cvId: Id<"cvs">; doc: unknown }> = [];
    if (cvDoc) {
      if (JSON.stringify(cvDoc).length > CV_SNAPSHOT_MAX) {
        warnings.push(
          "CV terlalu besar untuk snapshot — 'Batalkan impor' hanya akan mengembalikan profil.",
        );
      } else {
        const { _id: _omitId, _creationTime: _omitTs, ...rest } = cvDoc;
        cvSnapshots.push({ cvId: cvDoc._id, doc: rest });
      }
    }

    // ---- Profile -------------------------------------------------------
    const patch: ProfilePatch = {};
    for (const [key, value] of Object.entries(
      validateProfileFields(pickProfileFields(rawProfile, profileDrift)),
    )) {
      // Adding keys only. `validateProfileFields` maps a blank phone/bio to
      // `undefined`, and Convex reads an explicitly-present `undefined` as
      // "delete this column" — on the required userProfiles strings that
      // throws and rolls back the whole mutation (see the comment in
      // mutations.ts:quickFill, which is where it happened in production).
      if (value !== undefined) (patch as Record<string, unknown>)[key] = value;
    }

    let profileTouched = false;
    let profileWasInsert = false;
    if (Object.keys(patch).length > 0) {
      if (profileDoc) {
        await ctx.db.patch(profileDoc._id, patch);
      } else {
        // Same five-required-field shape `bootstrapUser` writes, so a profile
        // created by an import is indistinguishable from one created at signup.
        await ctx.db.insert("userProfiles", {
          userId,
          fullName: "",
          location: "",
          targetRole: "",
          experienceLevel: "",
          ...patch,
        });
        profileWasInsert = true;
      }
      profileTouched = true;
    }

    // ---- CV ------------------------------------------------------------
    const updates = validateCVUpdates(pickCvUpdates(rawCv, cvDrift));
    const cvIds: Id<"cvs">[] = [];
    let cvOutcome: "created" | "merged" | "unchanged" = "unchanged";

    if (createCv) {
      const firstCv = await ctx.db
        .query("cvs")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      // Bypassing `sanitizeCV` on purpose: its `if (!fullName || !email)
      // return null` drops the entire CV over a missing `@`, which on this
      // path means losing everything the user just reviewed.
      const cvId = await ctx.db.insert("cvs", {
        userId,
        title: updates.title ?? "CV Impor",
        template: "modern",
        isDefault: firstCv === null,
        personalInfo: updates.personalInfo ?? {
          fullName: "",
          email: "",
          phone: "",
          location: "",
          summary: "",
        },
        experience: updates.experience ?? [],
        education: updates.education ?? [],
        skills: updates.skills ?? [],
        certifications: updates.certifications ?? [],
        languages: updates.languages ?? [],
        projects: updates.projects ?? [],
      });
      cvIds.push(cvId);
      cvOutcome = "created";
    } else if (cvDoc && Object.keys(updates).length > 0) {
      await ctx.db.patch(cvDoc._id, updates);
      cvOutcome = "merged";
    }

    // An import that changed nothing gets no batch row. Writing one anyway
    // puts an entry in Riwayat whose "Urungkan" restores a snapshot identical
    // to what is already stored — a control that visibly does nothing is worse
    // than no control. The usual cause is every key drifting, which the
    // warnings already explain.
    if (!profileTouched && cvOutcome === "unchanged") {
      return { batchId: null, profileTouched, cv: cvOutcome, warnings };
    }

    const batchId = await ctx.db.insert("quickFillBatches", {
      userId,
      scope: "cv-import",
      source,
      createdAt: Date.now(),
      profileTouched,
      profileWasInsert,
      profileSnapshot: profileTouched ? profileSnapshot ?? undefined : undefined,
      cvIds,
      cvSnapshots: cvOutcome === "merged" ? cvSnapshots : [],
      portfolioIds: [],
      goalIds: [],
      applicationIds: [],
      contactIds: [],
      warnings,
      undone: false,
    });

    return { batchId, profileTouched, cv: cvOutcome, warnings };
  },
});
