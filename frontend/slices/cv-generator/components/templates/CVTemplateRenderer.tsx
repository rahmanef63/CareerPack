import { forwardRef, memo } from "react";
import type { CVData } from "../../types";
import { CVTemplateClassic } from "./CVTemplateClassic";
import { CVTemplateModern } from "./CVTemplateModern";
import { CVTemplateMinimal } from "./CVTemplateMinimal";

interface Props {
  cv: CVData;
  photoUrl: string;
}

/**
 * Single capture surface for the PDF exporter — wraps the chosen
 * template in a ref-able div so html2canvas-pro can rasterize the A4
 * board cleanly. Templates render their own A4 width via inline `mm`
 * units so the captured DPI matches print output.
 *
 * Wrapped in `memo`: the A4 template subtree is expensive (full-page
 * layout, images, repeated maps). Callers pass a stable `cv` reference
 * during urgent renders (see `useDeferredValue` in the live preview),
 * so memo lets the heavy subtree skip re-rendering on every keystroke.
 */
export const CVTemplateRenderer = memo(
  forwardRef<HTMLDivElement, Props>(
    function CVTemplateRenderer({ cv, photoUrl }, ref) {
      const templateId = cv.displayPrefs.templateId;
      const accent = cv.displayPrefs.accentColor;
      return (
        <div ref={ref} style={{ display: "inline-block" }}>
          {templateId === "modern" && <CVTemplateModern cv={cv} photoUrl={photoUrl} accent={accent} />}
          {templateId === "minimal" && <CVTemplateMinimal cv={cv} accent={accent} />}
          {templateId !== "modern" && templateId !== "minimal" && (
            <CVTemplateClassic cv={cv} photoUrl={photoUrl} accent={accent} />
          )}
        </div>
      );
    },
  ),
);
