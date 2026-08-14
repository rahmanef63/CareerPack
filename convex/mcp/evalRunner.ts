/* The mechanics behind the golden-prompt evaluation, separated from the test
 * that configures it.
 *
 * Split out for one reason: a scoring loop, a retry policy and a worker pool
 * are real logic, and logic that only ever runs when someone sets an API key
 * is logic nobody checks. Here it is plain functions with `fetchImpl`
 * injectable, so evalRunner.test.ts exercises every branch — retry, hard
 * failure, no-call, wrong-call — with no network and no spend. */

export interface EvalCase {
  prompt: string;
  kind: string;
  /** Tool the model is supposed to choose, or null when it should call none. */
  tool: string | null;
}

export interface Attempt {
  picked: string | null;
  promptTokens: number;
  /** Set only for a transport/API failure — never for a wrong pick. Keeping
   *  these apart is the whole point: one is a broken run, the other a result. */
  failure?: string;
}

export type EvalOutcome = Attempt & { case: EvalCase };

export interface OpenAIFunction {
  type: "function";
  function: { name: string; description: string; parameters: unknown };
}

export interface CallerConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  system: string;
  tools: readonly OpenAIFunction[];
  fetchImpl?: typeof fetch;
  sleepImpl?: (ms: number) => Promise<void>;
  /** Attempts per prompt, including the first. */
  attempts?: number;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** One prompt -> the name of the tool the model called, if any. */
export function createOpenAICaller(cfg: CallerConfig): (prompt: string) => Promise<Attempt> {
  const doFetch = cfg.fetchImpl ?? fetch;
  const sleep = cfg.sleepImpl ?? defaultSleep;
  const attempts = cfg.attempts ?? 2;
  const url = `${cfg.baseUrl.replace(/\/+$/, "")}/chat/completions`;

  return async (prompt: string): Promise<Attempt> => {
    const body = JSON.stringify({
      model: cfg.model,
      temperature: 0,
      messages: [
        { role: "system", content: cfg.system },
        { role: "user", content: prompt },
      ],
      tools: cfg.tools,
      tool_choice: "auto",
    });

    for (let i = 0; i < attempts; i++) {
      const last = i === attempts - 1;
      let res: Response;
      try {
        res = await doFetch(url, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
          body,
        });
      } catch (e) {
        if (last) return { picked: null, promptTokens: 0, failure: `network: ${(e as Error).message}` };
        await sleep(2000);
        continue;
      }

      // Rate limits and upstream blips are certainties at any concurrency, and
      // counting one as a wrong answer would deflate the score for a reason
      // that has nothing to do with tool descriptions.
      if ((res.status === 429 || res.status >= 500) && !last) {
        await sleep(Number(res.headers.get("retry-after") ?? 5) * 1000);
        continue;
      }
      if (!res.ok) {
        return {
          picked: null,
          promptTokens: 0,
          failure: `HTTP ${res.status}: ${(await res.text()).slice(0, 240)}`,
        };
      }

      const json = (await res.json()) as {
        choices?: { message?: { tool_calls?: { function?: { name?: string } }[] } }[];
        usage?: { prompt_tokens?: number };
      };
      return {
        picked: json.choices?.[0]?.message?.tool_calls?.[0]?.function?.name ?? null,
        promptTokens: json.usage?.prompt_tokens ?? 0,
      };
    }
    return { picked: null, promptTokens: 0, failure: "exhausted retries" };
  };
}

/** Bounded-concurrency map that preserves input order. */
export async function mapPool<T, R>(
  items: readonly T[],
  width: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(width, items.length)) }, async () => {
      for (let i = next++; i < items.length; i = next++) out[i] = await fn(items[i]!);
    }),
  );
  return out;
}

export interface Scored {
  total: number;
  hits: number;
  accuracy: number;
  promptTokens: number;
  byKind: { kind: string; n: number; hit: number }[];
  /** Grouped by the confusion itself — ten prompts sliding the same way are
   *  one wording bug, not ten. */
  confusions: { pair: string; prompts: string[] }[];
  failures: EvalOutcome[];
}

export function score(outcomes: readonly EvalOutcome[]): Scored {
  const failures = outcomes.filter((o) => o.failure);
  const graded = outcomes.filter((o) => !o.failure);
  const hit = (o: EvalOutcome) => o.picked === o.case.tool;

  const kinds = new Map<string, { kind: string; n: number; hit: number }>();
  const pairs = new Map<string, string[]>();
  for (const o of graded) {
    const k = kinds.get(o.case.kind) ?? { kind: o.case.kind, n: 0, hit: 0 };
    k.n++;
    if (hit(o)) k.hit++;
    else {
      const key = `${o.case.tool ?? "(no call)"} -> ${o.picked ?? "(no call)"}`;
      pairs.set(key, [...(pairs.get(key) ?? []), o.case.prompt]);
    }
    kinds.set(o.case.kind, k);
  }

  const hits = graded.filter(hit).length;
  return {
    total: graded.length,
    hits,
    accuracy: graded.length ? hits / graded.length : 0,
    promptTokens: outcomes.reduce((a, o) => a + o.promptTokens, 0),
    byKind: [...kinds.values()].sort((a, b) => a.kind.localeCompare(b.kind)),
    confusions: [...pairs]
      .map(([pair, prompts]) => ({ pair, prompts }))
      .sort((a, b) => b.prompts.length - a.prompts.length),
    failures,
  };
}

export function formatReport(s: Scored, header: string): string {
  const pct = (n: number, d: number) => (d ? ((n / d) * 100).toFixed(1) : "0.0") + "%";
  const out = [header, "", "kind        n    hit   accuracy"];
  for (const k of s.byKind) {
    out.push(
      `${k.kind.padEnd(11)}${String(k.n).padStart(3)}  ${String(k.hit).padStart(4)}   ${pct(k.hit, k.n)}`,
    );
  }
  out.push(
    `${"TOTAL".padEnd(11)}${String(s.total).padStart(3)}  ${String(s.hits).padStart(4)}   ${pct(s.hits, s.total)}   (${s.promptTokens.toLocaleString()} prompt tokens)`,
  );
  if (s.confusions.length) {
    out.push("", "misses, grouped by confusion:");
    for (const c of s.confusions) {
      out.push(`  ${c.pair}  (${c.prompts.length})`);
      for (const p of c.prompts.slice(0, 3)) out.push(`    - ${p}`);
    }
  }
  return out.join("\n");
}
