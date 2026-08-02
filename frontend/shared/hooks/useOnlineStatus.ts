"use client";

import { useEffect, useState } from "react";

/**
 * Reactive online/offline status.
 *
 * SSR-safe: defaults to `true` on the server and during the first paint
 * (so hydration matches), then syncs to the real `navigator.onLine`
 * value and listens for `online` / `offline` events. Use to show an
 * offline banner or to disable network-dependent actions before a
 * Convex mutation fails with a generic error.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return online;
}
