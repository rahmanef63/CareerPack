"use client";

import { useRef, useState, type ReactNode } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@/shared/components/ui/responsive-alert-dialog";
import { DataTable } from "@/shared/components/data-table";
import type {
  ColumnDef,
  FilterDef,
} from "@/shared/components/data-table";
import { downloadJson, readJsonFile, timestampedFilename } from "../lib/jsonIO";

/**
 * Shared wrapper around `<DataTable>` that wires:
 *
 * - Selection state (Set of row IDs).
 * - Bulk-delete via responsive AlertDialog confirm.
 * - JSON export of selected rows (or all visible if none selected) —
 *   passes through `exportShape` so each tab decides what subset of
 *   row fields it ships.
 * - JSON import via hidden file input → `onImport(parsed)`.
 *
 * Each tab supplies its own data + columns + bulk-delete mutation;
 * this component owns nothing about the resource type.
 */
export interface ResourceTableProps<T> {
  data: ReadonlyArray<T> | undefined;
  isLoading?: boolean;
  columns: ReadonlyArray<ColumnDef<T>>;
  filters?: ReadonlyArray<FilterDef<T>>;
  rowKey: (row: T) => string;
  searchAccessor: (row: T) => string;
  searchPlaceholder?: string;
  /** Called when the user confirms bulk-delete. Resolve once the
   *  Convex mutation has applied so the toast fires correctly. */
  onBulkDelete: (ids: ReadonlyArray<string>) => Promise<{ deleted: number }>;
  /** Tab-specific filename prefix (e.g. "cv", "portfolio"). */
  exportPrefix: string;
  /** Convert a row into the export-friendly shape. Defaults to identity. */
  exportShape?: (row: T) => unknown;
  /** Optional import handler — when provided, an Import button shows
   *  in the toolbar. The handler receives the parsed JSON value. */
  onImport?: (parsed: unknown) => Promise<void>;
  /** Singular noun for confirm dialogs ("CV", "lamaran", "kontak"). */
  resourceLabel: string;
  /** Empty-state message when there is genuinely no data. */
  emptyMessage?: ReactNode;
  /** Optional row click — opens detail / relations drawer. */
  onRowClick?: (row: T) => void;
}

export function ResourceTable<T>({
  data,
  isLoading = false,
  columns,
  filters,
  rowKey,
  searchAccessor,
  searchPlaceholder,
  onBulkDelete,
  exportPrefix,
  exportShape,
  onImport,
  resourceLabel,
  emptyMessage,
  onRowClick,
}: ResourceTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const rows = data ?? [];

  const handleExport = () => {
    const ids = selectedIds.size > 0 ? selectedIds : null;
    const picked = ids
      ? rows.filter((r) => ids.has(rowKey(r)))
      : rows;
    if (picked.length === 0) {
      toast.info("Tidak ada data untuk diekspor.");
      return;
    }
    const shaped = exportShape ? picked.map(exportShape) : picked;
    downloadJson(timestampedFilename(exportPrefix), shaped);
    toast.success(
      `${picked.length} ${resourceLabel} diekspor ke JSON.`,
    );
  };

  const handleImportClick = () => {
    if (!onImport) return;
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onImport) return;
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so re-importing same file fires onChange
    if (!file) return;
    setBusy(true);
    try {
      const parsed = await readJsonFile(file);
      await onImport(parsed);
    } catch (err) {
      toast.error(
        `Gagal mengimpor: ${err instanceof Error ? err.message : "format JSON tidak valid"}`,
      );
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBusy(true);
    try {
      const res = await onBulkDelete(ids);
      toast.success(`${res.deleted} ${resourceLabel} dihapus.`);
      setSelectedIds(new Set());
      setConfirmOpen(false);
    } catch (err) {
      toast.error(
        `Gagal menghapus: ${err instanceof Error ? err.message : "tidak dikenal"}`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DataTable
        data={rows}
        columns={columns}
        filters={filters}
        rowKey={rowKey}
        searchAccessor={searchAccessor}
        searchPlaceholder={searchPlaceholder}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        onRowClick={onRowClick}
        toolbarActions={
          <div className="flex flex-wrap items-center gap-2">
            {onImport && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleImportClick}
                disabled={busy}
                className="h-9 gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                Impor
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={busy || rows.length === 0}
              className="h-9 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Ekspor{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </Button>
            {onImport && (
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={handleImportFile}
              />
            )}
          </div>
        }
        bulkActions={
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={busy}
            className="h-9 gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </Button>
        }
      />

      <ResponsiveAlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              Hapus {selectedIds.size} {resourceLabel}?
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              Tindakan ini tidak bisa dibatalkan. Data yang dihapus
              tidak masuk ke riwayat batch — pertimbangkan untuk
              mengekspor JSON lebih dulu.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Batal</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={busy}
            >
              Ya, hapus
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </>
  );
}
