/* Re-encrypting the credentials that predate AI_CRED_SECRET.
 *
 * The read path accepts plaintext AND ciphertext, which is what makes this
 * sweep safe to skip — and also what would let a broken sweep go unnoticed:
 * a row it mangled would keep "working" right up until decryptCred threw on a
 * live AI call. So these assert the round-trip, not just the counters.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { internal } from "../_generated/api";
import { decryptCred } from "../_shared/aiCrypto";

declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<Record<string, unknown>>>;
  }
}

const modules = Object.fromEntries(
  Object.entries({
    ...import.meta.glob("../**/*.{ts,js}"),
    ...Object.fromEntries(
      Object.entries(import.meta.glob("./**/*.{ts,js}")).map(([path, loader]) => [
        path.replace(/^\.\//, "../admin/"),
        loader,
      ]),
    ),
  }).filter(
    ([path]) => !path.endsWith(".d.ts") && !/\.(test|spec|config)\./.test(path),
  ),
);

const SECRET = "AI_CRED_SECRET";
let saved: string | undefined;
beforeEach(() => { saved = process.env[SECRET]; });
afterEach(() => {
  if (saved === undefined) delete process.env[SECRET];
  else process.env[SECRET] = saved;
});

/** Two user rows (one keyed, one keyless) plus the global singleton. */
async function seed(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    const u1 = await ctx.db.insert("users", {});
    const u2 = await ctx.db.insert("users", {});
    const at = 1_700_000_000_000;
    await ctx.db.insert("aiSettings", {
      userId: u1, provider: "openrouter", model: "openai/gpt-4o-mini",
      apiKey: "sk-or-plaintext-user", enabled: true, updatedAt: at,
    });
    await ctx.db.insert("aiSettings", {
      userId: u2, provider: "openrouter", model: "openai/gpt-4o-mini",
      apiKey: "", enabled: true, updatedAt: at,
    });
    await ctx.db.insert("globalAISettings", {
      provider: "openrouter", model: "openai/gpt-4o-mini",
      apiKey: "sk-or-plaintext-global", enabled: true, updatedBy: u1, updatedAt: at,
    });
  });
}

const run = (t: ReturnType<typeof convexTest>, apply?: boolean) =>
  t.mutation(internal.admin.aiCreds.reencryptAICreds, apply === undefined ? {} : { apply });

describe("reencryptAICreds", () => {
  it("counts without touching anything when it is only a dry run", async () => {
    process.env[SECRET] = "passphrase-uji";
    const t = convexTest(schema, modules);
    await seed(t);

    const res = await run(t);
    expect(res.secretConfigured).toBe(true);
    expect(res.applied).toBe(false);
    expect(res.rewritten).toBe(0);
    expect(res.userSettings).toEqual({ total: 2, plaintext: 1, alreadyEncrypted: 0, empty: 1 });
    expect(res.globalSettings).toEqual({ total: 1, plaintext: 1, alreadyEncrypted: 0, empty: 0 });

    // The whole point of a dry run: the rows are exactly as they were.
    const keys = await t.run(async (ctx) =>
      (await ctx.db.query("aiSettings").collect()).map((r) => r.apiKey),
    );
    expect(keys).toContain("sk-or-plaintext-user");
  });

  it("encrypts on apply, and the ciphertext decrypts back to the original", async () => {
    process.env[SECRET] = "passphrase-uji";
    const t = convexTest(schema, modules);
    await seed(t);

    const res = await run(t, true);
    expect(res.applied).toBe(true);
    expect(res.rewritten).toBe(2);

    const rows = await t.run(async (ctx) => ({
      user: (await ctx.db.query("aiSettings").collect()).map((r) => r.apiKey),
      global: (await ctx.db.query("globalAISettings").collect()).map((r) => r.apiKey),
    }));
    const stored = rows.user.find((k) => k !== "")!;
    expect(stored.startsWith("encv1:")).toBe(true);
    // A rewrite that stored something undecryptable would still look "encrypted".
    expect(await decryptCred(stored)).toBe("sk-or-plaintext-user");
    expect(await decryptCred(rows.global[0]!)).toBe("sk-or-plaintext-global");
    // The keyless row is left alone rather than filled with an encrypted "".
    expect(rows.user).toContain("");
  });

  it("is idempotent — a second pass finds nothing left to do", async () => {
    process.env[SECRET] = "passphrase-uji";
    const t = convexTest(schema, modules);
    await seed(t);
    await run(t, true);

    const again = await run(t, true);
    expect(again.rewritten).toBe(0);
    expect(again.userSettings.alreadyEncrypted).toBe(1);
    expect(again.globalSettings.alreadyEncrypted).toBe(1);
  });

  it("refuses to rewrite when no secret is configured, but still answers the count", async () => {
    delete process.env[SECRET];
    const t = convexTest(schema, modules);
    await seed(t);

    const res = await run(t, true);
    expect(res.secretConfigured).toBe(false);
    // `apply: true` asked for a rewrite; without a key it must not pretend.
    expect(res.applied).toBe(false);
    expect(res.rewritten).toBe(0);
    expect(res.userSettings.plaintext).toBe(1);

    const keys = await t.run(async (ctx) =>
      (await ctx.db.query("globalAISettings").collect()).map((r) => r.apiKey),
    );
    expect(keys[0]).toBe("sk-or-plaintext-global");
  });
});
