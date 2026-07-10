"use client";

import { useEffect, useRef } from "react";
import { forceFreshReload } from "@/shared/lib/staleBundle";
import { notify } from "@/shared/lib/notify";

/** Periodic background check cadence. */
const POLL_INTERVAL_MS = 5 * 60 * 1000;
/** Skip a check if we polled within this window (focus debounce). */
const FOCUS_DEBOUNCE_MS = 30 * 1000;

/**
 * New-version detector. Compares the build ID frozen into the client
 * bundle (build-time inject via `next.config.ts`) against the live build
 * ID served by `/api/build-id`.
 *
 * On a real mismatch it surfaces a DISMISSIBLE toast with a "Muat ulang"
 * action — it no longer silently reloads, so a fresh deploy never yanks
 * a user out of a half-written CV. `forceFreshReload()` (SW unregister +
 * Cache Storage purge + cache-busted reload) runs only when the user
 * clicks the action.
 *
 * Prompted once per detected build ID (a later deploy re-prompts). The
 * toast shares a stable sonner id (via `notify.action`) so repeated polls
 * refresh it in place rather than stacking copies. No auto-reload means
 * no reload loop, so the old sessionStorage loop-guard is gone.
 */
export function UpdateChecker() {
  const localBuildId = process.env.NEXT_PUBLIC_BUILD_ID ?? "unknown";
  const lastPolledAt = useRef(0);
  const promptedFor = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localBuildId === "unknown") return; // dev mode — skip

    let stopped = false;

    const promptUpdate = () => {
      notify.action("Versi baru tersedia", {
        description: "Muat ulang untuk memakai versi terbaru aplikasi.",
        actionLabel: "Muat ulang",
        onAction: () => {
          void forceFreshReload();
        },
        duration: Infinity,
      });
    };

    const check = async () => {
      lastPolledAt.current = Date.now();
      try {
        const r = await fetch("/api/build-id", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as { buildId?: string };
        if (stopped) return;
        if (!j.buildId || j.buildId === "unknown") return;
        if (j.buildId === localBuildId) return;
        // Prompt once per new build; a subsequent deploy (different id)
        // re-prompts so a user who dismissed an old one still learns of
        // the next release.
        if (promptedFor.current === j.buildId) return;
        promptedFor.current = j.buildId;
        promptUpdate();
      } catch {
        // Network blip — ignore.
      }
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastPolledAt.current < FOCUS_DEBOUNCE_MS) return;
      void check();
    };

    void check(); // initial
    const id = window.setInterval(() => void check(), POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      stopped = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [localBuildId]);

  return null;
}
