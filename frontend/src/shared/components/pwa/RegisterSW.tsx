"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/shared/lib/pwa";

/**
 * Eager service-worker registration. Mounted once at the root via
 * `Providers.tsx` so the SW is registered on EVERY page load — not
 * just pages that happen to render `usePWAInstall` consumers (which
 * was previously the only registration trigger).
 *
 * Renders nothing; the work happens in a `useEffect` so SSR is safe.
 */
export function RegisterSW() {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return null;
}
