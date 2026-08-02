"use client";

import { useState } from "react";
import { ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { forceFreshReload } from "@/shared/lib/staleBundle";

/**
 * Apologetic full-card UI shown when an error matches the stale-bundle
 * heuristic (see staleBundle.ts). One primary action — purge cache +
 * reload — with a secondary "open in a new tab" link for the iOS PWA
 * edge case where SW unregister is unreliable.
 */
export function StaleBundleBanner({ originalMessage }: { originalMessage?: string }) {
  const [reloading, setReloading] = useState(false);

  const onReload = async () => {
    setReloading(true);
    try {
      await forceFreshReload();
    } finally {
      // forceFreshReload triggers location.replace, so this branch only
      // matters if the reload was blocked (e.g. permission). Resetting
      // the spinner lets the user try again or use the new-tab fallback.
      setReloading(false);
    }
  };

  const homeUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?_v=${Date.now().toString(36)}`
      : "/";

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-lg border border-amber-500/40 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="font-semibold">Aplikasi versi lama terdeteksi</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Mohon maaf atas ketidaknyamanan ini. Kami baru saja merilis
          pembaruan dan perangkat Anda masih memuat versi cache yang lama.
          Klik tombol di bawah untuk muat ulang dengan cache bersih, atau
          buka di tab baru jika tombol ini tidak bekerja.
        </p>
        {originalMessage && (
          <code className="block text-xs bg-muted px-2 py-1 rounded mb-4 font-mono line-clamp-2 break-all">
            {originalMessage}
          </code>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onReload}
            disabled={reloading}
            size="sm"
            className="gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${reloading ? "animate-spin" : ""}`} />
            {reloading ? "Memuat ulang…" : "Muat Ulang Sekarang"}
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href={homeUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" /> Buka di tab baru
            </a>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Tip: jika Anda memasang aplikasi sebagai PWA, tutup paksa lalu
          buka kembali jika masalah berlanjut.
        </p>
      </div>
    </div>
  );
}
