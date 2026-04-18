"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { cn } from "@/lib/utils";

/**
 * Floating install chip. Only appears when the browser is willing to
 * install the PWA (fires `beforeinstallprompt`) and the user hasn't
 * dismissed it this session.
 */
export function InstallChip({ className }: { className?: string }) {
  const { canInstall, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <div
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-40",
        "top-[calc(env(safe-area-inset-top,0px)+12px)]",
        "flex items-center gap-2 px-3 py-2 rounded-full shadow-lg",
        "bg-card border border-border backdrop-blur-md",
        "animate-stagger-in",
        className
      )}
      role="dialog"
      aria-label="Pasang aplikasi"
    >
      <button
        type="button"
        onClick={() => install()}
        className="flex items-center gap-1.5 text-sm font-semibold text-career-700 dark:text-career-200"
      >
        <Download className="w-4 h-4" />
        Pasang Aplikasi
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
        aria-label="Tutup"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
