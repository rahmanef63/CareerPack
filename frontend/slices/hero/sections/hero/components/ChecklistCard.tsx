import { CheckCircle2, Circle } from "lucide-react";

import { CHECKLIST_CARD_TITLE } from "../constants/hero.constants";
import type { ChecklistRowItem } from "../types/hero.types";

interface ChecklistCardProps {
  className: string;
  items: ChecklistRowItem[];
}

/** Desk collage card (d) — notebook checklist illustrating the mock-interview feature. */
export function ChecklistCard({ className, items }: ChecklistCardProps) {
  return (
    <div className={`rounded-2xl border border-landing-line bg-landing-card p-6 shadow-xl ${className}`}>
      <p className="font-display text-xl text-landing-ink">{CHECKLIST_CARD_TITLE}</p>

      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5 text-sm">
            {item.done ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-landing-blue" aria-hidden />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-landing-muted" aria-hidden />
            )}
            <span className={item.done ? "text-landing-ink" : "text-landing-muted"}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
