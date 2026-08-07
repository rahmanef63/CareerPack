import { describe, expect, it } from "vitest";

import type { ParsedResume } from "../../../../convex/_shared/resumeShape";
import { applyDecisions } from "./apply";
import { buildMergePlan } from "./plan";
import type { CurrentCV, CurrentProfile, MergePlan, Side } from "./types";

const profile: CurrentProfile = {
  fullName: "Budi Santoso",
  phone: "0812-1111-2222",
  location: "Bandung",
  targetRole: "Backend Engineer",
  experienceLevel: "mid-level",
  bio: "Backend engineer, 4 tahun.",
  skills: ["Go"],
};

const cv: CurrentCV = {
  _id: "cv_1",
  title: "CV Utama",
  personalInfo: {
    fullName: "Budi Santoso",
    email: "budi@lama.com",
    phone: "0812-1111-2222",
    location: "Bandung",
    summary: "Backend engineer, 4 tahun.",
    avatarStorageId: "kg2abc",
    avatarUrl: "https://cdn.example.com/budi.png",
  },
  experience: [
    { id: "e1", company: "PT Alpha", position: "Junior Engineer", startDate: "2018-01", endDate: "2020-01", current: false, description: "Layanan katalog.", achievements: [] },
    { id: "e2", company: "PT Beta", position: "Engineer", startDate: "2020-02", endDate: "2022-02", current: false, description: "Layanan pesanan.", achievements: [] },
    { id: "e3", company: "PT Gamma", position: "Engineer", startDate: "2022-03", current: true, description: "Layanan pembayaran.", achievements: [] },
  ],
  education: [],
  skills: [{ id: "s1", name: "Go", category: "Bahasa", proficiency: 5 }],
  certifications: [],
  languages: [],
  projects: [],
};

const parsed: ParsedResume = {
  fullName: "Budi Santosa",
  email: "budi@baru.com",
  location: "Jakarta",
  summary: "Backend engineer, 5 tahun di fintech.",
  experienceLevel: "senior",
  skills: ["Go", "Rust"],
  experience: [
    { company: "PT Alpha", position: "Software Engineer", startDate: "2018-01" },
    { company: "PT Beta", position: "Senior Engineer", startDate: "2020-02" },
    { company: "PT Gamma", position: "Lead Engineer", startDate: "2022-03" },
  ],
};

const plan: MergePlan = buildMergePlan({ profile, cv, parsed });
const allTheirs: Record<string, Side> = Object.fromEntries(
  plan.conflicts.map((c) => [c.id, "theirs" as const]),
);

/** Convex reads an explicitly-present `undefined` as "delete this column",
 *  which on a required string throws and rolls back the whole import. */
function findUndefined(value: unknown, path: string, out: string[]): void {
  if (value === undefined) {
    out.push(path);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => findUndefined(item, `${path}[${i}]`, out));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      findUndefined(item, `${path}.${key}`, out);
    }
  }
}

const undefinedPaths = (payload: unknown) => {
  const out: string[] = [];
  findUndefined(payload, "$", out);
  return out;
};

describe("applyDecisions", () => {
  it("covers all three conflict kinds in this fixture", () => {
    const kinds = new Set(plan.conflicts.map((c) => c.kind));
    expect(kinds).toEqual(new Set(["text", "longText", "record"]));
  });

  it("never emits an explicit undefined, under any decision", () => {
    expect(undefinedPaths(applyDecisions(plan, {}))).toEqual([]);
    expect(undefinedPaths(applyDecisions(plan, allTheirs))).toEqual([]);
    for (const conflict of plan.conflicts) {
      for (const side of ["mine", "theirs"] as const) {
        expect(undefinedPaths(applyDecisions(plan, { [conflict.id]: side }))).toEqual([]);
      }
    }
  });

  // An undecided conflict must contribute no key at all. Re-sending mine's
  // value would clobber whatever a concurrent edit put there.
  it("returns the draft untouched when nothing was decided", () => {
    const out = applyDecisions(plan, {});
    expect(out).toEqual(plan.draft);
    expect(out).not.toBe(plan.draft);
    for (const conflict of plan.conflicts) {
      if (conflict.apply.on !== "profile") continue;
      expect(out.profile).not.toHaveProperty(conflict.apply.field);
    }
  });

  it("writes three conflicts on one array to three distinct indices", () => {
    const ids = plan.conflicts.filter((c) => c.kind === "record").map((c) => c.id);
    expect(ids).toHaveLength(3);

    const out = applyDecisions(plan, {
      [ids[0]]: "theirs",
      [ids[1]]: "mine",
      [ids[2]]: "theirs",
    });

    expect(out.cv.experience).toHaveLength(3);
    expect(out.cv.experience?.map((e) => e.id)).toEqual(["e1", "e2", "e3"]);
    expect(out.cv.experience?.map((e) => e.position)).toEqual([
      "Software Engineer",
      "Engineer",
      "Lead Engineer",
    ]);
  });

  it("keeps personalInfo complete and hangs on to the CV photo", () => {
    for (const decisions of [{}, allTheirs]) {
      const info = applyDecisions(plan, decisions).cv.personalInfo;
      expect(info).toBeDefined();
      for (const key of ["fullName", "email", "phone", "location", "summary"] as const) {
        expect(typeof info?.[key]).toBe("string");
      }
      expect(info?.avatarStorageId).toBe("kg2abc");
      expect(info?.avatarUrl).toBe("https://cdn.example.com/budi.png");
    }
  });

  it("carries a drift token for every key it intends to write", () => {
    for (const decisions of [{}, allTheirs]) {
      const out = applyDecisions(plan, decisions);
      for (const key of Object.keys(out.profile)) {
        expect(out.profileExpect).toHaveProperty(key);
      }
      for (const key of Object.keys(out.cv)) {
        expect(out.cvExpect).toHaveProperty(key);
      }
    }
  });

  it("ignores an unknown decision id and leaves tuned skill levels alone", () => {
    const out = applyDecisions(plan, { "cv.experience.tidak-ada|1999-01": "theirs" });
    expect(out).toEqual(applyDecisions(plan, {}));

    const skills = out.cv.skills ?? [];
    expect(skills.find((s) => s.name === "Go")?.proficiency).toBe(5);
    const rust = skills.find((s) => s.name === "Rust");
    expect(rust).toBeDefined();
    expect(Number.isInteger(rust?.proficiency)).toBe(true);
    expect(rust?.proficiency).toBeGreaterThanOrEqual(1);
    expect(rust?.proficiency).toBeLessThanOrEqual(5);
  });
});
