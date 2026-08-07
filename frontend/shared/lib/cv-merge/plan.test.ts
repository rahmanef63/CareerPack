import { describe, expect, it } from "vitest";

import type { ParsedResume } from "../../../../convex/_shared/resumeShape";
import { applyDecisions, hasChanges } from "./apply";
import { buildMergePlan } from "./plan";
import type { CurrentCV, CurrentProfile, WritePayload } from "./types";

/** Exactly what `bootstrapUser` inserts: a name and three empty strings. */
const bootstrapped = (over: Partial<CurrentProfile> = {}): CurrentProfile => ({
  fullName: "Budi Santoso",
  location: "",
  targetRole: "",
  experienceLevel: "",
  ...over,
});

const emptyCv = (over: Partial<CurrentCV> = {}): CurrentCV => ({
  _id: "cv_1",
  title: "CV Utama",
  personalInfo: { fullName: "", email: "", phone: "", location: "", summary: "" },
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
  projects: [],
  ...over,
});

const profileNotes = (ids: { id: string }[]) => ids.filter((n) => n.id.startsWith("profile."));
const cvNotes = (ids: { id: string }[]) => ids.filter((n) => n.id.startsWith("cv."));

describe("buildMergePlan — the majority path", () => {
  // The whole design lives or dies here: `bootstrapUser` leaves location /
  // targetRole / experienceLevel as "", so if blank-on-mine were a conflict
  // every new user would meet a review pager for fields they never filled in.
  it("treats every bootstrap-blank profile field as an addition, not a conflict", () => {
    const plan = buildMergePlan({
      profile: bootstrapped(),
      cv: emptyCv(),
      parsed: {
        fullName: "Budi Santoso",
        location: "Jakarta",
        headline: "Backend Engineer",
        experienceLevel: "senior",
      },
    });

    expect(plan.conflicts).toHaveLength(0);
    expect(profileNotes(plan.additions).map((n) => n.id)).toEqual([
      "profile.location",
      "profile.targetRole",
      "profile.experienceLevel",
    ]);
    expect(plan.draft.profile).toMatchObject({
      location: "Jakarta",
      targetRole: "Backend Engineer",
      experienceLevel: "senior",
    });
    expect(plan.draft.profile).not.toHaveProperty("fullName");
  });

  it("ignores a field the CV did not mention rather than blanking it", () => {
    const absent = buildMergePlan({
      profile: bootstrapped({ fullName: "Budi" }),
      cv: emptyCv(),
      parsed: {},
    });
    expect(absent.conflicts).toHaveLength(0);
    expect(absent.draft.profile).not.toHaveProperty("fullName");

    // `coerceResumeShape` omits empty strings, but a hand-built payload can
    // still carry one and it must behave identically.
    const blank = buildMergePlan({
      profile: bootstrapped({ fullName: "Budi" }),
      cv: emptyCv(),
      parsed: { fullName: "" },
    });
    expect(blank.conflicts).toHaveLength(0);
    expect(blank.draft.profile).not.toHaveProperty("fullName");
  });

  it("leaves a stored experienceLevel alone when the parse has none", () => {
    const plan = buildMergePlan({
      profile: bootstrapped({ experienceLevel: "senior" }),
      cv: emptyCv(),
      parsed: { fullName: "Budi Santoso" },
    });

    expect(plan.conflicts).toHaveLength(0);
    expect(plan.draft.profile).not.toHaveProperty("experienceLevel");
  });
});

const RICH: ParsedResume = {
  fullName: "Budi Santoso",
  email: "budi@example.com",
  phone: "0812-3456-7890",
  location: "Jakarta",
  headline: "Backend Engineer",
  summary: "Backend engineer dengan 5 tahun pengalaman di fintech.",
  linkedin: "linkedin.com/in/budi",
  experienceLevel: "senior",
  skills: ["Go", "PostgreSQL", "Kubernetes"],
  interests: ["Open source"],
  languages: [{ language: "Indonesia", proficiency: "Native" }, { language: "Inggris" }],
  experience: [
    {
      company: "PT Tokopedia",
      position: "Senior Software Engineer",
      startDate: "2020-03",
      endDate: "2023-01",
      current: false,
      description: "Membangun layanan pembayaran.",
      achievements: ["Menurunkan latensi 40%"],
    },
  ],
  education: [
    { institution: "Universitas Indonesia", degree: "S1", field: "Ilmu Komputer", startDate: "2012-08", endDate: "2016-07" },
  ],
  certifications: [{ name: "AWS Solutions Architect", issuer: "Amazon", date: "2021-06" }],
  projects: [{ name: "Warungku", description: "POS untuk UMKM.", technologies: ["Go", "React"] }],
};

/** Apply a payload the way the mutation would, so the next parse sees the
 *  state the import actually produced. */
function fold(
  profile: CurrentProfile | null,
  cv: CurrentCV | null,
  payload: WritePayload,
): { profile: CurrentProfile; cv: CurrentCV } {
  return {
    profile: { ...(profile ?? {}), ...payload.profile } as CurrentProfile,
    cv: { ...(cv ?? emptyCv()), ...payload.cv },
  };
}

