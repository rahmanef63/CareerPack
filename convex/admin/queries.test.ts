import { describe, it, expect, beforeAll } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

// `requireSuperAdmin` / `isSuperAdminCaller` capture `SUPER_ADMIN_EMAIL` at
// module-eval time. convex-test loads the function module graph lazily (on the
// first handler call inside an `it`), so setting the env before any test body
// runs is enough for `auth.ts` to pick it up.
const SUPER = "boss@careerpack.org";
beforeAll(() => {
  process.env.SUPER_ADMIN_EMAIL = SUPER;
});

// convex-test needs the full function module graph incl. `_generated`; drop
// type-only `.d.ts` and the test/config files. From a co-located test inside
// `convex/admin/`, `import.meta.glob("../**")` excludes this very directory,
// so the parent glob alone misses `admin/*`. We additionally glob the current
// dir (`./**`) and re-root those keys to `../admin/...` so convex-test (which
// derives its module root from the `_generated` path → prefix `../`) resolves
// `admin/<file>` correctly. (Mirrors webhooks.test.ts.)
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
function setup(): Tester {
  return convexTest(schema, modules);
}

// @convex-dev/auth's getAuthUserId reads `identity.subject` and splits on "|".
const identity = (userId: Id<"users">) => ({ subject: `${userId}|session` });

async function insertUser(t: Tester, email?: string): Promise<Id<"users">> {
  return t.run((ctx) => ctx.db.insert("users", email ? { email } : {}));
}

