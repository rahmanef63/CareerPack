"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  isStaleBundleError,
  forceFreshReload,
  claimAutoReloadOnce,
} from "@/shared/lib/staleBundle";

/**
 * Window-level error filter.
 *
 * Three responsibilities:
 *
 * 1) Auto-reload on stale-bundle errors that fire OUTSIDE React (a
 *    background hook's promise rejection, a window.onerror from a
 *    chunk load) — React error boundaries can't catch these. Guarded
 *    by `claimAutoReloadOnce` so we never loop.
 *
 * 2) Suppress the benign Chromium "message channel closed" rejection
 *    that browser extensions (password managers, Dark Reader, Honey,
 *    Grammarly, ad blockers) inject via `chrome.runtime.sendMessage`
 *    with a listener returning `true`. Not our bug; just stop it from
 *    polluting the console + Sentry-like aggregators.
 *
 * 3) Show a recovery toast if a stale error fires AGAIN after an
 *    auto-reload already happened — the second occurrence means the
 *    new bundle is also broken (mid-deploy) and the user needs the
 *    manual recovery path.
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

    const handleStale = (preventDefault: () => void) => {
      preventDefault();
      if (claimAutoReloadOnce()) {
        void forceFreshReload();
        return;
      }
      triggerStaleNotice();
    };

    const onRejection = (e: PromiseRejectionEvent) => {
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
        handleStale(() => e.preventDefault());
        return;
      }
      console.warn("[unhandledrejection]", reason);
    };

    const onError = (e: ErrorEvent) => {
      if (isStaleBundleError(e.error ?? e.message)) {
        handleStale(() => e.preventDefault());
        return;
      }
      console.warn("[window.onerror]", e.message, e.filename, e.lineno);
    };

    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);
  return null;
}
