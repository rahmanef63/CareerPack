import { internalMutation } from "../_generated/server";
import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { fetchWithTimeout, FETCH_TIMEOUTS } from "./fetchWithTimeout";

/**
 * Centralised error capture for Convex actions.
 *
 * Two sinks, in priority order:
 *   1. `errorLogs` table — always written. Surfaces in the admin
 *      ErrorLogsPanel. Fields are bounded so an unbounded stack trace
 *      can't bloat the table.
 *   2. External webhook (`ERROR_SINK_URL`) — optional. Fired in
 *      best-effort fashion via a separate fetch. Compatible with any
 *      service that accepts a JSON POST: Sentry's envelope endpoint,
 *      Logtail, BetterStack, custom relay, etc.
 *
 * Wrap every callsite in a try/catch — `recordError` itself never
 * throws, so a logging failure cannot mask the original exception.
 *
 * Add `SENTRY_DSN` as an alias for `ERROR_SINK_URL` so deploys that
 * already use Sentry don't need a second variable. The handler does NOT
 * implement Sentry's full envelope format — for that, point a relay
 * service at the URL or migrate to a Sentry SDK once Convex supports
 * long-running tasks.
 */
export interface ErrorRecord {
  source: string;
  message: string;
  stack?: string;
  route?: string;
}

const MAX_MESSAGE_LEN = 1000;
const MAX_STACK_LEN = 4000;
const MAX_SOURCE_LEN = 80;

function trim(s: string | undefined, max: number): string | undefined {
  if (!s) return undefined;
  return s.length > max ? s.slice(0, max) : s;
}

/**
 * Persist + forward an error from an `action` / `internalAction` ctx.
 * Never throws. Caller can ignore the return.
 */
export async function recordError(
  ctx: ActionCtx,
  rec: ErrorRecord,
): Promise<void> {
  // Console first — survives even if DB / external sink are unhealthy.
  const tag = `[${rec.source}]`;
  const route = rec.route ? ` route=${rec.route}` : "";
  console.error(`${tag} ${rec.message}${route}`);

  // Persist to admin errorLogs.
  try {
    await ctx.runMutation(internal._shared.errorSink._insertErrorLog, {
      source: trim(rec.source, MAX_SOURCE_LEN) ?? "unknown",
      message: trim(rec.message, MAX_MESSAGE_LEN) ?? "",
      stack: trim(rec.stack, MAX_STACK_LEN),
      route: rec.route,
    });
  } catch (e) {
    console.error("[errorSink] DB persist failed", e);
  }

  // Forward to external sink (best-effort, non-blocking).
  const sentryDsn = process.env.SENTRY_DSN;
  const genericSink = process.env.ERROR_SINK_URL;
  if (sentryDsn) {
    await forwardToSentry(sentryDsn, rec).catch((e) =>
      console.error("[errorSink] sentry forward failed", e),
    );
  } else if (genericSink) {
    try {
      await fetchWithTimeout(genericSink, {
        timeoutMs: FETCH_TIMEOUTS.sentry,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: rec.source,
          message: rec.message,
          stack: rec.stack,
          route: rec.route,
          timestamp: Date.now(),
        }),
      });
    } catch (e) {
      console.error("[errorSink] external forward failed", e);
    }
  }
}

/**
 * Forward to a real Sentry instance using the envelope protocol —
 * https://develop.sentry.dev/sdk/envelopes/
 *
 * Skips Sentry's full SDK because it isn't compatible with Convex's
 * action sandbox (no global state, no async background flush). The
 * envelope endpoint accepts our hand-built event JSON directly.
 *
 * DSN format: `https://PUBLIC_KEY@HOST/PROJECT_ID`
 *   → endpoint `https://HOST/api/PROJECT_ID/envelope/`
 *   → auth   `X-Sentry-Auth: Sentry sentry_version=7,sentry_key=...`
 */
