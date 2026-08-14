/* Golden-prompt evaluation — the half that needs a real model.
 *
 * The structural tests next door prove the catalog is internally consistent.
 * They cannot answer the question that matters: given a real request, does a
 * model pick the tool we meant? Only a model can, so this costs tokens and is
 * OFF unless you ask for it.
 *
 *   MCP_EVAL=1 MCP_EVAL_API_KEY=sk-... \
 *     pnpm exec vitest run convex/mcp/goldenPrompts.eval.test.ts \
 *     --reporter=verbose | tee mcp-eval-report.txt
 *
 * `--reporter=verbose` is NOT optional. The default reporter swallows console
 * output on a passing test, and the report IS the point of the run — without
 * it you get "1 passed" and nothing else. `tee` keeps a copy worth diffing
 * against the next run. (Writing the file from inside the test is not an
 * option: `node:fs` has no import under convex/, whose default runtime is a
 * V8 isolate with no Node builtins.)
 *
 * Knobs (all optional):
 *   MCP_EVAL_PROVIDER      key from _shared/aiProviders.ts        default openai
 *   MCP_EVAL_BASE_URL      override the provider's baseUrl
 *   MCP_EVAL_MODEL         override the provider's defaultModel
 *   MCP_EVAL_KIND          direct | indirect | negative           default all
 *   MCP_EVAL_TOOL          only prompts expecting this tool
 *   MCP_EVAL_LIMIT         first N prompts after filtering        default all
 *   MCP_EVAL_CONCURRENCY   in-flight requests                     default 4
 *   MCP_EVAL_MIN_ACCURACY  floor the run must clear               default 0.8
 *
 * COST. Every request carries all 69 tool schemas, so a full 243-prompt run is
 * millions of input tokens. Providers that cache identical prefixes make that
 * much cheaper, but do not find the bill out by accident: start with
 * MCP_EVAL_LIMIT=20, or MCP_EVAL_TOOL to iterate on one tool's wording. The
 * run prints its own token usage.
 *
 * The floor is a regression guard, not a grade. Take a baseline from a full
 * run, then set MCP_EVAL_MIN_ACCURACY just under it.
 *
 * The mechanics live in evalRunner.ts and are tested there without a network. */
import { describe, expect, it } from "vitest";
import { AI_PROVIDERS } from "../_shared/aiProviders";
import {
  createOpenAICaller,
  formatReport,
  mapPool,
  score,
  type EvalOutcome,
} from "./evalRunner";
import { GOLDEN_PROMPTS } from "./goldenPrompts";
import { RESOLVED_TOOLS } from "./tools";

const env = (k: string) => process.env[k]?.trim() || undefined;
const num = (k: string, d: number) => Number(env(k) ?? d);

const ENABLED = env("MCP_EVAL") === "1";
const PROVIDER = env("MCP_EVAL_PROVIDER") ?? "openai";
const SPEC = AI_PROVIDERS[PROVIDER];
const BASE_URL = env("MCP_EVAL_BASE_URL") ?? SPEC?.baseUrl ?? "";
const MODEL = env("MCP_EVAL_MODEL") ?? SPEC?.defaultModel ?? "";
const API_KEY = env("MCP_EVAL_API_KEY") ?? "";

/** What a host puts in front of the catalog. Deliberately thin: the tool
 *  descriptions are the thing under test, so the system prompt must not do
 *  their job for them. The one instruction that earns its place is permission
 *  NOT to call a tool — without it every negative case is unwinnable. */
const SYSTEM =
  "You are an assistant connected to the user's CareerPack account, an Indonesian career-management app. " +
  "Call a tool when one fits what the user is asking for. " +
  "If no tool fits, just answer in words — do not force a call.";

/** MCP tool -> OpenAI function. `inputSchema` is already a JSON Schema object,
 *  which is exactly what `parameters` expects. */
const FUNCTIONS = RESOLVED_TOOLS.map((t) => ({
  type: "function" as const,
  function: { name: t.name, description: t.description, parameters: t.inputSchema },
}));

function select() {
  const kind = env("MCP_EVAL_KIND");
  const tool = env("MCP_EVAL_TOOL");
  const limit = num("MCP_EVAL_LIMIT", 0);
  let rows = GOLDEN_PROMPTS.map((p) => ({ prompt: p.prompt, kind: p.kind, tool: p.tool }));
  if (kind) rows = rows.filter((p) => p.kind === kind);
  if (tool) rows = rows.filter((p) => p.tool === tool);
  return limit > 0 ? rows.slice(0, limit) : rows;
}

describe.skipIf(!ENABLED)("golden prompt evaluation (live model)", () => {
  it("picks the intended tool often enough", async () => {
    // A configuration problem must look like a configuration problem. Reporting
    // 0% because a key is unset would send someone off rewriting tool
    // descriptions to fix an environment variable.
    expect(API_KEY, "MCP_EVAL_API_KEY is required when MCP_EVAL=1").toBeTruthy();
    expect(BASE_URL, `unknown provider "${PROVIDER}" and no MCP_EVAL_BASE_URL`).toBeTruthy();
    expect(MODEL, "no model resolved — set MCP_EVAL_MODEL").toBeTruthy();

    const cases = select();
    expect(cases.length, "filters matched no prompts").toBeGreaterThan(0);

    const width = num("MCP_EVAL_CONCURRENCY", 4);
    const header =
      `[eval] ${cases.length} prompts · ${FUNCTIONS.length} tools · ` +
      `${MODEL} @ ${BASE_URL} · concurrency ${width}`;
    console.log("\n" + header);

    const call = createOpenAICaller({
      baseUrl: BASE_URL,
      apiKey: API_KEY,
      model: MODEL,
      system: SYSTEM,
      tools: FUNCTIONS,
    });

    const outcomes: EvalOutcome[] = await mapPool(cases, width, async (c) => ({
      case: c,
      ...(await call(c.prompt)),
    }));

    const s = score(outcomes);

    if (s.failures.length) {
      // Never let a broken run be reported as a bad score.
      const sample = [...new Set(s.failures.map((f) => f.failure!))].slice(0, 3);
      expect.fail(
        `${s.failures.length}/${outcomes.length} requests failed outright — a setup or quota problem, not an accuracy result:\n  ${sample.join("\n  ")}`,
      );
    }

    console.log("\n" + formatReport(s, header));

    const floor = num("MCP_EVAL_MIN_ACCURACY", 0.8);
    expect(
      s.accuracy,
      `accuracy ${(s.accuracy * 100).toFixed(1)}% is below the ${(floor * 100).toFixed(0)}% floor — see the grouped misses above`,
    ).toBeGreaterThanOrEqual(floor);
  }, 45 * 60 * 1000);
});
