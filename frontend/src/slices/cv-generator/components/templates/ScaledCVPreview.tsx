"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { CVData } from "../../types";
import type { PreviewMode } from "../../hooks/usePreviewControls";
import { CVTemplateRenderer } from "./CVTemplateRenderer";

const A4_WIDTH_PX = 794; // 210mm @ 96dpi
const A4_HEIGHT_PX = 1123; // 297mm @ 96dpi
/** Auto-fit ceiling — slight margin under 1.0 to absorb sub-pixel rounding. */
const AUTO_FIT_MAX = 0.96;

interface Props {
  cv: CVData;
  photoUrl: string;
  /**
   * Compact = sidebar/thumbnail context. Drops the tall minHeight floor
   * so short CVs don't leave an empty band below the page.
   */
  compact?: boolean;
  /**
   * Explicit user-driven zoom (e.g. 0.5 / 1 / 1.5). When provided we
   * skip the container-fit math and render at the given scale. `null` =
   * auto-fit (default).
   */
  zoom?: number | null;
  /**
   * Render mode. `print` shows the page at native 1:1 dimensions with
   * dashed page-break guides — what the user gets after Ctrl-P / PDF
   * export. `screen` (default) is the scaled-to-fit reading view.
   */
  mode?: PreviewMode;
  /** Force dashed page-break overlays even in screen mode. */
  showPageBreaks?: boolean;
  /**
   * Optional callback fired when a section heading in the rendered
   * template enters view (currently only used for scroll-anchor side
   * effects; safe to omit).
   */
  onSectionVisible?: (id: string) => void;
}

/**
 * Live preview of the chosen template at A4 (794 × 1123 px). Three
 * modes blend into the same component:
 *
 *   - Auto-fit (default `zoom = null`): scales down to the available
 *     container width, capped at 0.96 so it never upscales past A4.
 *   - User zoom: caller-controlled 40 %–200 % override.
 *   - Print mode: 1:1 scale + dashed horizontal break lines at every
 *     A4_HEIGHT_PX multiple so the user sees exactly where the PDF
 *     splits pages before export.
 *
 * Capture ref still points at the un-scaled inner template so
 * `html2canvas-pro` rasterises at proper A4 DPI regardless of preview
 * scale.
 */
export const ScaledCVPreview = forwardRef<HTMLDivElement, Props>(
  function ScaledCVPreview(
    {
      cv,
      photoUrl,
      compact = false,
      zoom = null,
      mode = "screen",
      showPageBreaks = false,
    },
    captureRef,
  ) {
    const outerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const [autoScale, setAutoScale] = useState(AUTO_FIT_MAX);
    const [innerHeight, setInnerHeight] = useState(0);

    // ResizeObserver covers both container width changes (rotation,
    // drawer animation) and inner content height changes (user typing).
    // No need for a `[cv]` dep — the inner observer fires on content
    // mutations, and re-running the effect on cv would re-attach the
    // observers needlessly.
    useEffect(() => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;

      const measure = () => {
        const cs = getComputedStyle(outer);
        const padX =
          parseFloat(cs.paddingLeft || "0") + parseFloat(cs.paddingRight || "0");
        const avail = Math.max(0, outer.clientWidth - padX - 4);
        setAutoScale(Math.min(AUTO_FIT_MAX, avail / A4_WIDTH_PX));
        setInnerHeight(inner.offsetHeight);
      };

      measure();
      const outerObs = new ResizeObserver(measure);
      const innerObs = new ResizeObserver(measure);
      outerObs.observe(outer);
      innerObs.observe(inner);
      return () => {
        outerObs.disconnect();
        innerObs.disconnect();
      };
    }, []);

    const isPrint = mode === "print";
    const effectiveScale = isPrint ? 1 : zoom ?? autoScale;
    const pageBreaks = showPageBreaks || isPrint;

    const breakLines = useMemo(() => {
      if (!pageBreaks || innerHeight === 0) return [] as number[];
      const lines: number[] = [];
      // Skip 0 (top of page 1). Lines mark the END of each page.
      for (let y = A4_HEIGHT_PX; y < innerHeight; y += A4_HEIGHT_PX) {
        lines.push(y);
      }
      return lines;
    }, [innerHeight, pageBreaks]);

    return (
      <div
        ref={outerRef}
        className="flex justify-center bg-neutral-100 dark:bg-neutral-800 rounded-md px-2 py-4"
        style={{
          height: innerHeight ? innerHeight * effectiveScale + 32 : undefined,
          minHeight: compact ? (innerHeight ? undefined : 180) : 420,
          overflowX: "auto",
          overflowY: "hidden",
        }}
      >
        <div
          style={{
            transform: `scale(${effectiveScale})`,
            transformOrigin: "top center",
            width: A4_WIDTH_PX,
            flexShrink: 0,
            // Print mode shows actual page boundaries — clip OFF so any
            // overflow becomes obvious to the user.
            overflow: isPrint ? "visible" : "hidden",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            position: "relative",
          }}
        >
          <div ref={innerRef}>
            <CVTemplateRenderer ref={captureRef} cv={cv} photoUrl={photoUrl} />
          </div>
          {pageBreaks &&
            breakLines.map((y, i) => (
              <div
                key={y}
                aria-hidden
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: y,
                  height: 0,
                  borderTop: "2px dashed rgba(220, 38, 38, 0.6)",
                  pointerEvents: "none",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    right: 8,
                    top: -22,
                    fontSize: 11,
                    color: "rgb(220, 38, 38)",
                    background: "white",
                    padding: "1px 6px",
                    borderRadius: 4,
                    border: "1px solid rgba(220, 38, 38, 0.4)",
                    fontFamily: "ui-sans-serif, system-ui",
                  }}
                >
                  ── Halaman {i + 2} ──
                </span>
              </div>
            ))}
        </div>
      </div>
    );
  },
);
