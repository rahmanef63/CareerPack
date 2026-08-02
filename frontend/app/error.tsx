"use client";

import { RouteError } from "@/shared/components/errors/RouteError";

/**
 * Root error boundary — catches errors from any segment that doesn't
 * have its own `error.tsx`. Per-segment boundaries (`(dashboard)/error.tsx`,
 * `[slug]/error.tsx`, etc.) handle finer-grained crashes; this one is
 * the catch-all.
 */
export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} segment="root" />;
}
