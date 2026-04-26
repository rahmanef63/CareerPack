"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import type { CVData } from "../../types";
import { CVTemplateRenderer } from "./CVTemplateRenderer";

const A4_WIDTH_PX = 794; // 210mm @ 96dpi, matches template inline width
/** Slight margin under 1.0 so the rendered A4 always fits inside the
 *  container's content box even after sub-pixel rounding. Upscaling is
 *  intentionally NOT supported — it produces blurry text + content
 *  taller than the dialog viewport, forcing manual browser zoom-out.
 *  Mobile still scales DOWN aggressively to fit narrow viewports. */
const MAX_SCALE = 0.96;

interface Props {
  cv: CVData;
  photoUrl: string;
}

/**
 * Renders the chosen template at its native A4 width (794 px) and
 * scales it down to fit the surrounding container. Never upscales
 * past A4 — wide desktop dialogs show the CV with whitespace gutter,
 * the same behaviour as every PDF viewer. ResizeObserver keeps the
 * scale honest if the drawer animates or the user rotates the device.
 *
 * Capture ref points at the UNscaled inner template so html2canvas
 * grabs the page at proper A4 DPI regardless of preview scale.
 */
export const ScaledCVPreview = forwardRef<HTMLDivElement, Props>(
  function ScaledCVPreview({ cv, photoUrl }, captureRef) {
    const outerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(MAX_SCALE);
    const [innerHeight, setInnerHeight] = useState(0);

    useEffect(() => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;

      const measure = () => {
        const cs = getComputedStyle(outer);
        const padX =
          parseFloat(cs.paddingLeft || "0") + parseFloat(cs.paddingRight || "0");
        // 4 px safety belt soaks sub-pixel rounding in the browser's
        // layout engine — without it, scale * A4_WIDTH can land at
        // 794.001 px in a 794 px container and trigger a 1 px overflow
        // that the user reads as "cropped".
        const avail = Math.max(0, outer.clientWidth - padX - 4);
        const next = Math.min(MAX_SCALE, avail / A4_WIDTH_PX);
        setScale(next);
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
    }, [cv]);

    return (
      <div
        ref={outerRef}
        className="flex justify-center bg-neutral-100 dark:bg-neutral-800 rounded-md px-2 py-4"
        style={{
          // Reserve exact scaled height + vertical padding (py-4 = 16*2)
          // so there's no trailing gap below the preview.
          height: innerHeight ? innerHeight * scale + 32 : undefined,
          minHeight: 420,
          // overflow-x auto is the safety net: if our scale calc is off
          // by even a sub-pixel, the user can still pan horizontally
          // instead of seeing chopped text. overflow-y hidden because
          // the dialog ITSELF scrolls vertically.
          overflowX: "auto",
          overflowY: "hidden",
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            width: A4_WIDTH_PX,
            // Mark this branch as the printable subtree so a future
            // print-stylesheet can target it without DOM hunting.
            flexShrink: 0,
          }}
        >
          <div ref={innerRef}>
            <CVTemplateRenderer ref={captureRef} cv={cv} photoUrl={photoUrl} />
          </div>
        </div>
      </div>
    );
  },
);
