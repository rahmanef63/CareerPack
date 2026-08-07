import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { api } from "../_generated/api";
import { stableHash } from "../_shared/stableHash";
import type { Id } from "../_generated/dataModel";

declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<Record<string, unknown>>>;
  }
}

// convex-test module graph: recursive glob misses this test's own dir, so add
// an explicit same-dir glob remapped to the `../onboarding/` root shape.
const recursive = import.meta.glob("../**/*.{ts,js}");
const sameDir = Object.fromEntries(
  Object.entries(import.meta.glob("./*.{ts,js}")).map(([path, mod]) => [
    path.replace(/^\.\//, "../onboarding/"),
    mod,
  ]),
);
const modules = Object.fromEntries(
  Object.entries({ ...recursive, ...sameDir }).filter(
    ([path]) => !path.endsWith(".d.ts") && !/\.(test|spec|config)\./.test(path),
  ),
);

// Inferred from `setup`, not `convexTest` directly — the bare
// `ReturnType<typeof convexTest>` drops the schema generic, and every
// `ctx.db.query("userProfiles")` below then falls back to SystemIndexes.
function setup() {
  return convexTest(schema, modules);
}

type Tester = ReturnType<typeof setup>;

const identity = (userId: Id<"users">) => ({ subject: `${userId}|session` });

async function insertUser(t: Tester, email?: string): Promise<Id<"users">> {
  return t.run((ctx) => ctx.db.insert("users", email ? { email } : {}));
}

async function insertProfile(
  t: Tester,
  userId: Id<"users">,
  overrides: Partial<{ bio: string; skills: string[] }> = {},
) {
  await t.run((ctx) =>
    ctx.db.insert("userProfiles", {
      userId,
      fullName: "Budi Santoso",
      location: "Bandung",
      targetRole: "Backend Engineer",
      experienceLevel: "senior",
      ...overrides,
    }),
  );
}

async function readProfile(t: Tester, userId: Id<"users">) {
  const row = await t.run((ctx) =>
    ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first(),
  );
  if (!row) throw new Error("profile missing");
  return row;
}

async function insertCV(t: Tester, userId: Id<"users">): Promise<Id<"cvs">> {
  return t.run((ctx) =>
    ctx.db.insert("cvs", {
      userId,
      title: "CV Utama",
      template: "modern",
      personalInfo: {
        fullName: "Budi Santoso",
        email: "budi@example.com",
        phone: "",
        location: "Bandung",
        summary: "Ringkasan lama",
      },
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      languages: [],
      projects: [],
      isDefault: true,
    }),
  );
}

async function readCV(t: Tester, cvId: Id<"cvs">) {
  const doc = await t.run((ctx) => ctx.db.get(cvId));
  if (!doc) throw new Error("cv missing");
  return doc;
}

describe("applyCvImport", () => {
  it("patches only the keys it was given", async () => {
    const t = setup();
    const userId = await insertUser(t, "budi@example.com");
    await insertProfile(t, userId, { bio: "Bio lama", skills: ["Go"] });
    const as = t.withIdentity(identity(userId));

    const result = await as.mutation(api.onboarding.cvImport.applyCvImport, {
      profile: { bio: "Bio baru dari CV" },
      source: "cv-import-manual",
    });

    // The failure this pins: an explicit `undefined` on the untouched keys
    // deletes the required columns and rolls the whole mutation back.
    expect(result.profileTouched).toBe(true);
    const profile = await readProfile(t, userId);
    expect(profile.bio).toBe("Bio baru dari CV");
    expect(profile.fullName).toBe("Budi Santoso");
    expect(profile.location).toBe("Bandung");
    expect(profile.targetRole).toBe("Backend Engineer");
    expect(profile.experienceLevel).toBe("senior");
    expect(profile.skills).toEqual(["Go"]);
  });

  it("drops a blank field instead of deleting the column", async () => {
    const t = setup();
    const userId = await insertUser(t, "budi@example.com");
    await insertProfile(t, userId, { bio: "Bio lama" });
    const as = t.withIdentity(identity(userId));

    // `validateProfileFields` turns a blank phone/bio into `undefined`, and
    // Convex reads an explicitly-present `undefined` as "delete this column".
    // That wiped bio/skills and threw on the required strings in production —
    // the payload must reach `db.patch` with those keys absent entirely.
    await as.mutation(api.onboarding.cvImport.applyCvImport, {
      profile: { bio: "   ", phone: "", location: "Jakarta" },
      source: "cv-import-manual",
    });

    const profile = await readProfile(t, userId);
    expect(profile.bio).toBe("Bio lama");
    expect(profile.location).toBe("Jakarta");
  });

  it("skips a key whose stored value drifted, and applies the rest", async () => {
    const t = setup();
    const userId = await insertUser(t, "budi@example.com");
    await insertProfile(t, userId, { bio: "Bio lama" });
    const as = t.withIdentity(identity(userId));

    const result = await as.mutation(api.onboarding.cvImport.applyCvImport, {
      profile: { bio: "Bio baru", location: "Jakarta" },
      profileExpect: {
        // What the dialog saw before somebody edited the bio in another tab.
        bio: stableHash("Bio yang sudah basi"),
        location: stableHash("Bandung"),
      },
      source: "cv-import-pdf",
    });

    const profile = await readProfile(t, userId);
    expect(profile.bio).toBe("Bio lama");
    expect(profile.location).toBe("Jakarta");
    expect(result.warnings).toContainEqual(
      "Bio dilewati — kamu mengubahnya di tempat lain sejak meninjau impor ini.",
    );
  });

  it("undoes a merge by restoring the CV content, not deleting the CV", async () => {
    const t = setup();
    const userId = await insertUser(t, "budi@example.com");
    await insertProfile(t, userId, { bio: "Bio lama" });
    const cvId = await insertCV(t, userId);
    const as = t.withIdentity(identity(userId));

    const before = await readCV(t, cvId);
    const result = await as.mutation(api.onboarding.cvImport.applyCvImport, {
      profile: { bio: "Bio baru" },
      cvId,
      cv: {
        personalInfo: { ...before.personalInfo, summary: "Ringkasan baru" },
        experience: [
          {
            id: "exp-imp-0",
            company: "PT Tokopedia",
            position: "Backend Engineer",
            startDate: "2020-03",
            current: true,
            description: "",
            achievements: [],
          },
        ],
      },
      cvExpect: {
        personalInfo: stableHash(before.personalInfo),
        experience: stableHash(before.experience),
      },
      source: "cv-import-pdf",
    });
    expect(result.cv).toBe("merged");

    const merged = await readCV(t, cvId);
    expect(merged.personalInfo.summary).toBe("Ringkasan baru");
    expect(merged.experience).toHaveLength(1);

    expect(result.batchId).not.toBeNull();
    await as.mutation(api.onboarding.mutations.undoBatch, {
      batchId: result.batchId!,
    });

    const restored = await readCV(t, cvId);
    expect(restored._id).toBe(cvId);
    expect(restored.personalInfo.summary).toBe("Ringkasan lama");
    expect(restored.experience).toEqual([]);
    expect((await readProfile(t, userId)).bio).toBe("Bio lama");
  });

  it("creates the first CV, defaulted, and undo removes it again", async () => {
    const t = setup();
    const userId = await insertUser(t, "budi@example.com");
    const as = t.withIdentity(identity(userId));

    // What the engine emits on the create path: no cvId, complete arrays, and
    // a personalInfo carrying only the keys the CV actually has — the optional
    // ones must land absent, not as an explicit `undefined`.
    const result = await as.mutation(api.onboarding.cvImport.applyCvImport, {
      profile: { fullName: "Budi Santoso", bio: "Backend engineer" },
      createCv: true,
      cv: {
        title: "CV Budi",
        personalInfo: {
          fullName: "Budi Santoso",
          email: "budi@example.com",
          phone: "0812-3456-7890",
          location: "Bandung",
          summary: "Backend engineer",
        },
        experience: [
          {
            id: "exp-imp-0",
            company: "PT Tokopedia",
            position: "Backend Engineer",
            startDate: "2020-03",
            current: true,
            description: "",
            achievements: [],
          },
        ],
        education: [],
        skills: [{ id: "skill-imp-0", name: "Go", category: "General", proficiency: 3 }],
        certifications: [],
        languages: [{ language: "Indonesia", proficiency: "Native" }],
        projects: [],
      },
      // The create path has no stored document to hash against, so these must
      // be ignored rather than drifting every key and inserting an empty CV.
      cvExpect: { personalInfo: stableHash(undefined), experience: stableHash(undefined) },
      source: "cv-import-pdf",
    });

    expect(result.cv).toBe("created");
    expect(result.warnings).toEqual([]);

    const created = await t.run((ctx) =>
      ctx.db
        .query("cvs")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first(),
    );
    if (!created) throw new Error("cv missing");
    expect(created.isDefault).toBe(true);
    expect(created.template).toBe("modern");
    expect(created.title).toBe("CV Budi");
    expect(created.personalInfo.summary).toBe("Backend engineer");
    // `validateCVUpdates` runs every optional through `capLen`, which returns
    // `undefined` — the stored object must not carry those keys at all.
    expect("linkedin" in created.personalInfo).toBe(false);
    expect("dateOfBirth" in created.personalInfo).toBe(false);
    expect(created.experience).toHaveLength(1);
    expect(created.languages).toEqual([{ language: "Indonesia", proficiency: "Native" }]);
    expect((await readProfile(t, userId)).fullName).toBe("Budi Santoso");

    // A create always writes a batch row; assert that before using it, so a
    // regression that stops recording one fails here rather than at the cast.
    expect(result.batchId).not.toBeNull();
    await as.mutation(api.onboarding.mutations.undoBatch, {
      batchId: result.batchId!,
    });
    expect(await t.run((ctx) => ctx.db.get(created._id))).toBeNull();
    // The batch also created the profile row, so undo deletes it rather than
    // replacing it with an empty snapshot.
    expect(
      await t.run((ctx) =>
        ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first(),
      ),
    ).toBeNull();
  });

  it("does not default a second CV", async () => {
    const t = setup();
    const userId = await insertUser(t, "budi@example.com");
    await insertCV(t, userId);
    const as = t.withIdentity(identity(userId));

    const result = await as.mutation(api.onboarding.cvImport.applyCvImport, {
      createCv: true,
      cv: {
        title: "CV Impor",
        personalInfo: {
          fullName: "Budi Santoso",
          email: "budi@example.com",
          phone: "",
          location: "",
          summary: "",
        },
      },
      source: "cv-import-image",
    });

    expect(result.cv).toBe("created");
    const rows = await t.run((ctx) =>
      ctx.db
        .query("cvs")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
    );
    expect(rows).toHaveLength(2);
    expect(rows.filter((row) => row.isDefault)).toHaveLength(1);
    // Absent arrays fall back to empty ones — the schema requires all six.
    const fresh = rows.find((row) => row.title === "CV Impor");
    expect(fresh?.experience).toEqual([]);
    expect(fresh?.projects).toEqual([]);
  });

  it("refuses a demo account server-side", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const as = t.withIdentity(identity(userId));

    await expect(
      as.mutation(api.onboarding.cvImport.applyCvImport, {
        profile: { bio: "Bio baru" },
        source: "cv-import-manual",
      }),
    ).rejects.toThrow(/akun demo/);
  });

  it("rate-limits the 21st import in an hour", async () => {
    const t = setup();
    const userId = await insertUser(t, "budi@example.com");
    await insertProfile(t, userId);
    const as = t.withIdentity(identity(userId));

    for (let i = 0; i < 20; i++) {
      await as.mutation(api.onboarding.cvImport.applyCvImport, {
        profile: { bio: `Bio ${i}` },
        source: "cv-import-manual",
      });
    }

    await expect(
      as.mutation(api.onboarding.cvImport.applyCvImport, {
        profile: { bio: "Bio 21" },
        source: "cv-import-manual",
      }),
    ).rejects.toThrow(/Rate limit/);
  });
});
