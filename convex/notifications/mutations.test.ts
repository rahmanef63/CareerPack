import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

// `import.meta.glob` is a Vite/Vitest feature; the convex tsconfig only pulls
// in @types/node, so augment ImportMeta locally (mirrors guards.integration.test.ts).
declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<Record<string, unknown>>>;
  }
}

// convex-test needs the full function module graph incl. `_generated`. The
// recursive `../**` glob deliberately EXCLUDES this test file's own directory
// (Vite importer-dir exclusion), so `notifications/*` would be missing — add
// an explicit same-dir glob and remap its `./` keys to the `../notifications/`
// root shape convex-test resolves against (it derives the prefix from the
// `_generated` key, then looks up `<prefix> + "<domain>/<file>"`). Type-only
// `.d.ts` and test/config files are dropped.
const recursive = import.meta.glob("../**/*.{ts,js}");
const sameDir = Object.fromEntries(
  Object.entries(import.meta.glob("./*.{ts,js}")).map(([path, mod]) => [
    path.replace(/^\.\//, "../notifications/"),
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
  return t.run((ctx) => ctx.db.insert("users", { email: "n@x.com" }));
}

// createNotification is internal (server-side producer) — called via
// `internal.*` with an explicit userId, not via an authenticated client.
describe("createNotification actionUrl allowlist (open-redirect / javascript: href)", () => {
  it("drops a javascript: actionUrl (not stored)", async () => {
    const t = setup();
    const userId = await insertUser(t);

    const id = await t.mutation(internal.notifications.mutations.createNotification, {
      userId,
      type: "info",
      title: "Halo",
      message: "Pesan",
      actionUrl: "javascript:alert(document.cookie)",
    });

    const stored = await t.run((ctx) => ctx.db.get(id));
    expect(stored?.actionUrl).toBeUndefined();
  });

  it("preserves a valid https actionUrl", async () => {
    const t = setup();
    const userId = await insertUser(t);

    const id = await t.mutation(internal.notifications.mutations.createNotification, {
      userId,
      type: "info",
      title: "Halo",
      message: "Pesan",
      actionUrl: "https://example.com/",
    });

    const stored = await t.run((ctx) => ctx.db.get(id));
    expect(stored?.actionUrl).toBe("https://example.com/");
  });

  it("keeps a root-relative actionUrl", async () => {
    const t = setup();
    const userId = await insertUser(t);

    const id = await t.mutation(internal.notifications.mutations.createNotification, {
      userId,
      type: "info",
      title: "Halo",
      message: "Pesan",
      actionUrl: "/dashboard/calendar",
    });

    const stored = await t.run((ctx) => ctx.db.get(id));
    expect(stored?.actionUrl).toBe("/dashboard/calendar");
  });
});