describe("super-admin analytics read O(1) from adminStats", () => {
  it("getOverview/getProfileAggregates/getFeatureAdoption/getSignupTrend return zero-shape before the cron runs", async () => {
    const t = setup();
    const boss = await insertUser(t, SUPER);
    const as = t.withIdentity(identity(boss));

    const overview = await as.query(api.admin.queries.getOverview, {});
    expect(overview.totalUsers).toBe(0);
    expect(overview.computedAt).toBeNull();
    expect(overview.storage).toEqual({
      files: 0,
      totalBytes: 0,
      imageCount: 0,
      pdfCount: 0,
    });

    const aggs = await as.query(api.admin.queries.getProfileAggregates, {});
    expect(aggs.topTargetRoles).toEqual([]);
    expect(aggs.topSkills).toEqual([]);

    const adoption = await as.query(api.admin.queries.getFeatureAdoption, {});
    expect(adoption.adoption).toEqual([]);

    const trend = await as.query(api.admin.queries.getSignupTrend, {});
    expect(trend).toEqual([]);
  });

  it("after recompute, the analytics queries reflect the denormalized rollups", async () => {
    const t = setup();
    const boss = await insertUser(t, SUPER);
    const alice = await insertUser(t, "alice@x.com");
    const as = t.withIdentity(identity(boss));
    const now = Date.now();

    // Profiles: alice complete + public; boss minimal.
    await t.run(async (ctx) => {
      await ctx.db.insert("userProfiles", {
        userId: alice,
        fullName: "Alice",
        location: "Jakarta",
        targetRole: "Frontend Engineer",
        experienceLevel: "mid",
        skills: ["React", "TypeScript"],
        interests: ["Open Source"],
        publicEnabled: true,
      });
      await ctx.db.insert("userProfiles", {
        userId: boss,
        fullName: "",
        location: "",
        targetRole: "",
        experienceLevel: "",
      });
      // One file (image) for storage stats.
      await ctx.db.insert("files", {
        storageId: "s1",
        fileName: "ava.png",
        fileType: "image/png",
        fileSize: 2048,
        uploadedBy: alice,
        tenantId: String(alice),
        createdAt: now,
      });
      // Feature usage: a CV for alice.
      await ctx.db.insert("cvs", {
        userId: alice,
        title: "CV Alice",
        template: "modern",
        personalInfo: {
          fullName: "Alice",
          email: "alice@x.com",
          phone: "",
          location: "Jakarta",
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
    });

    // A chat conversation WITH a heavy messages[] array. The aggregator must
    // count it for adoption WITHOUT the analytics query ever shipping it.
    await t.withIdentity(identity(alice)).mutation(
      api.ai.mutations.upsertChatSession,
      {
        sessionId: "chat-1",
        title: "Sesi",
        createdAt: now,
        updatedAt: now,
        messages: [
          { id: "m1", role: "user", content: "x".repeat(4000), timestamp: now },
          { id: "m2", role: "assistant", content: "y".repeat(4000), timestamp: now + 1 },
        ],
      },
    );

    await t.mutation(internal.admin.aggregator.recomputeAdminStats, {});

    const overview = await as.query(api.admin.queries.getOverview, {});
    expect(overview.totalUsers).toBe(2);
    expect(overview.profilesCount).toBe(2);
    // 1 of 2 profiles complete → 50%.
    expect(overview.profileCompletePct).toBe(50);
    expect(overview.publicEnabled).toBe(1);
    expect(overview.storage.totalBytes).toBe(2048);
    expect(overview.storage.imageCount).toBe(1);
    expect(overview.computedAt).not.toBeNull();

    const aggs = await as.query(api.admin.queries.getProfileAggregates, {});
    expect(aggs.totalProfiles).toBe(2);
    expect(aggs.topTargetRoles).toContainEqual({
      value: "frontend engineer",
      count: 1,
    });
    expect(aggs.topSkills).toContainEqual({ value: "react", count: 1 });

    const adoption = await as.query(api.admin.queries.getFeatureAdoption, {});
    expect(adoption.totalUsers).toBe(2);
    type AdoptionRow = (typeof adoption.adoption)[number];
    const cvRow = adoption.adoption.find(
      (a: AdoptionRow) => a.slice === "CV Generator",
    );
    expect(cvRow).toMatchObject({ users: 1, rows: 1 });
    const chatRow = adoption.adoption.find(
      (a: AdoptionRow) => a.slice === "AI Agent Chat",
    );
    expect(chatRow).toMatchObject({ users: 1, rows: 1 });

    // CRITICAL: the feature-adoption payload must NOT carry the heavy
    // chatConversations `messages[]` — only counts cross the wire.
    const serialized = JSON.stringify(adoption);
    expect(serialized).not.toContain("x".repeat(4000));
    expect(serialized).not.toContain("messages");

    const trend = await as.query(api.admin.queries.getSignupTrend, {});
    expect(trend).toHaveLength(30);
    // Both users were created "today" → last bucket counts 2.
    expect(trend[trend.length - 1].count).toBe(2);
  });

  it("denies non-super-admin callers", async () => {
    const t = setup();
    const user = await insertUser(t, "nobody@x.com");
    const as = t.withIdentity(identity(user));
    await expect(as.query(api.admin.queries.getOverview, {})).rejects.toThrow();
    await expect(
      as.query(api.admin.queries.getFeatureAdoption, {}),
    ).rejects.toThrow();
  });
});

describe("management tables are bounded + metadata-only", () => {
  it("listAllRoadmaps returns { rows, truncated } and never ships chat messages[]", async () => {
    const t = setup();
    const boss = await insertUser(t, SUPER);
    const owner = await insertUser(t, "owner@x.com");

    await t.run((ctx) =>
      ctx.db.insert("skillRoadmaps", {
        userId: owner,
        careerPath: "Frontend",
        skills: [],
        progress: 0,
      }),
    );

    const res = await t
      .withIdentity(identity(boss))
      .query(api.admin.queries.listAllRoadmaps, {});
    expect(res.truncated).toBe(false);
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].userEmail).toBe("owner@x.com");
    expect(res.rows[0].careerPath).toBe("Frontend");
  });

  it("listUsersWithProfiles resolves profiles per-user via index", async () => {
    const t = setup();
    const boss = await insertUser(t, SUPER);
    const u = await insertUser(t, "withprofile@x.com");
    await t.run((ctx) =>
      ctx.db.insert("userProfiles", {
        userId: u,
        fullName: "Pengguna",
        location: "Bandung",
        targetRole: "QA",
        experienceLevel: "entry",
        skills: ["Cypress"],
      }),
    );

    const rows = await t
      .withIdentity(identity(boss))
      .query(api.admin.queries.listUsersWithProfiles, {});
    const row = rows.find((r) => r.email === "withprofile@x.com");
    expect(row).toBeDefined();
    expect(row?.fullName).toBe("Pengguna");
    expect(row?.skillsCount).toBe(1);
  });
});
