"use client";

import { useEffect, useRef } from "react";
import { forceFreshReload } from "@/shared/lib/staleBundle";

/** sessionStorage key — last auto-reload timestamp (ms). */
const RELOAD_GUARD_KEY = "_car_update_reload_at";
/** Don't auto-reload again within this window — defeats reload loops
 *  if the new bundle still mismatches (server bug, broken deploy). */
const GUARD_WINDOW_MS = 90 * 1000;
/** Periodic background check cadence. */
const POLL_INTERVAL_MS = 5 * 60 * 1000;
/** Skip a check if we polled within this window (focus debounce). */
const FOCUS_DEBOUNCE_MS = 30 * 1000;

/**
 * Silent auto-update. Compares the build ID frozen into the client
 * bundle (build-time inject via `next.config.ts` env) against the
 * live build ID served by `/api/build-id`. On mismatch, calls
 * `forceFreshReload()` which purges SW + Cache Storage and reloads
 * with a cache-buster — so the new bundle actually loads instead of
 * the browser re-serving the same stale chunks.
 *
 * No toast. No "Refresh" button. The user just gets a fresh app.
 *
 * Anti-loop: sessionStorage timestamp ensures we never auto-reload
 * twice within ~90s. If the post-reload client STILL detects a
 * mismatch (shouldn't happen, but e.g. server returns "unknown" or
 * the freshly fetched bundle is also stale), we silently skip — no
 * spam, no loop.
 */
export function UpdateChecker() {
  const localBuildId = process.env.NEXT_PUBLIC_BUILD_ID ?? "unknown";
  const lastPolledAt = useRef(0);
  const reloading = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localBuildId === "unknown") return; // dev mode — skip

    let stopped = false;

    const tryAutoReload = async () => {
      if (reloading.current) return;
      // Loop guard.
      try {
        const last = parseInt(
          window.sessionStorage.getItem(RELOAD_GUARD_KEY) ?? "0",
          10,
        );
        if (Number.isFinite(last) && Date.now() - last < GUARD_WINDOW_MS) {
          return;
        }
        window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
      } catch {
        // sessionStorage unavailable (private mode) — fall through; risk
        // of one extra reload is acceptable, the SW unregister itself is
        // idempotent.
      }
      reloading.current = true;
      // forceFreshReload: SW unregister + caches.delete(*) + location.replace
      // with `?_v=...`. Total budget capped at ~3s by withTimeout.
      await forceFreshReload();
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
        await tryAutoReload();
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
