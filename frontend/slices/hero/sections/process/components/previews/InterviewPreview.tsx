import { Badge } from "@/shared/components/ui/badge";
import { StepPreviewCard } from "../StepPreviewCard";
import { INTERVIEW_EXAMPLE } from "../../constants/process.constants";

/** Mock UI preview for step 3 — "Latihan dengan AI". */
export function InterviewPreview() {
  return (
    <StepPreviewCard>
      <Badge className="border-transparent bg-landing-violet font-normal text-white">
        AI
      </Badge>

      <blockquote className="mt-4 rounded-xl border border-landing-line bg-landing-paper-2 p-3 text-sm italic text-landing-ink">
        &ldquo;{INTERVIEW_EXAMPLE.question}&rdquo;
      </blockquote>

      <p className="mt-3 text-sm text-landing-muted">
        <span className="font-medium text-landing-ink">{INTERVIEW_EXAMPLE.feedbackLabel}</span>{" "}
        {INTERVIEW_EXAMPLE.feedback}
      </p>
    </StepPreviewCard>
  );
}
