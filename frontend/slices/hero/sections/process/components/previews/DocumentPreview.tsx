import { Badge } from "@/shared/components/ui/badge";
import { StepPreviewCard } from "../StepPreviewCard";
import {
  DOCUMENT_EXAMPLE_ATS_SCORE,
  DOCUMENT_SKELETON_LINES,
  DOCUMENT_SUPPORT_LINE,
} from "../../constants/process.constants";

/** Mock UI preview for step 2 — "Bangun Dokumen". */
export function DocumentPreview() {
  return (
    <StepPreviewCard>
      <Badge className="border-transparent bg-landing-terra-soft font-normal text-landing-terra">
        {DOCUMENT_EXAMPLE_ATS_SCORE}
      </Badge>

      <div className="mt-4 flex flex-col gap-2">
        {DOCUMENT_SKELETON_LINES.map((line) => (
          <div
            key={line.widthClassName}
            className={`h-2.5 rounded-full bg-landing-line ${line.widthClassName}`}
          />
        ))}
      </div>

      <p className="mt-4 text-sm text-landing-muted">{DOCUMENT_SUPPORT_LINE}</p>
    </StepPreviewCard>
  );
}
