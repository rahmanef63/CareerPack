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
  sidebarExtra?: ReactNode;
}

/**
 * Layout — progress summary and category filter used to stack full-width
 * *above* the document list, so a 1600px viewport rendered a single
 * ~1060px column with the list pushed below the fold. They now share a
 * rail beside the list from `lg` up (12-col grid, 5/7 then 4/8 at `xl`).
 *
 * The country/template picker used to live in this rail too (between
 * progress and the filter, then later moved below the list) — it now
 * renders as its own full-width block above this whole section (see
 * `DocumentChecklist`), directly under the Kerja Lokal/Kerja Luar Negeri
 * tabs, since picking a destination country is the first thing a user
 * on the overseas tab needs to do. `order-*` below keeps the remaining
 * rail split into a "quick controls" group (progress + filter — order-1)
 * and a "secondary" group (reminder card, illustration — order-3), with
 * the document list itself in between (order-2). Grid auto-placement
 * honours `order` at every breakpoint, so `lg` and up still lands
 * quick-controls top-left / secondary bottom-left beside a list spanning
 * both rail rows — only the mobile stacking order changes.
 */
export function CategorySection({
  isLoading, category, filterCategory, setFilterCategory,
  progress, filteredItems, subcategories, items,
  onToggle, onSelect, notice, sidebarExtra,
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
                {/* Mobile: one rounded "grouped list" card, rows separated by
                    a hairline divider — iOS grouped-table-view style, and
                    denser than a stack of individually-bordered cards. From
                    `sm` up it reverts to the app's usual gapped-card list
                    (ChecklistItemCard supplies its own border there). */}
                <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border sm:divide-y-0 sm:space-y-3 sm:overflow-visible sm:rounded-none sm:border-0">
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
        {sidebarExtra}
        <div className="hidden overflow-hidden rounded-2xl border border-border bg-card p-3 lg:block">
          <SpotDocuments />
        </div>
      </div>
    </div>
  );
}
