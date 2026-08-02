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
// an explicit same-dir glob remapped to the `../roadmap/` root shape.
const recursive = import.meta.glob("../**/*.{ts,js}");
const sameDir = Object.fromEntries(
  Object.entries(import.meta.glob("./*.{ts,js}")).map(([path, mod]) => [
    path.replace(/^\.\//, "../roadmap/"),
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
  return t.run((ctx) => ctx.db.insert("users", { email: "road@x.com" }));
}

const identity = (userId: Id<"users">) => ({ subject: `${userId}|session` });

function seedArgs() {
  return {
    careerPath: "frontend",
    skills: [
      {
        id: "html",
        name: "HTML",
        category: "fundamentals",
        level: "beginner",
        priority: 0,
        estimatedHours: 10,
        prerequisites: [],
        resources: [
          { type: "article", title: "MDN HTML", url: "https://mdn.io/html" },
        ],
      },
    ],
  };
}

async function seedRoadmap(
  t: Tester,
  userId: Id<"users">,
): Promise<Id<"skillRoadmaps">> {
  const asUser = t.withIdentity(identity(userId));
  return asUser.mutation(api.roadmap.mutations.seedRoadmap, seedArgs());
}

describe("toggleResource guard", () => {
  it("toggles an existing resource", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));
    const roadmapId = await seedRoadmap(t, userId);

    await asUser.mutation(api.roadmap.mutations.toggleResource, {
      skillId: "html",
      resourceTitle: "MDN HTML",
      completed: true,
    });

    const roadmap = await t.run((ctx) => ctx.db.get(roadmapId));
    expect(roadmap?.skills[0].resources[0].completed).toBe(true);
  });

  it("throws on an unknown skillId", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));
    await seedRoadmap(t, userId);

    await expect(
      asUser.mutation(api.roadmap.mutations.toggleResource, {
        skillId: "nope",
        resourceTitle: "MDN HTML",
        completed: true,
      }),
    ).rejects.toThrow("Skill tidak ditemukan");
  });

  it("throws on an unknown resourceTitle", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));
    await seedRoadmap(t, userId);

    await expect(
      asUser.mutation(api.roadmap.mutations.toggleResource, {
        skillId: "html",
        resourceTitle: "Does Not Exist",
        completed: true,
      }),
    ).rejects.toThrow("Resource tidak ditemukan");
  });
});
