import { ConvexHttpClient } from "convex/browser";

/**
 * Bounded, never-throwing Convex reads for the public content routes.
 *
 * `/`, `/dokumen`, `/roadmap`, `/llms.txt` and `sitemap.xml` all read Convex
 * while Next prerenders them. Each of those files documented "degrade instead
 * of failing the build" and each implemented only half of it: a try/catch
 * around a call with **no timeout**. A catch cannot fire on a request that
 * never returns, so a slow or wedged deployment did not degrade — it parked
 * the render until Next's 60s per-page budget killed it:
 *
 *   Failed to build /(marketing)/page: / (attempt 1 of 3) because it took
 *   more than 60 seconds
 *
 * Dokploy builds straight off a push to main, so that is a deploy outage
 * caused by a backend blip, which is the exact failure the try/catch was
 * there to prevent.
 *
 * The fix is a deadline. Convex 1.32's `ConvexHttpClient` has no
 * `setFetchOptions`, but its constructor accepts a custom `fetch` — so the
 * abort signal goes in there and actually cancels the request, rather than
 * `Promise.race` leaving it running in the background.
 */

/** Well inside Next's 60s page budget, and far longer than a healthy Convex
 *  query (single-digit ms). Anything slower than this is not going to finish
 *  usefully within a build. */
const DEFAULT_TIMEOUT_MS = 8_000;

/**
 * Wrap `fetch` so every request carries a deadline, without discarding a
 * signal Convex may have set itself (`AbortSignal.any` needs Node 20+; this
 * only ever runs in the Node build/server runtime, never the browser).
 */
function timeboxedFetch(timeoutMs: number): typeof globalThis.fetch {
  return (input, init) => {
    const deadline = AbortSignal.timeout(timeoutMs);
    const signal = init?.signal
      ? AbortSignal.any([init.signal, deadline])
      : deadline;
    return globalThis.fetch(input, { ...init, signal });
  };
}

/**
 * Run one public query. Returns `fallback` — never throws, never hangs — when
 * the env var is missing, the URL is malformed, the query errors, or the
 * deadline passes.
 *
 * The fallback is passed rather than inferred so each caller states its own
 * degraded shape: `[]` for a list, `null` for a lookup that ends in
 * `notFound()`.
 */
export async function publicContentQuery<T>(
  run: (client: ConvexHttpClient) => Promise<T>,
  fallback: T,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return fallback;

  let client: ConvexHttpClient;
  try {
    client = new ConvexHttpClient(convexUrl, { fetch: timeboxedFetch(timeoutMs) });
  } catch {
    return fallback;
  }

  // Two deadlines, deliberately. The signal above cancels the in-flight HTTP
  // request, which is the tidy thing to do; this race is what actually
  // guarantees the caller gets an answer, because it bounds the await no
  // matter where the time goes — a retry loop inside the client, a DNS stall,
  // a promise that simply never settles. A timeout that only covers the part
  // you predicted is not a timeout.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<typeof fallback>((resolve) => {
    timer = setTimeout(() => resolve(fallback), timeoutMs);
  });

  try {
    const result = await Promise.race([run(client), deadline]);
    return result === undefined ? fallback : result;
  } catch {
    return fallback;
  } finally {
    // Without this the pending timer keeps the Node event loop alive and the
    // build hangs at 100% instead of exiting.
    if (timer) clearTimeout(timer);
  }
}

/** List variant: also guarantees an array, so a query that returns an
 *  unexpected shape cannot make a `.map()` throw during prerender. */
export async function publicContentList<T>(
  run: (client: ConvexHttpClient) => Promise<T[]>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T[]> {
  const rows = await publicContentQuery<T[]>(run, [], timeoutMs);
  return Array.isArray(rows) ? rows : [];
}
