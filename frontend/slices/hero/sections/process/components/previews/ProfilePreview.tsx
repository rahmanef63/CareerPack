import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { StepPreviewCard } from "../StepPreviewCard";
import {
  PROFILE_CHECKLIST,
  PROFILE_COMPLETION_PERCENT,
} from "../../constants/process.constants";

/** Mock UI preview for step 1 — "Isi Profil". */
export function ProfilePreview() {
  return (
    <StepPreviewCard>
      <div className="flex items-center justify-between text-sm font-medium text-landing-ink">
        <span>Kelengkapan Profil</span>
        <span>{PROFILE_COMPLETION_PERCENT}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-landing-line">
        <div
          className="h-full rounded-full bg-landing-blue"
          style={{ width: `${PROFILE_COMPLETION_PERCENT}%` }}
        />
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {PROFILE_CHECKLIST.map((item) =>
          item.done ? (
            <li key={item.label} className="flex items-center gap-2 text-sm text-landing-ink">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-landing-green" />
              {item.label}
            </li>
          ) : (
            <li key={item.label}>
              <Badge
                variant="outline"
                className="border-landing-line bg-landing-paper-2 font-normal text-landing-muted"
              >
                {item.label}
              </Badge>
            </li>
          )
        )}
      </ul>
    </StepPreviewCard>
  );
}
