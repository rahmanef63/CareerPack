"use client";

import { FileCheck, FileText, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
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
        <div className="space-y-2">
          <button
            onClick={() => setFilterCategory(null)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200",
              filterCategory === null
                ? "bg-brand-muted text-brand"
                : "hover:bg-muted/50 text-foreground",
            )}
          >
            <FileCheck className="w-5 h-5" />
            Semua Dokumen
          </button>
          {subcategories.map((subcat) => {
            const Icon = categoryIcons[subcat] || FileText;
            const count = items.filter(
              (i) => i.category === category && i.subcategory === subcat,
            ).length;
            return (
              <button
                key={subcat}
                onClick={() => setFilterCategory(subcat)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200",
                  filterCategory === subcat
                    ? "bg-brand-muted text-brand"
                    : "hover:bg-muted/50 text-foreground",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  {indonesianCategoryLabels[subcat]}
                </div>
                <Badge variant="secondary" className="bg-muted">{count}</Badge>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
