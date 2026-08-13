"use client";

import { CheckCircle2, Circle, Calendar, ChevronRight, FileText } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { indonesianCategoryLabels } from "@/shared/data/indonesianData";
import type { ChecklistItem } from "../../types";
import { categoryIcons } from "../../constants/icons";

interface Props {
  item: ChecklistItem;
  onToggle: (id: string) => void;
  onSelect: (item: ChecklistItem) => void;
}

/**
 * One document row in the checklist.
 *
 * a11y — this card used to be `<div role="button" tabIndex={0}>` that
 * *contained* the toggle `<Button>`: a control inside a control, which
 * axe reports as `nested-interactive` (SERIOUS). Keyboard users tabbed
 * into the toggle while the wrapper still claimed to be the focused
 * button, and the wrapper's role lied about what Enter would do.
 *
 * The fix keeps both affordances without nesting: there is exactly one
 * real `<button>` per action, as siblings. The title button carries a
 * stretched `::after` overlay pinned to the card box, so clicking dead
 * space anywhere on the card still opens the detail dialog; the toggle
 * sits on a higher stacking layer (`z-10`) so it owns its own hit area.
 * Dropping `role`/`tabIndex` instead would have traded a reported
 * violation for an unoperable div — the overlay is what preserves the
 * click-anywhere behaviour.
 */
export function ChecklistItemCard({ item, onToggle, onSelect }: Props) {
  const Icon = categoryIcons[item.subcategory] || FileText;

  return (
    <div
      className={cn(
        "group relative flex items-start gap-4 rounded-xl border-2 p-4 transition-all duration-200",
        item.completed
          ? "border-success/30 bg-success/10"
          : item.required
            ? "border-border bg-card hover:border-brand"
            : "border-border bg-muted/50 hover:border-border",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={
          item.completed
            ? `Tandai "${item.title}" belum selesai`
            : `Tandai "${item.title}" selesai`
        }
        onClick={() => onToggle(item.id)}
        className={cn(
          // z-10 keeps the toggle above the title button's stretched
          // overlay, so its own click never falls through to "open detail".
          "relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200",
          item.completed
            ? "bg-success text-brand-foreground hover:bg-success/90"
            : "bg-muted text-muted-foreground hover:bg-brand-muted hover:text-brand",
        )}
      >
        {item.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
      </Button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className={cn(
              "font-medium",
              item.completed ? "text-success-text line-through" : "text-foreground",
            )}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={cn(
                  "text-left after:absolute after:inset-0 after:rounded-xl after:content-['']",
                  "focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring",
                  "focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-background",
                )}
              >
                {item.title}
                <span className="sr-only"> — buka detail dokumen</span>
              </button>
            </h4>
            <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {item.required && (
              <Badge variant="secondary" className="bg-destructive/10 text-destructive-text text-xs">
                Wajib
              </Badge>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="w-3.5 h-3.5" />
            {indonesianCategoryLabels[item.subcategory]}
          </div>
          {item.dueDate && (
            <div className="flex items-center gap-1.5 text-xs text-warning">
              <Calendar className="w-3.5 h-3.5" />
              Batas: {item.dueDate}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
