"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Listen for new Service Worker installations and prompt the user to
 * reload so they pick up the latest bundle without a manual hard
 * refresh.
 *
 * Flow:
 * 1. SW v3-2026-04-25 is active (current).
 * 2. Deploy ships with SW cache name v4-... bumped.
 * 3. Browser fetches the new sw.js, sees the bytes differ, installs
 *    it. The new SW enters `installed` state but waits because the
 *    old one is still controlling pages.
 * 4. We detect the `statechange` to `installed` while there's a
 *    `controller` (= upgrade scenario, not first install) and toast
 *    a "Versi baru siap" prompt with a "Muat ulang" action.
 * 5. User clicks → we postMessage SKIP_WAITING to the new SW; it
 *    activates and replaces the old one. We reload.
 *
 * Without this, users on existing PWA installs would keep seeing
 * the cached old bundle until they manually hard-reload — common
 * complaint after deploys.
 */
export function SWUpdatePrompt() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let toastShown = false;

    const onUpdateFound = (registration: ServiceWorkerRegistration) => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (
          installing.state === "installed" &&
          navigator.serviceWorker.controller &&
          !toastShown
        ) {
          // New version waiting — controller present means this is an
          // upgrade, not a first-time install.
          toastShown = true;
          toast("Versi baru CareerPack siap", {
            description: "Muat ulang untuk pakai pembaruan terbaru.",
            action: {
              label: "Muat ulang",
              onClick: () => {
                installing.postMessage({ type: "SKIP_WAITING" });
                // Listen for activation, then reload.
                navigator.serviceWorker.addEventListener(
                  "controllerchange",
                  () => window.location.reload(),
                  { once: true },
                );
              },
            },
            duration: Infinity, // user must dismiss / act
          });
        }
      });
    };

    navigator.serviceWorker.ready
      .then((registration) => {
        // Manual update check + listen for future updates that come
        // via Workbox's lifecycle.
        registration.addEventListener("updatefound", () =>
          onUpdateFound(registration),
        );
        // Also surface an update that was already waiting at boot
        // (rare — can happen after force-quit + reopen).
        if (registration.waiting && navigator.serviceWorker.controller && !toastShown) {
          toastShown = true;
          toast("Versi baru CareerPack siap", {
            description: "Muat ulang untuk pakai pembaruan terbaru.",
            action: {
              label: "Muat ulang",
              onClick: () => {
                registration.waiting?.postMessage({ type: "SKIP_WAITING" });
                navigator.serviceWorker.addEventListener(
                  "controllerchange",
                  () => window.location.reload(),
                  { once: true },
                );
              },
            },
            duration: Infinity,
          });
        }
      })
      .catch(() => {
        /* SW not ready or failed — non-fatal */
      });
  }, []);

  return null;
}
