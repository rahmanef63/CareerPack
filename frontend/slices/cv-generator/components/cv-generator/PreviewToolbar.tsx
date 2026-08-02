"use client";

import { FileText, Maximize2, Scroll } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { PreviewLayout } from "../../hooks/usePreviewControls";

interface Props {
  layout: PreviewLayout;
  onLayoutChange: (layout: PreviewLayout) => void;
  /** Optional — fullscreen button hidden when omitted (e.g. inside the
   *  dialog itself). */
  onFullscreen?: () => void;
  className?: string;
}

/**
 * Minimal preview chrome — one segmented control + optional fullscreen.
 * Layout choice flows into both the on-screen preview and the PDF
 * export, so the toggle is the user's single point of truth.
 */
export function PreviewToolbar({
  layout,
  onLayoutChange,
  onFullscreen,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-md border border-border bg-card/60 px-2 py-1.5",
        className,
      )}
      role="toolbar"
      aria-label="Pratinjau tata letak"
    >
      <div
        role="radiogroup"
        aria-label="Mode halaman"
        className="inline-flex rounded-md border border-border bg-background p-0.5"
      >
        <ModeButton
          active={layout === "paginated"}
          onClick={() => onLayoutChange("paginated")}
          icon={<FileText className="h-3.5 w-3.5" />}
          label="A4 multi-halaman"
          hint="Standar A4 dengan batas halaman"
        />
        <ModeButton
          active={layout === "long"}
          onClick={() => onLayoutChange("long")}
          icon={<Scroll className="h-3.5 w-3.5" />}
          label="Satu halaman panjang"
          hint="PDF satu halaman setinggi konten"
        />
      </div>

      {onFullscreen && (
        <button
          type="button"
          onClick={onFullscreen}
          aria-label="Layar penuh"
          className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      title={hint}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "bg-brand text-brand-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
