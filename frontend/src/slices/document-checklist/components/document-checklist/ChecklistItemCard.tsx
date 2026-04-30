"use client";

import { CheckCircle2, Circle, Calendar, ChevronRight, FileText } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { indonesianCategoryLabels } from "@/shared/data/indonesianData";
import type { ChecklistItem } from "../../types";
import { categoryIcons } from "../../constants/icons";

interface Props {
  item: ChecklistItem;
  onToggle: (id: string) => void;
  onSelect: (item: ChecklistItem) => void;
}

export function ChecklistItemCard({ item, onToggle, onSelect }: Props) {
  const Icon = categoryIcons[item.subcategory] || FileText;

  return (
    <div
      className={cn(
        "group flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
        item.completed
          ? "border-success/30 bg-success/10"
          : item.required
            ? "border-border bg-card hover:border-brand"
            : "border-border bg-muted/50/50 hover:border-border",
      )}
      onClick={() => onSelect(item)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(item.id);
        }}
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
          item.completed
            ? "bg-success text-brand-foreground"
            : "bg-muted text-muted-foreground hover:bg-brand-muted hover:text-brand",
        )}
      >
        {item.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className={cn(
              "font-medium",
              item.completed ? "text-success line-through" : "text-foreground",
            )}>
              {item.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {item.required && (
              <Badge variant="secondary" className="bg-destructive/10 text-destructive text-xs">
                Wajib
              </Badge>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3">
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
