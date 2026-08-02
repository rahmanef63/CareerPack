"use client";

import { useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { type ReactNode } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import { Skeleton } from "@/shared/components/ui/skeleton";

/**
 * One panel inside the drawer. The factory keeps each section's
 * `useQuery` call at the top level by mounting one `<RelationSection>`
 * per definition — so React's rules-of-hooks stay happy even when the
 * parent rerenders with a different selected row.
 */
export interface RelationSectionDef<TRow, TItem> {
  title: string;
  /** Convex query reference. */
  query: FunctionReference<"query">;
  /** Build the args object from the selected row. */
  getArgs: (row: TRow) => Record<string, unknown>;
  /** Per-item renderer. */
  renderItem: (item: TItem) => ReactNode;
  emptyMessage?: string;
}

interface Props<TRow extends { _id: string }> {
  row: TRow | null;
  onClose: () => void;
  /** Drawer title — usually built from the row's main label. */
  title: string;
  subtitle?: string;
  sections: ReadonlyArray<RelationSectionDef<TRow, unknown>>;
}

export function RelatedRowsDrawer<TRow extends { _id: string }>({
  row,
  onClose,
  title,
  subtitle,
  sections,
}: Props<TRow>) {
  return (
    <ResponsiveDialog
      open={row !== null}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <ResponsiveDialogContent size="2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
          {subtitle && (
            <ResponsiveDialogDescription>{subtitle}</ResponsiveDialogDescription>
          )}
        </ResponsiveDialogHeader>
        <div className="space-y-5 px-1 pb-2">
          {row !== null &&
            sections.map((section, i) => (
              <RelationSection
                key={`${row._id}-${i}`}
                row={row}
                section={section}
              />
            ))}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

interface SectionProps<TRow> {
  row: TRow;
  section: RelationSectionDef<TRow, unknown>;
}

function RelationSection<TRow>({ row, section }: SectionProps<TRow>) {
  const data = useQuery(section.query, section.getArgs(row));
  const items = data as ReadonlyArray<unknown> | undefined;

  return (
    <section className="space-y-2">
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-tight">{section.title}</h3>
        {items !== undefined && (
          <span className="text-xs text-muted-foreground">
            {items.length} item
          </span>
        )}
      </header>
      {items === undefined ? (
        <div className="space-y-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-3/4" />
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          {section.emptyMessage ?? "Belum ada relasi."}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li
              key={i}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              {section.renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
