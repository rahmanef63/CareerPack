"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { isStaleBundleError, forceFreshReload } from "@/shared/lib/staleBundle";
import { StaleBundleBanner } from "./StaleBundleBanner";

interface RouteErrorProps {
  /** The error from a Next.js error.tsx boundary. */
  error: Error & { digest?: string };
  /** Reset callback Next.js passes — re-renders the segment. */
  reset: () => void;
  /** Indonesian title above the message. */
  title?: string;
  /** Indonesian explainer copy below the title. */
  description?: string;
  /** When true, hide the "Kembali ke beranda" button (e.g. on landing). */
  hideHomeLink?: boolean;
  /** Tag for console grouping — helps spot which segment crashed. */
  segment?: string;
}

/**
 * Shared route-error fallback. Used by every per-segment error.tsx
 * so the framing stays consistent (icon, copy, reset, home link),
 * with each segment passing slightly different copy + segment tag.
 *
 * Special case: when the error matches the stale-bundle heuristic
 * (`api.foo.bar is not a function`, `Could not find function …`),
 * we hand off to StaleBundleBanner which offers a cache-purging
 * recovery flow instead of the generic reset path. This protects
 * existing PWA installs after breaking deploys.
 */
// Session key guards against reload loops: auto-reload fires at most once.
const AUTO_RELOAD_KEY = "_car_chunk_reload";

export function RouteError({
  error,
  reset,
  title = "Halaman ini sedang bermasalah",
  description = "Coba muat ulang. Kalau masalah tetap muncul, beri tahu kami melalui Pusat Bantuan.",
  hideHomeLink = false,
  segment,
}: RouteErrorProps) {
  const isStale = isStaleBundleError(error);

  useEffect(() => {
    const tag = segment ? `[RouteError:${segment}]` : "[RouteError]";
    console.error(tag, error);
  }, [error, segment]);

  // Auto-reload once on chunk errors — user shouldn't have to click anything.
  useEffect(() => {
    if (!isStale) return;
    try {
      if (!sessionStorage.getItem(AUTO_RELOAD_KEY)) {
        sessionStorage.setItem(AUTO_RELOAD_KEY, "1");
        void forceFreshReload();
      }
    } catch {
      /* sessionStorage unavailable (private mode, etc.) — fall through to banner */
    }
  }, [isStale]);

  if (isStale) {
    return <StaleBundleBanner originalMessage={error.message} />;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-lg border border-destructive/40 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 text-destructive mb-2">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="font-semibold">{title}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        {error.message && (
          <code className="block text-xs bg-muted px-2 py-1 rounded mb-4 font-mono line-clamp-2 break-all">
            {error.message}
          </code>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={reset} variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="w-4 h-4" /> Coba lagi
          </Button>
          {!hideHomeLink && (
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link href="/">
                <ArrowLeft className="w-4 h-4" /> Kembali ke beranda
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
