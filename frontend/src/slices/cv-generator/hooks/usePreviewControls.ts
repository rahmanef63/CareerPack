"use client";

import { useCallback, useState } from "react";

export type PreviewMode = "screen" | "print";

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

/**
 * Lifts preview chrome state out of the renderer so a sidebar mini and
 * the full-screen dialog can share the same controls. `mode === "print"`
 * forces 1:1 scale + dashed A4 break guides; `screen` keeps auto-fit.
 *
 * `zoom === null` = auto-fit (ScaledCVPreview measures the container).
 * Any number > 0 = explicit user override.
 */
export function usePreviewControls(initial?: {
  mode?: PreviewMode;
  zoom?: number | null;
}) {
  const [mode, setMode] = useState<PreviewMode>(initial?.mode ?? "screen");
  const [zoom, setZoom] = useState<number | null>(initial?.zoom ?? null);
  const [showPageBreaks, setShowPageBreaks] = useState(false);

  const effectiveZoom = mode === "print" ? 1 : zoom;
  const zoomPct =
    effectiveZoom !== null ? Math.round(effectiveZoom * 100) : null;

  const zoomIn = useCallback(() => {
    setZoom((z) =>
      Math.min(ZOOM_MAX, (z ?? 1) + ZOOM_STEP),
    );
  }, []);
  const zoomOut = useCallback(() => {
    setZoom((z) =>
      Math.max(ZOOM_MIN, (z ?? 1) - ZOOM_STEP),
    );
  }, []);
  const fitWidth = useCallback(() => setZoom(null), []);
  const resetZoom = useCallback(() => setZoom(1), []);

  return {
    mode,
    setMode,
    zoom: effectiveZoom,
    zoomPct,
    showPageBreaks,
    setShowPageBreaks,
    zoomIn,
    zoomOut,
    fitWidth,
    resetZoom,
    isOverriding: zoom !== null,
  };
}

export const ZOOM_LIMITS = { min: ZOOM_MIN, max: ZOOM_MAX, step: ZOOM_STEP };
