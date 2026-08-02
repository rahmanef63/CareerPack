import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api, internal } from "./_generated/api";

// Co-located at the convex root, so one glob covers everything.
declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<Record<string, unknown>>>;
  }
}
const modules = Object.fromEntries(
  Object.entries(import.meta.glob("./**/*.{ts,js}")).filter(
    ([path]) => !path.endsWith(".d.ts") && !/\.(test|spec|config)\./.test(path),
  ),
);

describe("user bootstrap", () => {
  it("carries the sign-up name into the profile, and is idempotent", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) =>
      ctx.db.insert("users", { name: "Budi Santoso", email: "budi@example.com" }),
    );

    await t.withIdentity({ subject: userId }).mutation(api.seed.seedForCurrentUser, {});
    await t.withIdentity({ subject: userId }).mutation(api.seed.seedForCurrentUser, {});

    const profiles = await t.run(async (ctx) =>
      ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
    );
    // Exactly one row after two calls — the second must take the promote-only
    // branch, not insert a duplicate.
    expect(profiles).toHaveLength(1);
    // The whole point of the fix: the name the user typed is what the greeting
    // and the profile-completion card read, not a fragment of their email.
    expect(profiles[0].fullName).toBe("Budi Santoso");
  });

  it("backfills accounts that have no profile without touching ones that do", async () => {
    const t = convexTest(schema, modules);
    const [missing, alreadyOk] = await t.run(async (ctx) => {
      const a = await ctx.db.insert("users", { name: "Tanpa Profil", email: "a@example.com" });
      const b = await ctx.db.insert("users", { name: "Punya Profil", email: "b@example.com" });
      await ctx.db.insert("userProfiles", {
        userId: b,
        fullName: "Sudah Diisi",
        location: "Jakarta",
        targetRole: "",
        experienceLevel: "",
      });
      return [a, b];
    });

    const dry = await t.mutation(internal.seed.backfillMissingProfiles, {});
    expect(dry.repaired).toBe(1);
    const stillMissing = await t.run(async (ctx) =>
      ctx.db.query("userProfiles").withIndex("by_user", (q) => q.eq("userId", missing)).first(),
    );
    // apply defaults to false — a dry run must write nothing.
    expect(stillMissing).toBeNull();

    await t.mutation(internal.seed.backfillMissingProfiles, { apply: true });
    const [repaired, untouched] = await t.run(async (ctx) => [
      await ctx.db.query("userProfiles").withIndex("by_user", (q) => q.eq("userId", missing)).first(),
      await ctx.db.query("userProfiles").withIndex("by_user", (q) => q.eq("userId", alreadyOk)).first(),
    ]);
    expect(repaired?.fullName).toBe("Tanpa Profil");
    expect(untouched?.fullName).toBe("Sudah Diisi");
  });
});
