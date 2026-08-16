/* The model-facing contract, pinned.
 *
 * These are properties a client silently depends on. Break one and nothing
 * throws — the model just starts picking the wrong tool, or a host starts
 * auto-approving a write, or ChatGPT quietly stops offering a file. */
import { describe, expect, it } from "vitest";
import { RESOLVED_TOOLS, toolDescriptors } from "./tools";
import { SCOPE, satisfiesScope, type McpScope } from "./types";
import { assertFileParamsConformant } from "./_vendor/mcpFiles";

describe("tools/list snapshot", () => {
  /* The published catalog, byte for byte. Renaming a tool, reworded
   * description, flipped annotation or changed required[] all reach a third
   * party's model with no other signal — nothing here throws, the model just
   * starts behaving differently. The snapshot makes each of those a diff
   * somebody has to approve.
   *
   * When this fails: read the diff. If the change was intended, `vitest -u`.
   * If you did not mean to touch the model-facing contract, you have a bug. */
  it("matches the committed contract", () => {
    expect(toolDescriptors()).toMatchSnapshot();
  });

  it("publishes every registered tool and nothing else", () => {
    expect(toolDescriptors().map((t) => t.name)).toEqual(RESOLVED_TOOLS.map((t) => t.name));
  });
});

describe("scope resolution", () => {
  it("gives every tool exactly one known scope", () => {
    for (const t of RESOLVED_TOOLS) {
      expect([SCOPE.READ, SCOPE.WRITE], t.name).toContain(t.scope);
    }
  });

  it("classifies read-only tools as mcp.read and everything else as mcp.write", () => {
    // The scope is DERIVED from readOnlyHint, so this asserts the derivation
    // still holds rather than restating it — if someone hand-sets a scope that
    // contradicts the annotation, this is what catches it.
    for (const t of RESOLVED_TOOLS) {
      const expected = t.annotations.readOnlyHint === true ? SCOPE.READ : SCOPE.WRITE;
      expect(t.scope, t.name).toBe(expected);
    }
  });

  it("requires mcp.write for every destructive tool", () => {
    for (const t of RESOLVED_TOOLS) {
      if (t.annotations.destructiveHint) expect(t.scope, t.name).toBe(SCOPE.WRITE);
    }
  });

  it("has both read and write tools, so neither branch is vacuous", () => {
    expect(RESOLVED_TOOLS.some((t) => t.scope === SCOPE.READ)).toBe(true);
    expect(RESOLVED_TOOLS.some((t) => t.scope === SCOPE.WRITE)).toBe(true);
  });
});

describe("satisfiesScope", () => {
  const read: McpScope[] = [SCOPE.READ];
  const write: McpScope[] = [SCOPE.WRITE];
  const both: McpScope[] = [SCOPE.READ, SCOPE.WRITE];

  it("lets a read token read", () => expect(satisfiesScope(read, SCOPE.READ)).toBe(true));

  it("does NOT let a read token write — the hole this closes", () => {
    expect(satisfiesScope(read, SCOPE.WRITE)).toBe(false);
  });

  it("treats write as implying read", () => expect(satisfiesScope(write, SCOPE.READ)).toBe(true));

  it("refuses an empty scope set outright", () => {
    expect(satisfiesScope([], SCOPE.READ)).toBe(false);
    expect(satisfiesScope([], SCOPE.WRITE)).toBe(false);
  });

  it("accepts both", () => {
    expect(satisfiesScope(both, SCOPE.READ)).toBe(true);
    expect(satisfiesScope(both, SCOPE.WRITE)).toBe(true);
  });

  it("a read token cannot reach any destructive tool", () => {
    const reachable = RESOLVED_TOOLS.filter((t) => satisfiesScope(read, t.scope));
    expect(reachable.every((t) => !t.annotations.destructiveHint)).toBe(true);
    expect(reachable.length).toBeGreaterThan(0);
  });
});

