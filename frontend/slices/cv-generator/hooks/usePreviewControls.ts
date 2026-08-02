"use client";

import { useState } from "react";

/**
 * Layout mode shared by preview chrome + PDF export.
 *
 * - `long`: render everything on one continuous canvas. PDF export
 *   produces a single page sized to the actual content height — no
 *   forced A4 break. Best for web sharing, scrollable reading.
 * - `paginated`: classic A4 multi-page layout. Preview overlays a
 *   dashed break line at each A4 boundary so the user can see where
 *   the PDF will split before exporting.
 *
 * Default = `paginated` because that's still what most recruiters
 * expect, and the user can flip to `long` in one click.
 */
export type PreviewLayout = "long" | "paginated";

export function usePreviewControls(initial?: { layout?: PreviewLayout }) {
  const [layout, setLayout] = useState<PreviewLayout>(
    initial?.layout ?? "paginated",
  );
  return { layout, setLayout };
}
