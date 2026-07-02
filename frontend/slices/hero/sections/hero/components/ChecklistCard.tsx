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
    <div
      className={`rounded-2xl border border-border bg-card p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:rotate-0 hover:shadow-2xl hover:z-40 ${className}`}
    >
      <p className="font-display text-xl text-foreground">{CHECKLIST_CARD_TITLE}</p>

      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5 text-sm">
            {item.done ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
