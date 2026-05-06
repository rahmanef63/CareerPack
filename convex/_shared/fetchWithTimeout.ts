/**
 * `fetch` with a hard upper-bound timeout. Convex actions have an
 * overall execution budget but individual fetches don't — a hanging
 * upstream (AI gateway slowdown, Sentry overload, dead Cloudflare proxy)
 * could burn the whole budget without throwing.
 *
 * Pattern: AbortController + setTimeout. Caller's own AbortSignal (if
 * any) is composed with the timeout so both can cancel the request.
 *
 * Throws `Error("[fetch] timeout after Xms: <url>")` on timeout. Other
 * fetch errors propagate untouched so callers can branch on type.
 *
 * Pure module — no Convex imports — so unit tests import directly.
 */
export interface FetchTimeoutOptions extends RequestInit {
  /** Timeout in ms. No default — callers must commit to a deadline. */
  timeoutMs: number;
}

export async function fetchWithTimeout(
  input: string,
  options: FetchTimeoutOptions,
): Promise<Response> {
  const { timeoutMs, signal: callerSignal, ...rest } = options;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error(`[fetch] invalid timeoutMs: ${timeoutMs}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Forward caller-supplied abort to our controller so user-cancelled
  // fetches still cancel the underlying request.
  const onAbort = () => controller.abort();
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener("abort", onAbort);
  }

  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      // Distinguish caller cancel vs our timer.
      if (callerSignal?.aborted) {
        throw new Error(`[fetch] cancelled: ${input}`);
      }
      throw new Error(`[fetch] timeout after ${timeoutMs}ms: ${input}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
    if (callerSignal) callerSignal.removeEventListener("abort", onAbort);
  }
}

/**
 * Per-purpose default timeouts. Callers pick one — no global default
 * because "what timeout is reasonable" depends entirely on the upstream.
 */
export const FETCH_TIMEOUTS = {
  /** AI gateway chat completion. GPT-4 can take 30s+, GPT-5 longer. */
  aiChat: 60_000,
  /** Sentry envelope POST. Should be fast; if Sentry's down we drop. */
  sentry: 5_000,
  /** Resend transactional email. Tolerant — small chance of slow path. */
  email: 10_000,
  /** OpenRouter model catalog — small payload, fast endpoint. */
  modelList: 10_000,
  /** External job feeds (WWR RSS, RemoteOK JSON). Larger payloads. */
  jobFeed: 15_000,
} as const;
