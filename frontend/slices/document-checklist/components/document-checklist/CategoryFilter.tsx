"use client";

import { FileCheck, FileText, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { indonesianCategoryLabels } from "@/shared/data/indonesianData";
import type { ChecklistItem } from "../../types";
import { categoryIcons } from "../../constants/icons";

interface Props {
  filterCategory: string | null;
  setFilterCategory: (s: string | null) => void;
  subcategories: string[];
  items: ChecklistItem[];
  category: "local" | "international";
}

export function CategoryFilter({
  filterCategory, setFilterCategory, subcategories, items, category,
}: Props) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filter Kategori
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mobile: horizontal scrolling chip row (iOS category-chip
            pattern — swipe instead of scan a tall stacked list). From
            `sm` up this card sits in a narrow rail column, where a
            stacked list reads better than a horizontal scroller. */}
        <div
          className={cn(
            "flex gap-2 overflow-x-auto pb-1",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "-mx-4 px-4 sm:mx-0 sm:flex-col sm:overflow-visible sm:px-0 sm:pb-0",
          )}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => setFilterCategory(null)}
            aria-pressed={filterCategory === null}
            className={cn(
              "h-auto shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm transition-all duration-200",
              "sm:w-full sm:justify-start sm:gap-3 sm:rounded-lg sm:p-3 sm:text-base",
              filterCategory === null
                ? "bg-brand-muted text-brand hover:bg-brand-muted"
                : "bg-muted/60 text-foreground hover:bg-muted sm:bg-transparent sm:hover:bg-muted/50",
            )}
          >
            <FileCheck className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            Semua Dokumen
          </Button>
          {subcategories.map((subcat) => {
            const Icon = categoryIcons[subcat] || FileText;
            const count = items.filter(
              (i) => i.category === category && i.subcategory === subcat,
            ).length;
            return (
              <Button
                key={subcat}
                type="button"
                variant="ghost"
                onClick={() => setFilterCategory(subcat)}
                aria-pressed={filterCategory === subcat}
                className={cn(
                  "h-auto shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm text-left transition-all duration-200",
                  "sm:w-full sm:justify-between sm:gap-3 sm:rounded-lg sm:p-3 sm:text-base",
                  filterCategory === subcat
                    ? "bg-brand-muted text-brand hover:bg-brand-muted"
                    : "bg-muted/60 text-foreground hover:bg-muted sm:bg-transparent sm:hover:bg-muted/50",
                )}
              >
                <span className="flex items-center gap-2 sm:gap-3">
                  <Icon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                  {indonesianCategoryLabels[subcat]}
                </span>
                <Badge variant="secondary" className="bg-card/70 sm:bg-muted">{count}</Badge>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
