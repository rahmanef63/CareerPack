/**
 * Next.js instrumentation hook — run once on server boot.
 *
 * `onRequestError` fires for every uncaught error in a Server
 * Component / Route Handler / Server Action. We forward to Convex
 * `errorLogs` so admin can review. Stays best-effort — we never want
 * the error reporter to throw and mask the original.
 *
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */

import type { Instrumentation } from "next";

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
