"use client";

import { forwardRef, memo, useEffect, useMemo, useRef, useState } from "react";
import type { CVData } from "../../types";
import type { PreviewLayout } from "../../hooks/usePreviewControls";
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
   * Layout mode — drives whether A4 page-break overlays render in the
   * preview. PDF export reads the same value so on-screen and printed
   * output agree. Defaults to `paginated`.
   */
  layout?: PreviewLayout;
}

/**
 * Live preview of the chosen template at A4 width (794 px). Always
 * auto-fits the container — we removed the explicit zoom controls
 * after user feedback that the chrome was too busy. `layout` decides
 * whether to overlay dashed page-break guides at every A4_HEIGHT_PX
 * multiple (paginated) or render the content as one continuous canvas
 * with no breaks (long).
 *
 * Capture ref points at the un-scaled inner template so html2canvas
 * still rasterises at proper A4 DPI regardless of preview scale.
 *
 * Wrapped in `memo`: skips re-rendering the scaled A4 board (and the
 * memoized `CVTemplateRenderer` beneath it) when `cv` keeps a stable
 * reference. The live sidebar preview feeds a `useDeferredValue(cv)` so
 * typing stays responsive while this heavy subtree updates deferred.
 */
export const ScaledCVPreview = memo(
  forwardRef<HTMLDivElement, Props>(
  function ScaledCVPreview(
    { cv, photoUrl, compact = false, layout = "paginated" },
    captureRef,
  ) {
    const outerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(AUTO_FIT_MAX);
    const [innerHeight, setInnerHeight] = useState(0);

    useEffect(() => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;

      const measure = () => {
        const cs = getComputedStyle(outer);
        const padX =
          parseFloat(cs.paddingLeft || "0") + parseFloat(cs.paddingRight || "0");
        const avail = Math.max(0, outer.clientWidth - padX - 4);
        setScale(Math.min(AUTO_FIT_MAX, avail / A4_WIDTH_PX));
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

    const showBreaks = layout === "paginated";
    const breakLines = useMemo(() => {
      if (!showBreaks || innerHeight === 0) return [] as number[];
      const lines: number[] = [];
      for (let y = A4_HEIGHT_PX; y < innerHeight; y += A4_HEIGHT_PX) {
        lines.push(y);
      }
      return lines;
    }, [innerHeight, showBreaks]);

    return (
      <div
        ref={outerRef}
        className="flex justify-center bg-neutral-100 dark:bg-neutral-800 rounded-md px-2 py-4"
        style={{
          // Scaled inner element keeps 794 px layout width via flexShrink:0;
          // overflow:hidden lets it sit visually clipped to the available
          // container width without producing a horizontal scrollbar on
          // the CV page (the scale factor already shrinks it to fit).
          width: "100%",
          maxWidth: "100%",
          height: innerHeight ? innerHeight * scale + 32 : undefined,
          minHeight: compact ? (innerHeight ? undefined : 180) : 420,
          overflowX: "hidden",
          overflowY: "hidden",
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            width: A4_WIDTH_PX,
            flexShrink: 0,
            overflow: "hidden",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            position: "relative",
          }}
        >
          <div ref={innerRef}>
            <CVTemplateRenderer ref={captureRef} cv={cv} photoUrl={photoUrl} />
          </div>
          {showBreaks &&
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
                  Halaman {i + 2}
                </span>
              </div>
            ))}
        </div>
      </div>
    );
  },
  ),
);
