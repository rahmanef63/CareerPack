"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";

/**
 * Thin global banner shown only while the browser is offline.
 *
 * The service worker keeps serving cached shells, but any Convex
 * mutation will fail — this tells the user *why* before they hit a
 * generic toast error. Hidden entirely while online.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      // bg-amber-500/text-amber-950 were the last hardcoded palette colours in
      // the shell: they ignore both the active preset and dark mode, so this
      // banner stayed daylight-amber on a dark app. `warning` is exactly this
      // tone as a token, and warning-foreground is the pair already tuned to
      // pass contrast on it.
      //
      // pt- carries --safe-top because layout.tsx sets viewportFit: "cover" —
      // without it the installed PWA drew this text under the iOS status bar,
      // which is where an offline warning is least readable.
      //
      // It still covers the sticky header (z-20) while offline rather than
      // pushing the page down. Left that way deliberately: reserving layout
      // space for a transient banner means every page reflows twice per
      // connectivity flap, and there is little in the header worth reaching
      // while offline anyway.
      className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-warning px-3 pb-1.5 pt-[calc(0.375rem+var(--safe-top))] text-center text-sm font-medium text-warning-foreground shadow-sm"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
      <span>
        Anda sedang offline. Beberapa fitur mungkin tidak tersedia sampai
        koneksi kembali.
      </span>
    </div>
  );
}