describe("buildMergePlan — idempotency", () => {
  // The user's literal complaint: re-uploading the same CV duplicating rows or
  // creating a second `cvs` row.
  it("re-importing the same CV changes nothing the second time", () => {
    const first = buildMergePlan({ profile: bootstrapped(), cv: null, parsed: RICH });
    const next = fold(bootstrapped(), null, applyDecisions(first, {}));

    const second = buildMergePlan({ profile: next.profile, cv: next.cv, parsed: RICH });

    expect(second.conflicts).toEqual([]);
    expect(second.additions).toEqual([]);
    expect(second.autoMerges).toEqual([]);
    expect(hasChanges(second.draft)).toBe(false);
    expect(second.draft.createCv).toBe(false);
  });

  // A scan the AI could only half-read still has to match itself. Tier 1 is
  // blank (no readable start date) and so is tier 2's second half (no position),
  // which is the one shape where a strict key matches nothing and the row is
  // appended again on every upload.
  it("re-matches a row the parse read down to nothing but a name", () => {
    const parsed: ParsedResume = {
      experience: [{ company: "PT Sinar Jaya" }],
      education: [{ institution: "SMA 1 Bandung" }],
    };
    const first = buildMergePlan({ profile: bootstrapped(), cv: emptyCv(), parsed });
    expect(cvNotes(first.additions)).toHaveLength(2);

    const next = fold(bootstrapped(), emptyCv(), applyDecisions(first, {}));
    const second = buildMergePlan({ profile: next.profile, cv: next.cv, parsed });

    expect(second.additions).toEqual([]);
    expect(second.conflicts).toEqual([]);
    expect(second.draft.cv.experience).toBeUndefined();
    expect(second.draft.cv.education).toBeUndefined();
  });
});

describe("buildMergePlan — record matching", () => {
  const tokopedia = {
    id: "exp_stored",
    company: "PT Tokopedia",
    position: "Senior Software Engineer",
    startDate: "2020-03-01",
    endDate: "2023-01",
    current: false,
    description: "Membangun layanan pembayaran.",
    achievements: [],
  };

  it("matches one job through punctuation and abbreviation", () => {
    const plan = buildMergePlan({
      profile: bootstrapped(),
      cv: emptyCv({ experience: [tokopedia] }),
      parsed: {
        experience: [
          { company: "PT. Tokopedia", position: "Sr. Software Engineer", startDate: "2020-03" },
        ],
      },
    });

    expect(plan.additions).toEqual([]);
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.conflicts[0].kind).toBe("record");
    expect(plan.conflicts[0].ambiguous).toBe(false);
    expect(plan.conflicts[0].id).toBe("cv.experience.pt-tokopedia|2020-03");
    expect(plan.draft.cv.experience).toHaveLength(1);
  });

  it("flags an ambiguous match instead of inventing a third row", () => {
    const plan = buildMergePlan({
      profile: bootstrapped(),
      cv: emptyCv({
        experience: [
          tokopedia,
          { ...tokopedia, id: "exp_stored_2", startDate: "2020-03-15", position: "Staff Engineer" },
        ],
      }),
      parsed: {
        experience: [{ company: "PT Tokopedia", position: "Sr. Software Engineer", startDate: "2020-03" }],
      },
    });

    expect(plan.additions).toEqual([]);
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.conflicts[0].ambiguous).toBe(true);
    expect(plan.draft.cv.experience).toHaveLength(2);
  });

  // `localId()` mints a fresh string on every parse, so an id that happens to
  // collide with a stored one means nothing.
  it("never matches on the element id", () => {
    // `id` is not part of `ParsedResume` at all — the double cast is the point
    // of the test: a payload that smuggles one in must still be matched on
    // business identity.
    const parsed = {
      experience: [
        { id: "exp_stored", company: "Bukalapak", position: "Engineering Manager", startDate: "2023-02" },
      ],
    } as unknown as ParsedResume;

    const plan = buildMergePlan({
      profile: bootstrapped(),
      cv: emptyCv({ experience: [tokopedia] }),
      parsed,
    });

    expect(plan.conflicts).toEqual([]);
    expect(cvNotes(plan.additions)).toHaveLength(1);
    expect(plan.draft.cv.experience).toHaveLength(2);
    expect(plan.draft.cv.experience?.[1].id).toBe("exp-imp-0");
  });
});

describe("buildMergePlan — caps", () => {
  // `capStringArray` THROWS "Skill maksimal 50 entri"; going over would roll
  // back the entire import, so the engine has to stop at 50 itself.
  it("caps the profile skill union at 50 and reports the overflow", () => {
    const stored = Array.from({ length: 45 }, (_, i) => `Skill ${i + 1}`);
    const plan = buildMergePlan({
      profile: bootstrapped({ skills: stored }),
      cv: emptyCv(),
      parsed: { skills: Array.from({ length: 20 }, (_, i) => `Baru ${i + 1}`) },
    });

    const merged = plan.draft.profile.skills as string[];
    expect(merged).toHaveLength(50);
    expect(merged.slice(0, 45)).toEqual(stored);
    expect(plan.ignored.map((n) => n.detail)).toContain("15 skill dilewati (maksimal 50 entri).");
  });
});

describe("buildMergePlan — no CV yet", () => {
  it("turns every CV field into a pure addition and asks nothing", () => {
    const plan = buildMergePlan({
      profile: bootstrapped(),
      cv: null,
      accountEmail: "budi@example.com",
      fileStem: "CV Budi Santoso 2026",
      parsed: RICH,
    });

    expect(plan.draft.createCv).toBe(true);
    expect(plan.draft.cvId).toBeNull();
    expect(cvNotes(plan.conflicts)).toEqual([]);
    expect(plan.draft.cv.title).toBe("CV Budi Santoso 2026");
    expect(plan.draft.cv.personalInfo).toMatchObject({
      fullName: "Budi Santoso",
      email: "budi@example.com",
      location: "Jakarta",
    });
    for (const key of ["experience", "education", "skills", "certifications", "languages", "projects"] as const) {
      expect(plan.draft.cv[key]).toBeDefined();
    }
  });

  it("falls back to a default title when the filename carries nothing", () => {
    const plan = buildMergePlan({ profile: null, cv: null, parsed: { fullName: "Budi Santoso" } });
    expect(plan.draft.cv.title).toBe("CV Impor");
  });
});
