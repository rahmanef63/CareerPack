/* The evaluation harness, checked without a model and without spend.
 *
 * The live eval only runs when someone sets an API key, so none of this logic
 * would otherwise be exercised by anything. A scoring bug here does not throw
 * — it quietly reports the wrong accuracy, which is worse than no eval at all,
 * because someone would go rewrite tool descriptions to chase a phantom. */
import { describe, expect, it } from "vitest";
import {
  createOpenAICaller,
  formatReport,
  mapPool,
  score,
  type EvalOutcome,
} from "./evalRunner";

const BASE = {
  baseUrl: "https://stub.invalid/v1",
  apiKey: "test",
  model: "test-model",
  system: "sys",
  tools: [],
  sleepImpl: async () => {},
};

const reply = (toolName: string | null, promptTokens = 10) =>
  new Response(
    JSON.stringify({
      choices: [
        { message: toolName ? { tool_calls: [{ function: { name: toolName } }] } : {} },
      ],
      usage: { prompt_tokens: promptTokens },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );

describe("createOpenAICaller", () => {
  it("reports the tool the model called", async () => {
    const call = createOpenAICaller({ ...BASE, fetchImpl: async () => reply("cv_list") });
    expect(await call("list my cvs")).toEqual({ picked: "cv_list", promptTokens: 10 });
  });

  it("reports null when the model answered in words", async () => {
    // Not a failure — this is exactly what a negative prompt should produce.
    const call = createOpenAICaller({ ...BASE, fetchImpl: async () => reply(null) });
    const r = await call("hello");
    expect(r.picked).toBeNull();
    expect(r.failure).toBeUndefined();
  });

  it("sends the prompt, the system message and tool_choice auto", async () => {
    let sent: Record<string, unknown> = {};
    const call = createOpenAICaller({
      ...BASE,
      tools: [{ type: "function", function: { name: "t", description: "d", parameters: {} } }],
      fetchImpl: async (_u, init) => {
        sent = JSON.parse(String((init as RequestInit).body));
        return reply("t");
      },
    });
    await call("halo");
    expect(sent.tool_choice).toBe("auto");
    expect(sent.temperature).toBe(0);
    expect((sent.tools as unknown[]).length).toBe(1);
    expect(sent.messages).toEqual([
      { role: "system", content: "sys" },
      { role: "user", content: "halo" },
    ]);
  });

  it("retries a 429 rather than scoring it as a wrong answer", async () => {
    let n = 0;
    const call = createOpenAICaller({
      ...BASE,
      fetchImpl: async () => {
        n++;
        return n === 1
          ? new Response("slow down", { status: 429, headers: { "retry-after": "0" } })
          : reply("cv_list");
      },
    });
    expect(await call("x")).toEqual({ picked: "cv_list", promptTokens: 10 });
    expect(n).toBe(2);
  });

  it("surfaces an auth error as a failure, never as a null pick", async () => {
    // A missing key must not masquerade as "the model chose to call nothing",
    // which would read as a perfect score on every negative prompt.
    const call = createOpenAICaller({
      ...BASE,
      fetchImpl: async () => new Response("no key", { status: 401 }),
    });
    const r = await call("x");
    expect(r.failure).toContain("401");
    expect(r.picked).toBeNull();
  });

  it("gives up with a failure after exhausting retries", async () => {
    const call = createOpenAICaller({
      ...BASE,
      fetchImpl: async () => {
        throw new Error("ECONNRESET");
      },
    });
    expect((await call("x")).failure).toContain("ECONNRESET");
  });
});

describe("mapPool", () => {
  it("keeps output aligned with input order", async () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    const out = await mapPool(items, 5, async (i) => {
      await new Promise((r) => setTimeout(r, (20 - i) % 7));
      return i * 2;
    });
    expect(out).toEqual(items.map((i) => i * 2));
  });

  it("never exceeds the requested width", async () => {
    let live = 0;
    let peak = 0;
    await mapPool(Array.from({ length: 30 }), 4, async () => {
      peak = Math.max(peak, ++live);
      await new Promise((r) => setTimeout(r, 1));
      live--;
    });
    expect(peak).toBeLessThanOrEqual(4);
  });
});

describe("score", () => {
  const c = (kind: string, tool: string | null, prompt: string) => ({ kind, tool, prompt });
  const outcomes: EvalOutcome[] = [
    { case: c("direct", "cv_list", "a"), picked: "cv_list", promptTokens: 5 },
    { case: c("direct", "cv_list", "b"), picked: "cv_get", promptTokens: 5 },
    { case: c("direct", "cv_get", "c"), picked: "cv_list", promptTokens: 5 },
    { case: c("indirect", "goals_list", "d"), picked: "goals_list", promptTokens: 5 },
    { case: c("negative", null, "e"), picked: null, promptTokens: 5 },
    { case: c("negative", null, "f"), picked: "cv_list", promptTokens: 5 },
    { case: c("direct", "cv_list", "g"), picked: null, promptTokens: 5, failure: "HTTP 500" },
  ];
  const s = score(outcomes);

  it("excludes hard failures from the denominator", () => {
    // Six graded, not seven — a 500 is not evidence about tool descriptions.
    expect(s.total).toBe(6);
    expect(s.failures).toHaveLength(1);
  });

  it("counts a correct no-call as a hit", () => {
    expect(s.hits).toBe(3);
    expect(s.accuracy).toBeCloseTo(0.5);
  });

  it("breaks the score down per kind", () => {
    expect(s.byKind).toEqual([
      { kind: "direct", n: 3, hit: 1 },
      { kind: "indirect", n: 1, hit: 1 },
      { kind: "negative", n: 2, hit: 1 },
    ]);
  });

  it("groups misses by the confusion, biggest first", () => {
    // The actionable unit is the confused PAIR, not the prompt.
    expect(s.confusions[0]).toEqual({ pair: "cv_list -> cv_get", prompts: ["b"] });
    expect(s.confusions.map((x) => x.pair)).toContain("(no call) -> cv_list");
    expect(s.confusions.map((x) => x.pair)).toContain("cv_get -> cv_list");
  });

  it("totals prompt tokens across everything attempted", () => {
    expect(s.promptTokens).toBe(35);
  });

  it("reports zero accuracy rather than NaN when nothing was graded", () => {
    expect(score([]).accuracy).toBe(0);
  });
});

describe("formatReport", () => {
  it("shows the totals and the confusion groups", () => {
    const out = formatReport(
      score([
        { case: { kind: "direct", tool: "a", prompt: "p" }, picked: "b", promptTokens: 1 },
      ]),
      "header",
    );
    expect(out).toContain("header");
    expect(out).toContain("TOTAL");
    expect(out).toContain("a -> b");
    expect(out).toContain("- p");
  });
});
