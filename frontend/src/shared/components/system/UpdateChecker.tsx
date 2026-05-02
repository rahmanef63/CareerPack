"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const FOCUS_DEBOUNCE_MS = 30 * 1000; // don't recheck within 30s of last poll

/**
 * Compares the build ID frozen into the client bundle (at compile
 * time, via `next.config.ts` env injection) against the build ID
 * returned by `/api/build-id` (live from the running server). When
 * they diverge — i.e. a new deploy has shipped while this tab still
 * runs the old JS — show a sticky toast prompting a hard refresh.
 *
 * Polls every 5 minutes and on tab focus (debounced). Toast is shown
 * at most once per session; the user can dismiss it but the next poll
 * will re-show if they ignored it.
 */
export function UpdateChecker() {
  const localBuildId = process.env.NEXT_PUBLIC_BUILD_ID ?? "unknown";
  const lastPolledAt = useRef(0);
  const toastShown = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localBuildId === "unknown") return; // dev mode — skip

    let stopped = false;

    const check = async () => {
      lastPolledAt.current = Date.now();
      try {
        const r = await fetch("/api/build-id", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as { buildId?: string };
        if (stopped) return;
        if (!j.buildId || j.buildId === "unknown") return;
        if (j.buildId !== localBuildId && !toastShown.current) {
          toastShown.current = true;
          toast("Versi baru tersedia", {
            description: "Refresh halaman untuk pakai update terbaru.",
            duration: Infinity,
            action: {
              label: "Refresh",
              onClick: () => {
                // Cache-bust query param so SW + browser cache both miss.
                const url = new URL(window.location.href);
                url.searchParams.set("_v", Date.now().toString(36));
                window.location.replace(url.toString());
              },
            },
            onDismiss: () => {
              // Re-arm so the next poll can show again if user dismisses.
              toastShown.current = false;
            },
          });
        }
      } catch {
        // Network blip — ignore.
      }
    };

    const onFocus = () => {
      if (Date.now() - lastPolledAt.current < FOCUS_DEBOUNCE_MS) return;
      void check();
    };

    void check();
    const id = window.setInterval(() => void check(), POLL_INTERVAL_MS);
    window.addEventListener("focus", onFocus);
    return () => {
      stopped = true;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [localBuildId]);

  return null;
}
