"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { EmptyState } from "@/shared/components/feedback/EmptyState";
import { NoDocuments } from "@/shared/components/illustrations/empty";
import { SpotDocuments } from "@/shared/components/illustrations/features";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { indonesianCategoryLabels } from "@/shared/data/indonesianData";
import type { ChecklistItem } from "../../types";
import { ChecklistItemCard } from "./ChecklistItemCard";
import { CategoryFilter } from "./CategoryFilter";
import { ProgressSummary } from "./ProgressSummary";
import type { ChecklistProgress } from "../../hooks/useChecklistData";

interface Props {
  /** Server checklist query still in flight — distinct from a genuinely
   *  empty `filteredItems`, so the list shows a skeleton instead of
   *  "Belum ada dokumen" on every fresh page load. */
  isLoading?: boolean;
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
  /** Country/template picker — rail slot, above the category filter. */
  picker?: ReactNode;
  sidebarExtra?: ReactNode;
}

/**
 * Layout — progress summary, picker and category filter used to stack
 * full-width *above* the document list, so a 1600px viewport rendered a
 * single ~1060px column with the list pushed below the fold. They now
 * share a rail beside the list from `lg` up (12-col grid, 5/7 then 4/8
 * at `xl`).
 *
 * Below `lg` this used to read top-to-bottom as: progress, picker,
 * filter, reminder card, illustration, THEN the document list — on the
 * overseas tab the country picker alone is tall enough that the filter
 * (and the list it controls) sat a full screen or more down, so picking
 * a category meant scrolling down to find it, then further down again to
 * see the filtered result. `order-*` below splits the rail into a
 * "quick controls" group (progress + filter — order-1) and a
 * "secondary" group (country picker, reminder card, illustration —
 * order-3), with the document list itself in between (order-2). Grid
 * auto-placement honours `order` at every breakpoint, so `lg` and up
 * still lands quick-controls top-left / secondary bottom-left beside a
 * list spanning both rail rows — only the mobile stacking order changes.
 */
export function CategorySection({
  isLoading, category, filterCategory, setFilterCategory,
  progress, filteredItems, subcategories, items,
  onToggle, onSelect, notice, picker, sidebarExtra,
}: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="order-1 min-w-0 space-y-4 lg:col-span-5 xl:col-span-4">
        <ProgressSummary progress={progress} />
        <CategoryFilter
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          subcategories={subcategories}
          items={items}
          category={category}
        />
      </div>

      <div className="order-2 min-w-0 space-y-6 lg:col-span-7 lg:row-span-2 xl:col-span-8">
        {notice}

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>
                {filterCategory ? indonesianCategoryLabels[filterCategory] : "Semua Dokumen"}
              </CardTitle>
              <Badge variant="secondary" className="bg-muted">
                {filteredItems.length} item
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3" aria-hidden="true">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <EmptyState
                illustration={NoDocuments}
                title="Belum ada dokumen di kategori ini"
                description="Pilih kategori lain di panel filter untuk melihat daftar dokumen."
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

      <div className="order-3 min-w-0 space-y-4 lg:col-span-5 xl:col-span-4">
        {picker}
        {sidebarExtra}
        <div className="hidden overflow-hidden rounded-2xl border border-border bg-card p-3 lg:block">
          <SpotDocuments />
        </div>
      </div>
    </div>
  );
}
