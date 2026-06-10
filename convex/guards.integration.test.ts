import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api, internal } from "./_generated/api";
import { enforceRateLimit, AI_RATE_LIMITS } from "./_shared/rateLimit";
import type { Id } from "./_generated/dataModel";

// `import.meta.glob` is a Vite/Vitest feature; the convex tsconfig only
// pulls in @types/node, so augment ImportMeta locally rather than depend on
// `vite/client` resolving from this project.
declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<Record<string, unknown>>>;
  }
}

// convex-test needs the full function module graph incl. `_generated`
// (it locates the convex root by finding a `_generated` module key). Glob
// everything, then drop type-only `.d.ts` and the test/config files —
// done in JS rather than an extglob so it's Vite-version independent.
const modules = Object.fromEntries(
  Object.entries(import.meta.glob("./**/*.{ts,js}")).filter(
    ([path]) => !path.endsWith(".d.ts") && !/\.(test|spec|config)\./.test(path),
  ),
);

type Tester = ReturnType<typeof convexTest>;

function setup(): Tester {
  return convexTest(schema, modules);
}

async function insertUser(
  t: Tester,
  opts: { email?: string; role?: "admin" | "moderator" | "user" } = {},
): Promise<Id<"users">> {
  return t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { email: opts.email });
    if (opts.role) {
      await ctx.db.insert("userProfiles", {
        userId,
        fullName: "Test",
        location: "",
        targetRole: "",
        experienceLevel: "",
        role: opts.role,
      });
    }
    return userId;
  });
}

// @convex-dev/auth's getAuthUserId reads `identity.subject` and splits on "|".
const identity = (userId: Id<"users">) => ({ subject: `${userId}|session` });

describe("requireUser enforcement through a real mutation", () => {
  it("rejects an unauthenticated caller", async () => {
    const t = setup();
    await expect(
      t.mutation(api.ai.mutations.clearMyAISettings, {}),
    ).rejects.toThrow("Tidak terautentikasi");
  });

  it("admits an authenticated caller", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const asUser = t.withIdentity(identity(userId));
    // Must not throw; a subsequent read confirms the call ran.
    await asUser.mutation(api.ai.mutations.clearMyAISettings, {});
    await expect(
      asUser.query(api.ai.queries.getMyAISettings, {}),
    ).resolves.toBeNull();
  });
});

describe("optionalUser keeps list/read queries SSR-safe", () => {
  it("returns null for an anonymous quota read instead of throwing", async () => {
    const t = setup();
    await expect(t.query(api.ai.queries.getMyQuota, {})).resolves.toBeNull();
  });

  it("returns a populated quota for an authenticated reader", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const quota = await t
      .withIdentity(identity(userId))
      .query(api.ai.queries.getMyQuota, {});
    expect(quota).not.toBeNull();
    expect(quota?.day.max).toBe(100);
    expect(quota?.minute.max).toBe(10);
  });
});

describe("requireAdmin enforcement through a real mutation", () => {
  it("rejects a non-admin caller", async () => {
    const t = setup();
    const userId = await insertUser(t);
    await expect(
      t
        .withIdentity(identity(userId))
        .mutation(api.ai.mutations.clearGlobalAISettings, {}),
    ).rejects.toThrow("Bukan admin");
  });

  it("admits a role=admin caller", async () => {
    const t = setup();
    const userId = await insertUser(t, { role: "admin" });
    await t
      .withIdentity(identity(userId))
      .mutation(api.ai.mutations.clearGlobalAISettings, {});
  });
});

describe("user-scoped ownership boundary", () => {
  it("never leaks one user's chat session to another", async () => {
    const t = setup();
    const alice = await insertUser(t, { email: "a@x.com" });
    const bob = await insertUser(t, { email: "b@x.com" });
    const now = Date.now();

    await t.withIdentity(identity(alice)).mutation(api.ai.mutations.upsertChatSession, {
      sessionId: "s1",
      title: "Alice session",
      createdAt: now,
      updatedAt: now,
      messages: [{ id: "m1", role: "user", content: "hi", timestamp: now }],
    });

    const bobView = await t
      .withIdentity(identity(bob))
      .query(api.ai.queries.getChatSession, { sessionId: "s1" });
    expect(bobView).toBeNull();

    const aliceView = await t
      .withIdentity(identity(alice))
      .query(api.ai.queries.getChatSession, { sessionId: "s1" });
    expect(aliceView?.title).toBe("Alice session");
  });
});

describe("matcher ATS scan cannot read another user's CV (IDOR guard)", () => {
  it("_getOwnedCV returns null for a non-owner and the doc for the owner", async () => {
    const t = setup();
    const alice = await insertUser(t, { email: "alice@x.com" });
    const bob = await insertUser(t, { email: "bob@x.com" });

    const cvId = await t.run((ctx) =>
      ctx.db.insert("cvs", {
        userId: alice,
        title: "Alice CV",
        template: "modern",
        personalInfo: {
          fullName: "Alice",
          email: "alice@x.com",
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
      }),
    );

    // Bob must NOT be able to load Alice's CV through the scan path.
    const asBob = await t.query(internal.matcher.queries._getOwnedCV, {
      cvId,
      userId: bob,
    });
    expect(asBob).toBeNull();

    const asAlice = await t.query(internal.matcher.queries._getOwnedCV, {
      cvId,
      userId: alice,
    });
    expect(asAlice?.title).toBe("Alice CV");
  });
});

describe("enforceRateLimit against a live transaction", () => {
  it("permits the configured budget then throws on overflow", async () => {
    const t = setup();
    const userId = await insertUser(t);
    const rule = AI_RATE_LIMITS["ai:minute"];

    await t.run(async (ctx) => {
      for (let i = 0; i < rule.max; i++) {
        await enforceRateLimit(ctx, userId, rule);
      }
    });

    await t.run(async (ctx) => {
      await expect(enforceRateLimit(ctx, userId, rule)).rejects.toThrow(
        "Rate limit tercapai",
      );
    });
  });
});
