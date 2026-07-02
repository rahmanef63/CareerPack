import { Badge } from "@/shared/components/ui/badge";
import { StepPreviewCard } from "../StepPreviewCard";
import { INTERVIEW_EXAMPLE } from "../../constants/process.constants";

/** Mock UI preview for step 3 — "Latihan dengan AI". */
export function InterviewPreview() {
  return (
    <StepPreviewCard>
      <Badge className="border-transparent bg-info font-normal text-info-foreground">
        AI
      </Badge>

      <blockquote className="mt-4 rounded-xl border border-border bg-muted p-3 text-sm italic text-foreground">
        &ldquo;{INTERVIEW_EXAMPLE.question}&rdquo;
      </blockquote>

      <p className="mt-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{INTERVIEW_EXAMPLE.feedbackLabel}</span>{" "}
        {INTERVIEW_EXAMPLE.feedback}
      </p>
    </StepPreviewCard>
  );
}
