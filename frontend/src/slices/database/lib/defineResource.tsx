"use client";

import { useMutation, useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { toast } from "sonner";
import { useState, type ReactNode } from "react";
import type {
  ColumnDef,
  FilterDef,
} from "@/shared/components/data-table";
import { ResourceTable } from "../components/ResourceTable";
import {
  RelatedRowsDrawer,
  type RelationSectionDef,
} from "../components/RelatedRowsDrawer";

/**
 * Per-tab Database resource definition. Each tab is one call:
 *
 *   export const CVTab = defineResource<Doc<"cvs">>({
 *     resourceLabel: "CV",
 *     query: api.cv.queries.getUserCVs,
 *     bulkDelete: api.cv.mutations.bulkDeleteCVs,
 *     columns, filters, rowKey, searchAccessor, …
 *     importConfig: { wrapperKey: "cv", mode: "object" },
 *   });
 *
 * The factory wires `useQuery` + `useMutation`, builds `onBulkDelete`
 * with the standardized `{ ids }` arg, plus an `onImport` that wraps
 * the parsed JSON into a `{ <wrapperKey>: payload }` envelope and
 * dispatches to `quickFill` (so import flows through the existing
 * batch + undo log).
 *
 * This kills ~80 lines of glue per tab and makes adding a 7th
 * resource a 30-line task instead of a 130-line copy-paste.
 */

type FunctionRef = FunctionReference<"query"> | FunctionReference<"mutation">;

type ImportMode = "array" | "object";

export interface DefineResourceConfig<T extends { _id: string }> {
  /** Convex query returning the rows (`useQuery` ref). */
  query: FunctionReference<"query">;
  /** Convex mutation that accepts `{ ids: Id<table>[] }`. */
  bulkDelete: FunctionReference<"mutation">;
  /** Convex `quickFill` mutation — usually `api.onboarding.mutations.quickFill`. */
  quickFill: FunctionReference<"mutation">;
  /** Singular noun for confirm dialog + toast. */
  resourceLabel: string;
  /** Filename prefix for JSON export. */
  exportPrefix: string;
  /** Strip system fields before export. Default: drop `_id`, `_creationTime`, `userId`. */
  exportShape?: (row: T) => unknown;

  columns: ReadonlyArray<ColumnDef<T>>;
  filters?: ReadonlyArray<FilterDef<T>>;
  rowKey: (r: T) => string;
  searchAccessor: (r: T) => string;
  searchPlaceholder?: string;
  emptyMessage?: ReactNode;

  importConfig?: {
    /** Which top-level key in the quickFill payload this tab maps to. */
    wrapperKey: "cv" | "portfolio" | "goals" | "applications" | "contacts";
    /** Whether the tab's payload is one object (CV) or an array of items. */
    mode: ImportMode;
    /** Tag passed to quickFill for batch logging. */
    scope: string;
    /** Tab-specific success-toast formatter given the quickFill result. */
    formatSuccess: (
      res: QuickFillResultShape & { batchId: string | null },
    ) => string | null;
  };

  /**
   * Optional row-click drawer showing two-way relations
   * (applications/scans for a CV, events for an application, …).
   * When omitted, rows are not clickable beyond selection.
   */
  relatedDrawer?: {
    title: (row: T) => string;
    subtitle?: (row: T) => string;
    sections: ReadonlyArray<RelationSectionDef<T, unknown>>;
  };
}

/** Mirrors `QuickFillResult & { batchId }` from convex/onboarding/types — kept
 *  loose so we don't hit the cross-package types dance. */
export interface QuickFillResultShape {
  profile: boolean;
  cv: boolean;
  portfolio: { added: number; skipped: number };
  goals: { added: number; skipped: number };
  applications: { added: number; skipped: number };
  contacts: { added: number; skipped: number };
  warnings: string[];
}

const DEFAULT_EXPORT_SHAPE = <T extends Record<string, unknown>>(row: T) => {
  const {
    _id: _i,
    _creationTime: _t,
    userId: _u,
    ...rest
  } = row;
  return rest;
};

export function defineResource<T extends { _id: string }>(
  config: DefineResourceConfig<T>,
) {
  const ResourceTab = function ResourceTab() {
    const data = useQuery(config.query) as ReadonlyArray<T> | undefined;
    const bulkDelete = useMutation(config.bulkDelete);
    const quickFill = useMutation(config.quickFill);
    const [drawerRow, setDrawerRow] = useState<T | null>(null);

    const handleImport = config.importConfig
      ? async (parsed: unknown) => {
          const { wrapperKey, mode, scope, formatSuccess } = config.importConfig!;
          const wrappedPayload = unwrapImport(parsed, wrapperKey, mode);
          if (wrappedPayload === null) {
            toast.error(
              mode === "array"
                ? `Format tidak dikenali — kirim array atau objek \`{ ${wrapperKey}: [...] }\`.`
                : `Format tidak dikenali — kirim objek atau \`{ ${wrapperKey}: {...} }\`.`,
            );
            return;
          }
          const res = (await quickFill({
            payload: { [wrapperKey]: wrappedPayload },
            scope,
          })) as QuickFillResultShape & { batchId: string | null };
          const successMsg = formatSuccess(res);
          if (successMsg) {
            toast.success(successMsg);
          } else {
            toast.error(
              res.warnings[0] ??
                `${config.resourceLabel} tidak dapat diimpor — periksa format JSON.`,
            );
          }
        }
      : undefined;

    return (
      <>
        <ResourceTable<T>
          data={data}
          isLoading={data === undefined}
          columns={config.columns}
          filters={config.filters}
          rowKey={config.rowKey}
          searchAccessor={config.searchAccessor}
          searchPlaceholder={config.searchPlaceholder}
          resourceLabel={config.resourceLabel}
          exportPrefix={config.exportPrefix}
          exportShape={
            config.exportShape ??
            (DEFAULT_EXPORT_SHAPE as (r: T) => unknown)
          }
          onBulkDelete={async (ids) =>
            // Cast to the row's own Id<TableName>[] (derived from T["_id"])
            // — honest for every resource. The runtime contract is
            // enforced by the Convex validator on the mutation side.
            (await bulkDelete({
              ids: ids as unknown as ReadonlyArray<T["_id"]>,
            })) as { deleted: number }
          }
          onImport={handleImport}
          emptyMessage={config.emptyMessage}
          onRowClick={config.relatedDrawer ? setDrawerRow : undefined}
        />
        {config.relatedDrawer && (
          <RelatedRowsDrawer<T>
            row={drawerRow}
            onClose={() => setDrawerRow(null)}
            title={
              drawerRow ? config.relatedDrawer.title(drawerRow) : ""
            }
            subtitle={
              drawerRow && config.relatedDrawer.subtitle
                ? config.relatedDrawer.subtitle(drawerRow)
                : undefined
            }
            sections={config.relatedDrawer.sections}
          />
        )}
      </>
    );
  };
  ResourceTab.displayName = `ResourceTab(${config.resourceLabel})`;
  return ResourceTab;
}

function unwrapImport(
  parsed: unknown,
  key: string,
  mode: ImportMode,
): unknown {
  if (mode === "array") {
    if (Array.isArray(parsed)) return parsed;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      Array.isArray((parsed as Record<string, unknown>)[key])
    ) {
      return (parsed as Record<string, unknown>)[key];
    }
    return null;
  }
  // object mode — accept either a bare object or `{ key: object }`.
  if (typeof parsed !== "object" || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;
  if (typeof obj[key] === "object" && obj[key] !== null) return obj[key];
  return parsed;
}

// Keep `FunctionRef` union exported for any future opt-in helpers
// without enabling lint warnings about unused types.
export type { FunctionRef };
