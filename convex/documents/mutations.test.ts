import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { api } from "../_generated/api";
import { JP_DOCS } from "../_seeds/documents/jp";
import { KR_DOCS } from "../_seeds/documents/kr";
import type { Id } from "../_generated/dataModel";

declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<Record<string, unknown>>>;
  }
}

// convex-test module graph: recursive glob misses this test's own dir, so add
// an explicit same-dir glob remapped to the `../documents/` root shape.
const recursive = import.meta.glob("../**/*.{ts,js}");
const sameDir = Object.fromEntries(
  Object.entries(import.meta.glob("./*.{ts,js}")).map(([path, mod]) => [
    path.replace(/^\.\//, "../documents/"),
    mod,
  ]),
);
const modules = Object.fromEntries(
  Object.entries({ ...recursive, ...sameDir }).filter(
    ([path]) => !path.endsWith(".d.ts") && !/\.(test|spec|config)\./.test(path),
  ),
);

// Inferred from `setup`, not `convexTest` directly — the bare
// `ReturnType<typeof convexTest>` drops the schema generic, and every
// `ctx.db.query("documentChecklists")` below then falls back to SystemIndexes.
function setup() {
  return convexTest(schema, modules);
}

type Tester = ReturnType<typeof setup>;

async function insertUser(t: Tester): Promise<Id<"users">> {
  return t.run((ctx) => ctx.db.insert("users", { email: "doc@x.com" }));
}

const identity = (userId: Id<"users">) => ({ subject: `${userId}|session` });

async function seedTemplates(t: Tester) {
  await t.run(async (ctx) => {
    for (const c of [JP_DOCS, KR_DOCS]) {
      await ctx.db.insert("documentTemplates", { ...c, isSystem: true });
    }
  });
}

/** The static Indonesian baseline the frontend seeds on first mount. */
const BASELINE = [
  { id: "doc-1", name: "KTP", category: "local", subcategory: "identity", required: true },
  { id: "doc-10", name: "Paspor", category: "international", subcategory: "travel", required: true },
];

async function readChecklist(t: Tester, userId: Id<"users">) {
  const row = await t.run((ctx) =>
    ctx.db
      .query("documentChecklists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first(),
  );
  if (!row) throw new Error("checklist missing");
  return row;
}

describe("documents mutations — country template import", () => {
  it("keeps local documents and their progress when a country is imported", async () => {
    const t = setup();
    const userId = await insertUser(t);
    await seedTemplates(t);
    const as = t.withIdentity(identity(userId));

    await as.mutation(api.documents.mutations.seedDocumentChecklist, {
      type: "combined",
      template: BASELINE,
    });
    await as.mutation(api.documents.mutations.updateDocumentStatus, {
      documentId: "doc-1",
      completed: true,
      notes: "sudah difotokopi",
    });

    const result = await as.mutation(
      api.documents.mutations.instantiateFromTemplate,
      { country: "JP" },
    );
    expect(result.inserted).toBe(JP_DOCS.documents.length);

    const row = await readChecklist(t, userId);
    const byId = new Map(row.documents.map((d) => [d.id, d]));

    // The whole bug: this used to be gone.
    expect(byId.get("doc-1")).toMatchObject({ completed: true, notes: "sudah difotokopi" });
    expect(byId.get("doc-10")).toBeDefined();

    const jp = byId.get("jp-jlpt-n4");
    expect(jp).toBeDefined();
    expect(jp!.description).toBeTruthy();
    // Tab axis, not the template's own vocabulary — otherwise it renders in
    // neither "Kerja Lokal" nor "Kerja Luar Negeri".
    expect(jp!.category).toBe("international");
    expect(jp!.subcategory).toBe("language");
  });

  it("swaps the destination on a second import instead of stacking countries", async () => {
    const t = setup();
    const userId = await insertUser(t);
    await seedTemplates(t);
    const as = t.withIdentity(identity(userId));

    await as.mutation(api.documents.mutations.seedDocumentChecklist, {
      type: "combined",
      template: BASELINE,
    });
    await as.mutation(api.documents.mutations.instantiateFromTemplate, { country: "JP" });
    await as.mutation(api.documents.mutations.instantiateFromTemplate, { country: "KR" });

    const ids = (await readChecklist(t, userId)).documents.map((d) => d.id);
    expect(ids).toContain("doc-1");
    expect(ids.some((id) => id.startsWith("kr-"))).toBe(true);
    expect(ids.some((id) => id.startsWith("jp-"))).toBe(false);
  });

  it("leaves every checkbox writable after an import", async () => {
    const t = setup();
    const userId = await insertUser(t);
    await seedTemplates(t);
    const as = t.withIdentity(identity(userId));

    await as.mutation(api.documents.mutations.seedDocumentChecklist, {
      type: "combined",
      template: BASELINE,
    });
    await as.mutation(api.documents.mutations.instantiateFromTemplate, { country: "JP" });

    // Previously threw "Dokumen tidak ditemukan" — the import had deleted it.
    await expect(
      as.mutation(api.documents.mutations.updateDocumentStatus, {
        documentId: "doc-1",
        completed: true,
      }),
    ).resolves.not.toThrow();
    await expect(
      as.mutation(api.documents.mutations.updateDocumentStatus, {
        documentId: "jp-jlpt-n4",
        completed: true,
      }),
    ).resolves.not.toThrow();
  });

  it("re-seeding the baseline does not undo an import", async () => {
    const t = setup();
    const userId = await insertUser(t);
    await seedTemplates(t);
    const as = t.withIdentity(identity(userId));

    await as.mutation(api.documents.mutations.instantiateFromTemplate, { country: "JP" });
    // What the mount-time self-heal effect fires.
    await as.mutation(api.documents.mutations.seedDocumentChecklist, {
      type: "combined",
      template: BASELINE,
    });

    const row = await readChecklist(t, userId);
    const ids = row.documents.map((d) => d.id);
    expect(ids).toContain("doc-1");
    expect(ids.some((id) => id.startsWith("jp-"))).toBe(true);
    // Losing this would break the previous-country eviction on re-import.
    expect(row.country).toBe("JP");
  });
});
