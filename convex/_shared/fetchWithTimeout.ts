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
  maxResponseBytes?: number;
}

export async function fetchWithTimeout(
  input: string,
  options: FetchTimeoutOptions,
): Promise<Response> {
  const { timeoutMs, maxResponseBytes = 4 * 1024 * 1024, signal: callerSignal, ...rest } = options;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error(`[fetch] invalid timeoutMs: ${timeoutMs}`);
  }
  if (!Number.isSafeInteger(maxResponseBytes) || maxResponseBytes <= 0) throw new Error("[fetch] invalid byte limit");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const aborted = new Promise<never>((_, reject) => {
    controller.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
  });
  // A signal already aborted on entry can reject before the race is attached.
  void aborted.catch(() => {});

  // Forward caller-supplied abort to our controller so user-cancelled
  // fetches still cancel the underlying request.
  const onAbort = () => controller.abort();
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener("abort", onAbort);
  }

  try {
    if (controller.signal.aborted) throw new DOMException("aborted", "AbortError");
    const response = await Promise.race([fetch(input, { ...rest, redirect: "error", signal: controller.signal }), aborted]);
    if (!response.body) return response;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { value, done } = await Promise.race([reader.read(), aborted]);
        if (done) break;
        size += value.byteLength;
        if (size > maxResponseBytes) {
          controller.abort();
          throw new Error("[fetch] response exceeds byte limit");
        }
        chunks.push(value);
      }
    } finally { void reader.cancel(); }
    // Buffer under the same deadline, so later text/json reads cannot hang.
    return new Response(new Blob(chunks as BlobPart[]), { status: response.status, statusText: response.statusText, headers: response.headers });
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
