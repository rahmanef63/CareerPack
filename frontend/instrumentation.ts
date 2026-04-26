/**
 * Next.js instrumentation hook — run once on server boot.
 *
 * `register()` fires before any request handler. Use it to wire up
 * OpenTelemetry exporters, Sentry, Datadog, etc. Empty for now —
 * production runs route through Convex's own logging + the
 * `errorLogs` table mutation. Adding this file alone enables
 * `onRequestError` below.
 *
 * `onRequestError` fires for every uncaught error in a Server
 * Component / Route Handler / Server Action. We forward to Convex
 * `errorLogs` so admin can review. Stays best-effort — we never want
 * the error reporter to throw and mask the original.
 *
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */

import type { Instrumentation } from "next";

export function register() {
  // Future: Sentry.init / OTel SDK init goes here.
  // Kept intentionally empty so the file remains a single source of
  // truth for observability wiring without forcing a SDK choice yet.
}

export const onRequestError: Instrumentation.onRequestError = (
  err,
  request,
  context,
) => {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : "";

  // Structured single-line log — Dokploy / log shipper picks it up;
  // grep-friendly without needing a JSON parser.
  console.error(
    `[onRequestError] ${request.method} ${request.path} (${context.routerKind}/${context.routeType}): ${message}`,
  );
  if (stack) console.error(stack);

  // Hook for future Sentry / OTel ingest — keep best-effort + sync.
};
