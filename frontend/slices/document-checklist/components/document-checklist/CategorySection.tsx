"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { EmptyState } from "@/shared/components/feedback/EmptyState";
import { NoDocuments } from "@/shared/components/illustrations/empty";
import { SpotDocuments } from "@/shared/components/illustrations/features";
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
          {/* ponytail: spot art only where the rail has room — it stacks
              full-width on mobile, so hide it below lg. */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card p-3 lg:block">
            <SpotDocuments />
          </div>
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
              {filteredItems.length === 0 ? (
                <EmptyState
                  illustration={NoDocuments}
                  title="Belum ada dokumen di kategori ini"
                  description="Pilih kategori lain di panel kiri untuk melihat daftar dokumen."
                />
              ) : (
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
