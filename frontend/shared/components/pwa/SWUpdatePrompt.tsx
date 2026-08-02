"use client";

import { useEffect } from "react";

/** sessionStorage key shared with UpdateChecker — same loop guard. */
const RELOAD_GUARD_KEY = "_car_update_reload_at";
const GUARD_WINDOW_MS = 90 * 1000;

/**
 * Auto-activate new Service Workers silently. When a new SW finishes
 * installing while the old one still controls the page, we postMessage
 * SKIP_WAITING and reload on `controllerchange`. No toast, no user
 * confirmation — same policy as UpdateChecker: latest version
 * always wins, user gets a fresh app on next paint.
 *
 * Why not show a "new version" prompt anymore: the prompt was firing
 * repeatedly across deploys and confusing users who just want the
 * latest. Silent activation matches PWA best practice for non-
 * destructive updates (no schema migrations to worry about here —
 * Convex handles backend independently).
 *
 * Loop guard via shared sessionStorage timestamp ensures we don't
 * fire activation twice within 90s if the SW lifecycle re-emits.
 */
export function SWUpdatePrompt() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const claimGuard = (): boolean => {
      try {
        const last = parseInt(
          window.sessionStorage.getItem(RELOAD_GUARD_KEY) ?? "0",
          10,
        );
        if (Number.isFinite(last) && Date.now() - last < GUARD_WINDOW_MS) {
          return false;
        }
        window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
        return true;
      } catch {
        return true; // private mode — accept one possible extra reload
      }
    };

    const activate = (worker: ServiceWorker | null) => {
      if (!worker) return;
      if (!claimGuard()) return;
      worker.postMessage({ type: "SKIP_WAITING" });
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => window.location.reload(),
        { once: true },
      );
    };

    const onUpdateFound = (registration: ServiceWorkerRegistration) => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (
          installing.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          activate(installing);
        }
      });
    };

    navigator.serviceWorker.ready
      .then((registration) => {
        registration.addEventListener("updatefound", () =>
          onUpdateFound(registration),
        );
        // Activation may already be queued from a previous tab session.
        if (registration.waiting && navigator.serviceWorker.controller) {
          activate(registration.waiting);
        }
      })
      .catch(() => {
        /* SW not ready or failed — non-fatal */
      });
  }, []);

  return null;
}
