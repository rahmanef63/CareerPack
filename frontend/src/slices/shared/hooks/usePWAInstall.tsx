"use client";

import { useEffect, useState, useCallback } from "react";
import { registerServiceWorker, type BeforeInstallPromptEvent } from "../lib/pwa";

interface UsePWAInstallReturn {
  /** True when the browser has fired `beforeinstallprompt` and not yet installed. */
  canInstall: boolean;
  /** Trigger the native install prompt. Resolves to user's choice. */
  install: () => Promise<"accepted" | "dismissed" | "unavailable">;
  /** True after the app reports it has been installed. */
  isInstalled: boolean;
}

/**
 * Registers the service worker on mount and exposes an install-prompt
 * trigger. The browser fires `beforeinstallprompt` when it decides the
 * PWA criteria are met (manifest, HTTPS, user engagement, etc).
 */
export function usePWAInstall(): UsePWAInstallReturn {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    registerServiceWorker();

    const onBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // Already installed (standalone display mode)
    if (window.matchMedia?.("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    return choice.outcome;
  }, [deferred]);

  return {
    canInstall: !!deferred && !isInstalled,
    install,
    isInstalled,
  };
}
