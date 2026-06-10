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
      className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-amber-500 px-3 py-1.5 text-center text-sm font-medium text-amber-950 shadow-sm"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
      <span>
        Anda sedang offline. Beberapa fitur mungkin tidak tersedia sampai
        koneksi kembali.
      </span>
    </div>
  );
}