async function forwardToSentry(dsn: string, rec: ErrorRecord): Promise<void> {
  const parsed = parseSentryDsn(dsn);
  if (!parsed) return;
  const { publicKey, host, projectId, scheme } = parsed;
  const endpoint = `${scheme}//${host}/api/${projectId}/envelope/`;
  const eventId = randomEventId();
  const ts = new Date().toISOString();

  const event = {
    event_id: eventId,
    timestamp: ts,
    platform: "javascript",
    level: "error",
    logger: "errorSink",
    environment: process.env.NODE_ENV ?? "production",
    server_name: process.env.HOSTNAME ?? "convex",
    tags: { source: rec.source, route: rec.route ?? "" },
    message: { formatted: rec.message },
    exception: rec.stack
      ? { values: [{ type: "Error", value: rec.message, stacktrace: parseStack(rec.stack) }] }
      : undefined,
  };

  const envelope =
    JSON.stringify({ event_id: eventId, sent_at: ts }) +
    "\n" +
    JSON.stringify({ type: "event" }) +
    "\n" +
    JSON.stringify(event);

  await fetchWithTimeout(endpoint, {
    timeoutMs: FETCH_TIMEOUTS.sentry,
    method: "POST",
    headers: {
      "Content-Type": "application/x-sentry-envelope",
      "X-Sentry-Auth": `Sentry sentry_version=7,sentry_client=careerpack/1.0,sentry_key=${publicKey}`,
    },
    body: envelope,
  });
}

interface ParsedDsn {
  scheme: string;
  publicKey: string;
  host: string;
  projectId: string;
}

export function parseSentryDsn(dsn: string): ParsedDsn | null {
  // Match `https://KEY@HOST/PROJECT` or `http://...`
  const match = dsn.match(/^(https?:)\/\/([^@]+)@([^/]+)\/(\d+)$/);
  if (!match) return null;
  return {
    scheme: match[1],
    publicKey: match[2],
    host: match[3],
    projectId: match[4],
  };
}

function randomEventId(): string {
  // Sentry expects a 32-char hex string (UUID without dashes).
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface SentryFrame {
  filename?: string;
  function?: string;
  lineno?: number;
  colno?: number;
}

export function parseStack(stack: string): { frames: SentryFrame[] } {
  // Cheap parser — handles V8 ("at fn (file:line:col)") and Firefox-style
  // ("fn@file:line:col"). Sentry shows whatever we send, so partial info
  // is fine. Frames are oldest-first per Sentry convention; reverse the
  // top-down JS stack accordingly.
  const lines = stack.split("\n").map((l) => l.trim()).filter(Boolean);
  const frames: SentryFrame[] = [];
  for (const line of lines) {
    let m = line.match(/at\s+([^\s(]+)\s*\(([^)]+):(\d+):(\d+)\)/);
    if (m) {
      frames.push({
        function: m[1],
        filename: m[2],
        lineno: parseInt(m[3], 10),
        colno: parseInt(m[4], 10),
      });
      continue;
    }
    m = line.match(/at\s+([^:]+):(\d+):(\d+)/);
    if (m) {
      frames.push({
        filename: m[1],
        lineno: parseInt(m[2], 10),
        colno: parseInt(m[3], 10),
      });
      continue;
    }
    m = line.match(/^([^@\s]+)@([^:]+):(\d+):(\d+)/);
    if (m) {
      frames.push({
        function: m[1],
        filename: m[2],
        lineno: parseInt(m[3], 10),
        colno: parseInt(m[4], 10),
      });
    }
  }
  return { frames: frames.reverse() };
}

/**
 * Internal — only `recordError` calls this. Idempotent NOT guaranteed
 * (one row per call); let admin TTL prune later. Reuses existing
 * `errorLogs` table from `admin/schema.ts`.
 */
export const _insertErrorLog = internalMutation({
  args: {
    source: v.string(),
    message: v.string(),
    stack: v.optional(v.string()),
    route: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("errorLogs", {
      source: args.source,
      message: args.message,
      stack: args.stack,
      route: args.route,
      timestamp: Date.now(),
    });
  },
});
