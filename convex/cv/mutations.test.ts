import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<Record<string, unknown>>>;
  }
}

// convex-test module graph: recursive glob misses this test's own dir, so add
// an explicit same-dir glob remapped to the `../cv/` root shape.
const recursive = import.meta.glob("../**/*.{ts,js}");
const sameDir = Object.fromEntries(
  Object.entries(import.meta.glob("./*.{ts,js}")).map(([path, mod]) => [
    path.replace(/^\.\//, "../cv/"),
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

const identity = (userId: Id<"users">) => ({ subject: `${userId}|session` });

const CTRL = String.fromCharCode(7);

async function insertUserAndCV(
  t: Tester,
): Promise<{ userId: Id<"users">; cvId: Id<"cvs"> }> {
  return t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { email: "cv@x.com" });
    const cvId = await ctx.db.insert("cvs", {
      userId,
      title: "CV",
      template: "modern",
      personalInfo: {
        fullName: "X",
        email: "x@x.com",
        phone: "",
        location: "",
        summary: "",
      },
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      languages: [],
      projects: [],
      isDefault: true,
    });
    return { userId, cvId };
  });
}

describe("updateCV input caps", () => {
  it("accepts a normal payload and stores trimmed values", async () => {
    const t = setup();
    const { userId, cvId } = await insertUserAndCV(t);

    await t.withIdentity(identity(userId)).mutation(api.cv.mutations.updateCV, {
      cvId,
      updates: {
        title: "  CV Backend  ",
        skills: [{ id: "s1", name: "  Go  ", category: "lang", proficiency: 4 }],
      },
    });

    const stored = await t.run((ctx) => ctx.db.get(cvId));
    expect(stored?.title).toBe("CV Backend");
    expect(stored?.skills?.[0]?.name).toBe("Go");
  });

  it("rejects an over-long title (>120)", async () => {
    const t = setup();
    const { userId, cvId } = await insertUserAndCV(t);

    await expect(
      t.withIdentity(identity(userId)).mutation(api.cv.mutations.updateCV, {
        cvId,
        updates: { title: "a".repeat(121) },
      }),
    ).rejects.toThrow("Judul CV maksimal 120 karakter");
  });

  it("rejects an over-long personalInfo.summary (>600)", async () => {
    const t = setup();
    const { userId, cvId } = await insertUserAndCV(t);

    await expect(
      t.withIdentity(identity(userId)).mutation(api.cv.mutations.updateCV, {
        cvId,
        updates: {
          personalInfo: {
            fullName: "X",
            email: "x@x.com",
            phone: "",
            location: "",
            summary: "a".repeat(601),
          },
        },
      }),
    ).rejects.toThrow("Ringkasan maksimal 600 karakter");
  });

  it("rejects too many skill entries (>50)", async () => {
    const t = setup();
    const { userId, cvId } = await insertUserAndCV(t);

    await expect(
      t.withIdentity(identity(userId)).mutation(api.cv.mutations.updateCV, {
        cvId,
        updates: {
          skills: Array.from({ length: 51 }, (_, i) => ({
            id: `s${i}`,
            name: `skill-${i}`,
            category: "lang",
            proficiency: 3,
          })),
        },
      }),
    ).rejects.toThrow("Skill maksimal 50 entri");
  });

  it("rejects an over-long skill name (>60)", async () => {
    const t = setup();
    const { userId, cvId } = await insertUserAndCV(t);

    await expect(
      t.withIdentity(identity(userId)).mutation(api.cv.mutations.updateCV, {
        cvId,
        updates: {
          skills: [{ id: "s1", name: "a".repeat(61), category: "lang", proficiency: 3 }],
        },
      }),
    ).rejects.toThrow("Skill maksimal 60 karakter");
  });

  it("rejects an over-long experience achievement entry (>300)", async () => {
    const t = setup();
    const { userId, cvId } = await insertUserAndCV(t);

    await expect(
      t.withIdentity(identity(userId)).mutation(api.cv.mutations.updateCV, {
        cvId,
        updates: {
          experience: [
            {
              id: "e1",
              company: "Acme",
              position: "Eng",
              startDate: "2020",
              current: true,
              description: "desc",
              achievements: ["a".repeat(301)],
            },
          ],
        },
      }),
    ).rejects.toThrow("Pencapaian maksimal 300 karakter");
  });

  it("rejects a control character in a project name", async () => {
    const t = setup();
    const { userId, cvId } = await insertUserAndCV(t);

    await expect(
      t.withIdentity(identity(userId)).mutation(api.cv.mutations.updateCV, {
        cvId,
        updates: {
          projects: [
            {
              id: "p1",
              name: `Proj${CTRL}X`,
              description: "desc",
              technologies: ["Go"],
            },
          ],
        },
      }),
    ).rejects.toThrow("Proyek mengandung karakter tidak valid");
  });
});
