"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { indonesianCategoryLabels } from "@/shared/data/indonesianData";
import type { ChecklistItem } from "../../types";
import { ChecklistItemCard } from "./ChecklistItemCard";
import { CategoryFilter } from "./CategoryFilter";
import { ProgressGrid } from "./ProgressGrid";
import type { ChecklistProgress } from "../../hooks/useChecklistData";

interface Props {
  category: "local" | "international";
  filterCategory: string | null;
  setFilterCategory: (s: string | null) => void;
  progress: ChecklistProgress;
  filteredItems: ChecklistItem[];
  subcategories: string[];
  items: ChecklistItem[];
  onToggle: (id: string) => void;
  onSelect: (item: ChecklistItem) => void;
  notice?: ReactNode;
  sidebarExtra?: ReactNode;
}

export function CategorySection({
  category, filterCategory, setFilterCategory,
  progress, filteredItems, subcategories, items,
  onToggle, onSelect, notice, sidebarExtra,
}: Props) {
  return (
    <>
      <ProgressGrid progress={progress} />

      {notice}

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="space-y-4">
          <CategoryFilter
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            subcategories={subcategories}
            items={items}
            category={category}
          />
          {sidebarExtra}
        </div>

        <div className="lg:col-span-3">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {filterCategory ? indonesianCategoryLabels[filterCategory] : "Semua Dokumen"}
                </CardTitle>
                <Badge variant="secondary" className="bg-muted">
                  {filteredItems.length} item
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[70vh] max-h-[720px] pr-2">
                <div className="space-y-3">
                  {filteredItems.map((item) => (
                    <ChecklistItemCard
                      key={item.id}
                      item={item}
                      onToggle={onToggle}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
