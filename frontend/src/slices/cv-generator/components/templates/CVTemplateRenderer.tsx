import { forwardRef } from "react";
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
 */
export const CVTemplateRenderer = forwardRef<HTMLDivElement, Props>(
  function CVTemplateRenderer({ cv, photoUrl }, ref) {
    const templateId = cv.displayPrefs.templateId;
    return (
      <div ref={ref} style={{ display: "inline-block" }}>
        {templateId === "modern" && <CVTemplateModern cv={cv} photoUrl={photoUrl} />}
        {templateId === "minimal" && <CVTemplateMinimal cv={cv} />}
        {templateId !== "modern" && templateId !== "minimal" && (
          <CVTemplateClassic cv={cv} photoUrl={photoUrl} />
        )}
      </div>
    );
  },
);
