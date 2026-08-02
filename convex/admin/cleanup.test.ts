import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

// Same module-glob dance as queries.test.ts / webhooks.test.ts: from a
// co-located test inside `convex/admin/`, `import.meta.glob("../**")` excludes
// this very directory, so `admin/*` has to be globbed separately and re-rooted.
declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<Record<string, unknown>>>;
  }
}
const parentModules = import.meta.glob("../**/*.{ts,js}");
const adminModules = Object.fromEntries(
  Object.entries(import.meta.glob("./**/*.{ts,js}")).map(([path, loader]) => [
    path.replace(/^\.\//, "../admin/"),
    loader,
  ]),
);
const modules = Object.fromEntries(
  Object.entries({ ...parentModules, ...adminModules }).filter(
    ([path]) => !path.endsWith(".d.ts") && !/\.(test|spec|config)\./.test(path),
  ),
);

type Tester = ReturnType<typeof convexTest>;

const profile = (userId: Id<"users">, avatarStorageId: string) => ({
  userId,
  fullName: "Sri",
  location: "Jakarta",
  targetRole: "Designer",
  experienceLevel: "mid",
  avatarStorageId,
});

const personalInfo = (avatarStorageId?: string) => ({
  fullName: "Sri",
  email: "sri@example.com",
  phone: "0812",
  location: "Jakarta",
  summary: "",
  ...(avatarStorageId ? { avatarStorageId } : {}),
});

/**
 * One live blob + one pointer to a blob that never existed, wired into all
 * four tables that hold storage IDs. `DEAD` is a well-formed-looking string
 * that is not a real storage ID, which is exactly the shape the 2026-07-10
 * migration left behind: document rows intact, blobs gone.
 */
async function seed(t: Tester) {
  const live = await t.run((ctx) => ctx.storage.store(new Blob(["hello"])));
  const DEAD = "kg2deadbeefdeadbeefdeadbeefdead00";
  const userId = await t.run((ctx) => ctx.db.insert("users", { email: "sri@example.com" }));

  await t.run(async (ctx) => {
    for (const storageId of [live as string, DEAD]) {
      await ctx.db.insert("files", {
        storageId,
        fileName: "x.webp",
        fileType: "image/webp",
        fileSize: 1,
        uploadedBy: userId,
        tenantId: userId.toString(),
        createdAt: Date.now(),
      });
    }
  });

  return { live: live as string, DEAD, userId };
}

async function counts(t: Tester) {
  return t.run(async (ctx) => ({
    files: (await ctx.db.query("files").collect()).length,
    profileAvatar: (await ctx.db.query("userProfiles").collect())[0]?.avatarStorageId,
    cvAvatar: (await ctx.db.query("cvs").collect())[0]?.personalInfo.avatarStorageId,
    cover: (await ctx.db.query("portfolioItems").collect())[0]?.coverStorageId,
    media: (await ctx.db.query("portfolioItems").collect())[0]?.media,
  }));
}

describe("pruneOrphanStorage", () => {
  it("dry run reports the orphans and changes nothing", async () => {
    const t = convexTest(schema, modules);
    const { DEAD, userId } = await seed(t);
    await t.run((ctx) =>
      ctx.db.insert("userProfiles", profile(userId, DEAD)),
    );

    const before = await counts(t);
    const report = await t.mutation(internal.admin.cleanup.pruneOrphanStorage, {});

    expect(report.apply).toBe(false);
    expect(report.files).toBe(1);
    expect(report.userProfiles).toBe(1);
    expect(report.orphanStorageIds).toEqual([DEAD]);
    expect(await counts(t)).toEqual(before);
  });

  it("apply clears dead pointers in every table and leaves live ones alone", async () => {
    const t = convexTest(schema, modules);
    const { live, DEAD, userId } = await seed(t);

    await t.run(async (ctx) => {
      await ctx.db.insert("userProfiles", profile(userId, DEAD));
      await ctx.db.insert("cvs", {
        userId,
        title: "CV",
        template: "modern",
        personalInfo: personalInfo(DEAD),
        experience: [],
        education: [],
        skills: [],
        certifications: [],
        languages: [],
        projects: [],
        isDefault: true,
      });
      await ctx.db.insert("portfolioItems", {
        userId,
        title: "Case study",
        description: "",
        category: "design",
        coverStorageId: DEAD,
        media: [
          { storageId: DEAD, kind: "image" },
          { storageId: live, kind: "image" },
        ],
        date: "2026-01",
        featured: false,
      });
    });

    const report = await t.mutation(internal.admin.cleanup.pruneOrphanStorage, {
      apply: true,
    });
    expect(report).toMatchObject({
      apply: true,
      files: 1,
      userProfiles: 1,
      cvs: 1,
      portfolioItems: 1,
    });

    const after = await counts(t);
    // The live blob's `files` row survives; only the dead one is dropped.
    expect(after.files).toBe(1);
    expect(after.profileAvatar).toBeUndefined();
    expect(after.cvAvatar).toBeUndefined();
    expect(after.cover).toBeUndefined();
    expect(after.media).toEqual([{ storageId: live, kind: "image" }]);

    // Idempotent: a second pass finds nothing left to do.
    const again = await t.mutation(internal.admin.cleanup.pruneOrphanStorage, {
      apply: true,
    });
    expect(again).toMatchObject({ files: 0, userProfiles: 0, cvs: 0, portfolioItems: 0 });
  });

  it("leaves a row alone when every pointer resolves", async () => {
    const t = convexTest(schema, modules);
    const live = await t.run((ctx) => ctx.storage.store(new Blob(["hi"])));
    const userId: Id<"users"> = await t.run((ctx) =>
      ctx.db.insert("users", { email: "ok@example.com" }),
    );
    await t.run((ctx) =>
      ctx.db.insert("userProfiles", profile(userId, live as string)),
    );

    const report = await t.mutation(internal.admin.cleanup.pruneOrphanStorage, {
      apply: true,
    });
    expect(report).toMatchObject({ files: 0, userProfiles: 0, cvs: 0, portfolioItems: 0 });
    expect(report.orphanStorageIds).toEqual([]);
    expect((await counts(t)).profileAvatar).toBe(live);
  });
});