describe("OpenAI file params", () => {
  it("every tool declaring fileParams uses a conformant schema", () => {
    // Scan Tools and plugin submission reject any other shape, and nothing
    // fails locally when it drifts — the tool just stops being offered a file.
    for (const t of RESOLVED_TOOLS) {
      expect(() => assertFileParamsConformant({ name: t.name, inputSchema: t.inputSchema, _meta: t.meta })).not.toThrow();
    }
  });

  it("portfolio_attach_media accepts a file and is not destructive", () => {
    const t = RESOLVED_TOOLS.find((x) => x.name === "portfolio_attach_media");
    expect(t, "portfolio_attach_media missing").toBeTruthy();
    expect(t!.meta?.["openai/fileParams"]).toEqual(["file"]);
    expect(t!.scope).toBe(SCOPE.WRITE);
    // It appends and never deletes, so a host must not force a scary prompt.
    expect(t!.annotations.destructiveHint).toBe(false);
    // A portfolio page is public, so the thumbnail is public internet state.
    expect(t!.annotations.openWorldHint).toBe(true);
  });

  /* Convex refuses to encode any object key starting with `$`, so a `$defs` or
   * `$ref` in a descriptor throws for the WHOLE response — the first call every
   * client makes. That outage is real, but it needs the RPC to be a Convex
   * `action`, whose return value crosses the value encoder. This server is an
   * `httpAction` that JSON.stringifies into a Response body, so descriptors
   * never reach the encoder and cannot take it down here.
   *
   * Kept anyway: the schemas come from a shared package that is also vendored
   * into action-based servers, where it IS an outage, and inlining costs
   * nothing. Do not cite this test as protecting THIS deployment. */
  it("no descriptor carries a $-prefixed key, so the schema stays portable", () => {
    const walk = (n: unknown, path: string): void => {
      if (!n || typeof n !== "object") return;
      if (Array.isArray(n)) return n.forEach((x, i) => walk(x, `${path}[${i}]`));
      for (const [k, v] of Object.entries(n)) {
        expect(k.startsWith("$"), `${path}.${k}`).toBe(false);
        walk(v, `${path}.${k}`);
      }
    };
    for (const t of RESOLVED_TOOLS) walk(t.inputSchema, t.name);
  });
});

/* Per-tool prompt context.
 *
 * The server-level `instructions` say what CareerPack is; these say what one
 * tool is for. A model meets a tool as a name plus this text and nothing else,
 * so an undescribed argument or an id with no stated source is a guess waiting
 * to happen — and both are invisible in review, because a tool with a thin
 * description works perfectly in every test that calls it with correct args.
 */
describe("every tool carries its own prompt context", () => {
  // RESOLVED_TOOLS, not toolDescriptors(): same catalog, but typed, so these
  // read annotations without casting through `unknown`.
  const tools = RESOLVED_TOOLS;

  it("describes what it is for, at more than a label's worth of length", () => {
    const thin = tools
      .map((t) => [t.name, t.description.trim().length] as const)
      .filter(([, len]) => len < 120);
    expect(thin).toEqual([]);
  });

  it("describes every argument, including object-typed ones", () => {
    const undocumented: string[] = [];
    for (const t of tools) {
      const props = (t.inputSchema.properties ?? {}) as Record<string, { description?: string }>;
      for (const [key, spec] of Object.entries(props)) {
        if (!spec?.description?.trim()) undocumented.push(`${t.name}.${key}`);
      }
    }
    expect(undocumented).toEqual([]);
  });

  it("says where a required id comes from, by naming the tool that returns it", () => {
    const names = new Set(tools.map((t) => t.name));
    const orphans: string[] = [];
    for (const t of tools) {
      const required = ((t.inputSchema.required ?? []) as string[]).filter((k) => k.endsWith("_id"));
      if (required.length === 0) continue;
      // Ids are opaque Convex row ids. A model that cannot see which tool
      // hands one out will invent one, and the call fails as "not found" —
      // which reads like the user's data is missing rather than like a bad id.
      const cites = [...names].some((other) => other !== t.name && t.description.includes(other));
      if (!cites) orphans.push(t.name);
    }
    expect(orphans).toEqual([]);
  });

  it("warns about the consequence on anything destructive", () => {
    const unwarned = tools
      .filter((t) => t.annotations.destructiveHint)
      .filter((t) => !/perman|undo|irreversib|cannot be|replace|confirm|no version/i.test(t.description))
      .map((t) => t.name);
    expect(unwarned).toEqual([]);
  });

  it("gives every tool a human title and an explicit readOnlyHint", () => {
    expect(tools.filter((t) => !t.annotations.title?.trim()).map((t) => t.name)).toEqual([]);
    expect(
      tools.filter((t) => typeof t.annotations.readOnlyHint !== "boolean").map((t) => t.name),
    ).toEqual([]);
  });
});
