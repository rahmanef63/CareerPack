import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

// `import.meta.glob` is a Vite/Vitest feature; the convex tsconfig only pulls
// in @types/node, so augment ImportMeta locally (mirrors guards.integration.test.ts).
declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<Record<string, unknown>>>;
  }
}

// convex-test needs the full function module graph incl. `_generated`. The
// recursive `../**` glob EXCLUDES this test file's own directory (Vite
// importer-dir exclusion), so `profile/*` would be missing — add an explicit
// same-dir glob and remap its `./` keys to the `../profile/` root shape.
const recursive = import.meta.glob("../**/*.{ts,js}");
const sameDir = Object.fromEntries(
  Object.entries(import.meta.glob("./*.{ts,js}")).map(([path, mod]) => [
    path.replace(/^\.\//, "../profile/"),
    mod,
  ]),
);
const modules = Object.fromEntries(
  Object.entries({ ...recursive, ...sameDir }).filter(
    ([path]) => !path.endsWith(".d.ts") && !/\.(test|spec|config)\./.test(path),
  ),
);

type Tester = ReturnType<typeof convexTest>;

function setup(): Tester {
  return convexTest(schema, modules);
}

async function insertUser(t: Tester): Promise<Id<"users">> {
  return t.run((ctx) => ctx.db.insert("users", { email: "p@x.com" }));
}

// @convex-dev/auth's getAuthUserId reads `identity.subject` and splits on "|".
const identity = (userId: Id<"users">) => ({ subject: `${userId}|session` });

// 0x07 (bell) — a control char built at runtime so no raw byte lives in source.
const CTRL = String.fromCharCode(7);

function validProfileArgs() {
  return {
    fullName: "Budi Santoso",
    location: "Jakarta",
    targetRole: "Software Engineer",
    experienceLevel: "Mid",
    skills: ["TypeScript", "React"],
    interests: ["Open Source"],
    bio: "Engineer berpengalaman.",
  };
}

describe("createOrUpdateProfile input caps", () => {
  it("accepts a normal payload and stores trimmed values", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));

    const id = await asUser.mutation(api.profile.mutations.createOrUpdateProfile, {
      ...validProfileArgs(),
      fullName: "  Budi Santoso  ",
    });

    const stored = await t.run((ctx) => ctx.db.get(id));
    expect(stored?.fullName).toBe("Budi Santoso");
    expect(stored?.skills).toEqual(["TypeScript", "React"]);
  });

  it("rejects an over-long fullName (>120)", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));

    await expect(
      asUser.mutation(api.profile.mutations.createOrUpdateProfile, {
        ...validProfileArgs(),
        fullName: "a".repeat(121),
      }),
    ).rejects.toThrow("Nama maksimal 120 karakter");
  });

  it("rejects an over-long experienceLevel (>40)", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));

    await expect(
      asUser.mutation(api.profile.mutations.createOrUpdateProfile, {
        ...validProfileArgs(),
        experienceLevel: "a".repeat(41),
      }),
    ).rejects.toThrow("Level maksimal 40 karakter");
  });

  it("rejects an over-long bio (>600)", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));

    await expect(
      asUser.mutation(api.profile.mutations.createOrUpdateProfile, {
        ...validProfileArgs(),
        bio: "a".repeat(601),
      }),
    ).rejects.toThrow("Bio maksimal 600 karakter");
  });

  it("rejects too many skills (>50)", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));

    await expect(
      asUser.mutation(api.profile.mutations.createOrUpdateProfile, {
        ...validProfileArgs(),
        skills: Array.from({ length: 51 }, (_, i) => `skill-${i}`),
      }),
    ).rejects.toThrow("Skill maksimal 50 entri");
  });

  it("rejects an over-long skill entry (>60)", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));

    await expect(
      asUser.mutation(api.profile.mutations.createOrUpdateProfile, {
        ...validProfileArgs(),
        skills: ["a".repeat(61)],
      }),
    ).rejects.toThrow("Skill maksimal 60 karakter");
  });

  it("rejects too many interests (>50)", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));

    await expect(
      asUser.mutation(api.profile.mutations.createOrUpdateProfile, {
        ...validProfileArgs(),
        interests: Array.from({ length: 51 }, (_, i) => `int-${i}`),
      }),
    ).rejects.toThrow("Minat maksimal 50 entri");
  });

  it("rejects a control character in fullName", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));

    await expect(
      asUser.mutation(api.profile.mutations.createOrUpdateProfile, {
        ...validProfileArgs(),
        fullName: `Budi${CTRL}Santoso`,
      }),
    ).rejects.toThrow("Nama mengandung karakter tidak valid");
  });
});

describe("patchProfile shares the same caps", () => {
  async function seedProfile(t: Tester, userId: Id<"users">) {
    await t
      .withIdentity(identity(userId))
      .mutation(api.profile.mutations.createOrUpdateProfile, validProfileArgs());
  }

  it("rejects an over-long location via patch (>120)", async () => {
    const t = setup();
    const userId = await insertUser(t);
    await seedProfile(t, userId);

    await expect(
      t.withIdentity(identity(userId)).mutation(api.profile.mutations.patchProfile, {
        location: "a".repeat(121),
      }),
    ).rejects.toThrow("Lokasi maksimal 120 karakter");
  });

  it("accepts a normal single-field patch", async () => {
    const t = setup();
    const userId = await insertUser(t);
    await seedProfile(t, userId);

    const id = await t
      .withIdentity(identity(userId))
      .mutation(api.profile.mutations.patchProfile, { targetRole: "Staff Engineer" });
    const stored = await t.run((ctx) => ctx.db.get(id));
    expect(stored?.targetRole).toBe("Staff Engineer");
  });
});
