"use client";

import { useCallback, useEffect, useReducer } from "react";
import {
  getPWAInstallState,
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
 * Reads from the module-level PWA singleton — registers no additional
 * `beforeinstallprompt` listeners. Safe to call from many components at once.
 */
export function usePWAInstall(): UsePWAInstallReturn {
  // Re-render whenever the singleton state changes
  const [, tick] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    registerServiceWorker();
    return subscribePWAInstall(tick);
  }, []);

  const { deferred, installed } = getPWAInstallState();

  const install = useCallback(async () => {
    const { deferred: d } = getPWAInstallState();
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
