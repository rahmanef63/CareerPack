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
      <div className="flex items-center justify-between text-sm font-medium text-foreground">
        <span>Kelengkapan Profil</span>
        <span>{PROFILE_COMPLETION_PERCENT}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${PROFILE_COMPLETION_PERCENT}%` }}
        />
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {PROFILE_CHECKLIST.map((item) =>
          item.done ? (
            <li key={item.label} className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              {item.label}
            </li>
          ) : (
            <li key={item.label}>
              <Badge
                variant="outline"
                className="border-border bg-muted font-normal text-muted-foreground"
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
