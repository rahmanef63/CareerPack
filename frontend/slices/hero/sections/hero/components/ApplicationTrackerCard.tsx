import { Badge } from "@/shared/components/ui/badge";

import { TRACKER_CARD_TITLE } from "../constants/hero.constants";
import type { ApplicationRowRenderable } from "../types/hero.types";

interface ApplicationTrackerCardProps {
  className: string;
  rows: ApplicationRowRenderable[];
}

/**
 * Desk collage card (f) — illustrates the application-tracker FEATURE with
 * example placeholder roles. UI-mock decoration, not a claim about a real user.
 */
export function ApplicationTrackerCard({ className, rows }: ApplicationTrackerCardProps) {
  return (
    <div
      className={`rounded-2xl border border-landing-line bg-landing-card p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:rotate-0 hover:shadow-2xl hover:z-40 ${className}`}
    >
      <p className="font-display text-xl text-landing-ink">{TRACKER_CARD_TITLE}</p>

      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-landing-ink">{row.role}</p>
              <p className="truncate text-xs text-landing-muted">{row.company}</p>
            </div>
            <Badge variant="outline" className={row.badgeClassName}>
              {row.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
