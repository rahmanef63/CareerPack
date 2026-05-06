import { internalMutation } from "../_generated/server";
import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

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
  const sinkUrl = process.env.ERROR_SINK_URL ?? process.env.SENTRY_DSN;
  if (!sinkUrl) return;
  try {
    await fetch(sinkUrl, {
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
