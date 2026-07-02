import { Badge } from "@/shared/components/ui/badge";
import { StepPreviewCard } from "../StepPreviewCard";
import {
  APPLICATION_EXAMPLE,
  STATUS_TRACK_STAGES,
} from "../../constants/process.constants";

/** Mock UI preview for step 4 — "Lamar & Lacak". */
export function TrackingPreview() {
  return (
    <StepPreviewCard>
      <p className="text-sm font-medium text-foreground">Lamaran Saya</p>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2">
        <div>
          <p className="text-sm text-foreground">{APPLICATION_EXAMPLE.role}</p>
          <p className="text-xs text-muted-foreground">{APPLICATION_EXAMPLE.company}</p>
        </div>
        <Badge className="border-transparent bg-success font-normal text-success-foreground">
          {APPLICATION_EXAMPLE.status}
        </Badge>
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        {STATUS_TRACK_STAGES.map((stage, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              stage.filled ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>
    </StepPreviewCard>
  );
}
