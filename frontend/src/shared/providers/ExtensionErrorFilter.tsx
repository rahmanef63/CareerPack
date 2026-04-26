"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { isStaleBundleError, forceFreshReload } from "@/shared/lib/staleBundle";

/**
 * Swallow the benign Chromium "message channel closed" rejection +
 * surface stale-bundle warnings.
 *
 * Stale-bundle behaviour: when a deploy renames API paths, an installed
 * PWA running the OLD bundle hits "Could not find function …" the next
 * time it tries to call a renamed function. Our React `error.tsx`
 * boundaries already detect that synchronously, but a Convex query
 * firing in a background hook can throw OUTSIDE the render path —
 * showing up only as an unhandledrejection. We catch those here and
 * show a one-time persistent toast nudging the user to reload. Only
 * fires once per session (toastShownRef) so the user isn't spammed.
 *
 * Chromium extension noise:
 *   Uncaught (in promise) Error: A listener indicated an asynchronous
 *   response by returning true, but the message channel closed before
 *   a response was received.
 *
 * Cause: Chrome extensions (password managers, Dark Reader, Honey,
 * Grammarly, ad blockers, etc.) inject content scripts that call
 * `chrome.runtime.sendMessage` with a listener returning `true`. The
 * application can't fix the extension's bug — we only stop it
 * polluting our console + Sentry-like aggregators.
 */
export function ExtensionErrorFilter() {
  const staleToastShownRef = useRef(false);

  useEffect(() => {
    const triggerStaleNotice = () => {
      if (staleToastShownRef.current) return;
      staleToastShownRef.current = true;
      toast("Aplikasi versi lama terdeteksi", {
        description:
          "Mohon maaf, perangkat Anda masih memuat versi cache lama. Klik untuk muat ulang dengan cache bersih.",
        action: {
          label: "Muat Ulang",
          onClick: () => {
            void forceFreshReload();
          },
        },
        duration: Infinity,
      });
    };

    const handler = (e: PromiseRejectionEvent) => {
      const reason = e.reason as unknown;
      const msg =
        typeof reason === "string"
          ? reason
          : reason instanceof Error
            ? reason.message
            : "";
      if (
        /listener indicated an asynchronous response.*message channel closed/i.test(
          msg,
        )
      ) {
        e.preventDefault();
        return;
      }
      if (isStaleBundleError(reason)) {
        e.preventDefault();
        triggerStaleNotice();
        return;
      }
      // Non-suppressed rejections — log structured so the dev tools
      // grouping makes them easy to spot.
      console.warn("[unhandledrejection]", reason);
    };
    const onError = (e: ErrorEvent) => {
      if (isStaleBundleError(e.error ?? e.message)) {
        e.preventDefault();
        triggerStaleNotice();
        return;
      }
      // window.onerror — covers synchronous throws from third-party
      // scripts that bypass React. Non-blocking; just log.
      console.warn("[window.onerror]", e.message, e.filename, e.lineno);
    };
    window.addEventListener("unhandledrejection", handler);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", handler);
      window.removeEventListener("error", onError);
    };
  }, []);
  return null;
}
