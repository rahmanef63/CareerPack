"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export interface PreviewSplitLayoutProps {
  /** Form / main content rendered in the left column on desktop. */
  children: ReactNode;
  /** Live preview pane rendered as the sticky right column on desktop. */
  preview: ReactNode;
  /** Optional sticky pill / breadcrumb nav shown above the form on
   *  mobile + tablet only — desktop hides it because the preview pane
   *  carries the visual context. */
  mobileNav?: ReactNode;
  /** Right rail width in px. Default 420 — fits a scaled A4 page or
   *  a phone-frame template comfortably without cramping the form. */
  railWidth?: number;
  /** Tailwind class controlling the sticky offset on desktop, e.g.
   *  `top-6` (default, 1.5rem) or `top-24` for editors that sit below
   *  a tall page header. */
  stickyTop?: string;
  /** Cap on the preview pane height so very tall renders scroll inside
   *  the rail instead of stretching it past the viewport. Tailwind
   *  arbitrary value form. */
  previewMaxHeight?: string;
  /** Aria label for the rail `<aside>`. */
  railLabel?: string;
  className?: string;
}

/**
 * Two-column "form + sticky live preview" layout. Used by editors
 * that benefit from a WYSIWYG side pane (CV builder, Personal
 * Branding, etc).
 *
 * Behavior:
 *   - `< lg`: single column. Preview is hidden (mobile users open
 *     the full-screen Preview modal from the page header / action
 *     bar instead of fighting form real estate).
 *   - `≥ lg`: 2 columns, rail is sticky to the viewport via
 *     `position: sticky`. Form scrolls naturally.
 *
 * Why we leave overflow alone on the rail: sticky only works when
 * no ancestor between the sticky element and the scroll root has
 * `overflow: auto/scroll`. The dashboard's main scroll root is the
 * document, so this composes safely as long as callers don't wrap
 * us in their own scroll container.
 *
 * `minmax(0, 1fr)` on the main column is non-negotiable — without
 * it, a wide child (chart, table, code block) can push the grid
 * past viewport and break the rail width.
 */
export function PreviewSplitLayout({
  children,
  preview,
  mobileNav,
  railWidth = 420,
  stickyTop = "top-6",
  previewMaxHeight,
  railLabel = "Pratinjau langsung",
  className,
}: PreviewSplitLayoutProps) {
  return (
    <div className={cn("space-y-3 lg:space-y-0", className)}>
      {mobileNav && <div className="lg:hidden">{mobileNav}</div>}
      <div
        className="lg:grid lg:items-start lg:gap-6"
        style={{
          // Inline because Tailwind JIT can't statically resolve a
          // dynamic prop. `minmax(0, ...)` on the main column matters
          // — see component docstring.
          gridTemplateColumns: `minmax(0,1fr) minmax(0,${railWidth}px)`,
        }}
      >
        <div className="min-w-0 space-y-4">{children}</div>
        <aside
          aria-label={railLabel}
          className={cn(
            "hidden lg:block lg:self-start lg:sticky",
            stickyTop,
            previewMaxHeight && "lg:overflow-y-auto",
          )}
          style={previewMaxHeight ? { maxHeight: previewMaxHeight } : undefined}
        >
          {preview}
        </aside>
      </div>
    </div>
  );
}
