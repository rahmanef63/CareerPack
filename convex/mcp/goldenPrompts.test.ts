/* Structural checks over the golden prompts. Free, and they run in CI.
 *
 * These catch the failures that need no model to detect: a tool renamed out
 * from under its prompts, a tool nobody wrote a way to reach, a negative case
 * that secretly expects a call. Whether a model actually PICKS the named tool
 * is a different question, answered by goldenPrompts.eval.test.ts. */
import { describe, expect, it } from "vitest";
import { GOLDEN_PROMPTS } from "./goldenPrompts";
import { RESOLVED_TOOLS } from "./tools";

const NAMES = new Set(RESOLVED_TOOLS.map((t) => t.name));

describe("golden prompts", () => {
  it("only ever names a tool that exists", () => {
    // The highest-value check here: a rename lands as a failing test instead
    // of as an assistant that silently stops working.
    const named = GOLDEN_PROMPTS.filter((p) => p.tool !== null).map((p) => p.tool!);
    expect([...new Set(named)].filter((n) => !NAMES.has(n))).toEqual([]);
  });

  it("covers every registered tool with at least one direct prompt", () => {
    // A tool with no direct prompt is one nobody has described a way to reach.
    const direct = new Set(
      GOLDEN_PROMPTS.filter((p) => p.kind === "direct").map((p) => p.tool),
    );
    expect([...NAMES].filter((n) => !direct.has(n))).toEqual([]);
  });

  it("expects no tool call for every negative prompt", () => {
    for (const p of GOLDEN_PROMPTS.filter((x) => x.kind === "negative")) {
      expect(p.tool, p.prompt).toBeNull();
    }
  });

  it("has no duplicate prompts, which would silently double a tool's weight", () => {
    const keys = GOLDEN_PROMPTS.map((p) => p.prompt.trim().toLowerCase());
    expect(keys.length - new Set(keys).size).toBe(0);
  });

  it("keeps all three kinds populated", () => {
    for (const kind of ["direct", "indirect", "negative"] as const) {
      expect(GOLDEN_PROMPTS.filter((p) => p.kind === kind).length, kind).toBeGreaterThan(0);
    }
  });

  it("keeps every description inside the 1024-char function-description cap", () => {
    // OpenAI rejects a function whose description exceeds 1024 characters, and
    // the whole request fails — not just that tool. Descriptions here are the
    // model's only instructions, so they grow; this is the ceiling they grow
    // into. Longest today is 815.
    for (const t of RESOLVED_TOOLS) {
      expect(t.description.length, t.name).toBeLessThanOrEqual(1024);
    }
  });
});
