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

describe("pruneAppendOnlyTables — OAuth tables", () => {
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  const code = (over: Partial<{ consumed: boolean; expiresAt: number }>) => ({
    code: `c-${Math.random().toString(36).slice(2)}`,
    codeChallenge: "chal",
    codeChallengeMethod: "S256",
    redirectUri: "https://example.com/cb",
    clientId: "client-1",
    scope: "mcp.read",
    expiresAt: Date.now() + 5 * 60_000,
    consumed: false,
    createdAt: Date.now(),
    ...over,
  });

  const token = (over: Partial<{ expiresAt: number; revokedAt: number }>) => ({
    token: `t-${Math.random().toString(36).slice(2)}`,
    clientId: "client-1",
    scope: "mcp.read",
    expiresAt: Date.now() + 365 * DAY,
    createdAt: Date.now(),
    ...over,
  });

  it("drops consumed and expired codes, keeps a live one", async () => {
    // Until 2026-08-16 nothing ever deleted an oauthCode: the exchange sets
    // `consumed: true` and moves on, so one row survived every successful
    // connection AND every abandoned consent, forever.
    const t: Tester = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => ctx.db.insert("users", {}));
    await t.run(async (ctx) => {
      await ctx.db.insert("oauthCodes", { ...code({ consumed: true }), userId });
      await ctx.db.insert("oauthCodes", {
        ...code({ expiresAt: Date.now() - HOUR }),
        userId,
      });
      await ctx.db.insert("oauthCodes", { ...code({}), userId });
    });

    const stats = await t.mutation(internal.admin.cleanup.pruneAppendOnlyTables, {});
    expect(stats.oauthCodes).toBe(2);

    const left = await t.run(async (ctx) => ctx.db.query("oauthCodes").collect());
    expect(left).toHaveLength(1);
    expect(left[0]!.consumed).toBe(false);
    expect(left[0]!.expiresAt).toBeGreaterThan(Date.now());
  });

  it("drops long-expired tokens but KEEPS a revoked one that has not lapsed", async () => {
    // `revokedAt` is a soft revoke on purpose — the connections list has to be
    // able to show what was cut off and when. Pruning on revocation would
    // delete the audit trail the field exists to provide.
    const t: Tester = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => ctx.db.insert("users", {}));
    await t.run(async (ctx) => {
      await ctx.db.insert("oauthAccessTokens", {
        ...token({ expiresAt: Date.now() - 40 * DAY }),
        userId,
      });
      await ctx.db.insert("oauthAccessTokens", {
        ...token({ revokedAt: Date.now() - HOUR }),
        userId,
      });
      await ctx.db.insert("oauthAccessTokens", { ...token({}), userId });
    });

    const stats = await t.mutation(internal.admin.cleanup.pruneAppendOnlyTables, {});
    expect(stats.oauthAccessTokens).toBe(1);

    const left = await t.run(async (ctx) =>
      ctx.db.query("oauthAccessTokens").collect(),
    );
    expect(left).toHaveLength(2);
    expect(left.some((r) => r.revokedAt !== undefined)).toBe(true);
  });

  it("keeps a token inside the 30-day grace window after it lapses", async () => {
    // So "why did my connector stop working?" is still answerable from the
    // row that lapsed, rather than from nothing.
    const t: Tester = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => ctx.db.insert("users", {}));
    await t.run(async (ctx) => {
      await ctx.db.insert("oauthAccessTokens", {
        ...token({ expiresAt: Date.now() - 2 * DAY }),
        userId,
      });
    });

    const stats = await t.mutation(internal.admin.cleanup.pruneAppendOnlyTables, {});
    expect(stats.oauthAccessTokens).toBe(0);
  });
});
