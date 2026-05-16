"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  isStaleBundleError,
  forceFreshReload,
  claimAutoReloadOnce,
} from "@/shared/lib/staleBundle";
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
 * (`api.foo.bar is not a function`, `Could not find function …`,
 * `ChunkLoadError`), we auto-reload once silently — the user shouldn't
 * have to click anything for a deploy mismatch. If we already reloaded
 * once this session, hand off to StaleBundleBanner so the user can
 * trigger a manual recovery.
 */
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

  // Auto-reload once on stale-bundle errors — user shouldn't have to click.
  useEffect(() => {
    if (!isStale) return;
    if (claimAutoReloadOnce()) {
      void forceFreshReload();
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
