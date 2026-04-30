"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  getPWAInstallSnapshot,
  getPWAInstallServerSnapshot,
  subscribePWAInstall,
  registerServiceWorker,
} from "../lib/pwa";

interface UsePWAInstallReturn {
  /** True when the browser has fired `beforeinstallprompt` and not yet installed. */
  canInstall: boolean;
  /** Trigger the native install prompt. Resolves to user's choice. */
  install: () => Promise<"accepted" | "dismissed" | "unavailable">;
  /** True after the app reports it has been installed. */
  isInstalled: boolean;
}

/**
 * Reads from the module-level PWA singleton via `useSyncExternalStore` —
 * registers no additional `beforeinstallprompt` listeners. Safe to call
 * from many components at once; the snapshot stays referentially stable
 * between events so React never tears.
 */
export function usePWAInstall(): UsePWAInstallReturn {
  const { deferred, installed } = useSyncExternalStore(
    subscribePWAInstall,
    getPWAInstallSnapshot,
    getPWAInstallServerSnapshot,
  );

  useEffect(() => {
    registerServiceWorker();
  }, []);

  const install = useCallback(async () => {
    const { deferred: d } = getPWAInstallSnapshot();
    if (!d) return "unavailable" as const;
    await d.prompt();
    const choice = await d.userChoice;
    return choice.outcome;
  }, []);

  return {
    canInstall: !!deferred && !installed,
    install,
    isInstalled: installed,
  };
}
