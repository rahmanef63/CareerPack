"use client";

import { Maximize2, Minus, Plus, Printer, Ruler, Scan } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import type { PreviewMode } from "../../hooks/usePreviewControls";

interface Props {
  zoomPct: number | null;
  isOverriding: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  mode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
  showPageBreaks: boolean;
  onTogglePageBreaks: () => void;
  /** Optional — when omitted the fullscreen button is hidden (e.g. when
   *  already inside the fullscreen dialog). */
  onFullscreen?: () => void;
  /** Compact density for the sidebar context. */
  compact?: boolean;
  className?: string;
}

/**
 * Shared chrome above any ScaledCVPreview — zoom, fit, print/screen
 * toggle, page-break overlay, optional fullscreen. The same toolbar
 * renders inside the sidebar mini and the modal so muscle memory
 * carries between the two surfaces.
 */
export function PreviewToolbar({
  zoomPct,
  isOverriding,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  mode,
  onModeChange,
  showPageBreaks,
  onTogglePageBreaks,
  onFullscreen,
  compact = false,
  className,
}: Props) {
  void compact; // reserved for future density branch
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-card/60 px-2 py-1.5",
        className,
      )}
      role="toolbar"
      aria-label="Kontrol preview"
    >
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          aria-label="Perkecil"
          className="h-7 w-7"
          disabled={mode === "print"}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <button
          type="button"
          onClick={onFitWidth}
          className={cn(
            "min-w-[3.25rem] rounded px-1.5 py-0.5 text-center text-[11px] font-medium tabular-nums transition-colors",
            isOverriding
              ? "text-foreground hover:bg-muted"
              : "text-muted-foreground hover:bg-muted",
          )}
          title={isOverriding ? "Klik untuk pas-lebar" : "Pas-lebar otomatis"}
          aria-label="Reset ke pas-lebar"
        >
          {zoomPct !== null ? `${zoomPct}%` : "Auto"}
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          aria-label="Perbesar"
          className="h-7 w-7"
          disabled={mode === "print"}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <span className="hidden sm:inline h-4 w-px bg-border" aria-hidden />

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant={mode === "screen" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onModeChange("screen")}
          aria-pressed={mode === "screen"}
          className="h-7 gap-1 px-2 text-[11px]"
        >
          <Scan className="h-3 w-3" />
          Layar
        </Button>
        <Button
          type="button"
          variant={mode === "print" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onModeChange("print")}
          aria-pressed={mode === "print"}
          className="h-7 gap-1 px-2 text-[11px]"
        >
          <Printer className="h-3 w-3" />
          Cetak
        </Button>
      </div>

      <span className="hidden sm:inline h-4 w-px bg-border" aria-hidden />

      <Button
        type="button"
        variant={showPageBreaks || mode === "print" ? "secondary" : "ghost"}
        size="sm"
        onClick={onTogglePageBreaks}
        aria-pressed={showPageBreaks}
        disabled={mode === "print"}
        className="h-7 gap-1 px-2 text-[11px]"
        title="Tampilkan garis batas halaman A4"
      >
        <Ruler className="h-3 w-3" />
        Batas halaman
      </Button>

      {mode === "print" && (
        <Badge variant="outline" className="ml-auto text-[10px]">
          1:1 cetak
        </Badge>
      )}

      {onFullscreen && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onFullscreen}
          aria-label="Layar penuh"
          className="ml-auto h-7 w-7"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
