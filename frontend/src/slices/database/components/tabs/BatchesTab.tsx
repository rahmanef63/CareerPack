"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../../convex/_generated/dataModel";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { DataTable } from "@/shared/components/data-table";
import type { ColumnDef, FilterDef } from "@/shared/components/data-table";

type Batch = Doc<"quickFillBatches">;

/**
 * Read-only Quick Fill history. Each row shows the per-section count
 * + a single Undo action that calls `undoBatch` (deletes the inserted
 * rows + reverts the profile snapshot). Already-undone batches stay
 * in the list as a grey row so the user keeps visibility into what
 * happened.
 */
export function BatchesTab() {
  const data = useQuery(api.onboarding.queries.listBatches);
  const undoBatch = useMutation(api.onboarding.mutations.undoBatch);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleUndo = async (id: Id<"quickFillBatches">) => {
    setPendingId(id);
    try {
      const res = await undoBatch({ batchId: id });
      toast.success(`Batch dibatalkan — ${res.deleted} baris dihapus.`);
    } catch (err) {
      toast.error(
        `Gagal undo: ${err instanceof Error ? err.message : "tidak dikenal"}`,
      );
    } finally {
      setPendingId(null);
    }
  };

  const columns: ReadonlyArray<ColumnDef<Batch>> = [
    {
      id: "createdAt",
      header: "Waktu",
      accessor: (r) => r.createdAt,
      cell: (r) => new Date(r.createdAt).toLocaleString("id-ID"),
    },
    {
      id: "scope",
      header: "Scope",
      accessor: (r) => r.scope,
      cell: (r) => <Badge variant="outline">{r.scope}</Badge>,
    },
    {
      id: "summary",
      header: "Ringkasan",
      accessor: (r) =>
        [
          r.profileTouched ? "profil" : null,
          r.cvIds.length ? `${r.cvIds.length} CV` : null,
          r.portfolioIds.length ? `${r.portfolioIds.length} portofolio` : null,
          r.goalIds.length ? `${r.goalIds.length} goal` : null,
          r.applicationIds.length ? `${r.applicationIds.length} lamaran` : null,
          r.contactIds.length ? `${r.contactIds.length} kontak` : null,
        ]
          .filter(Boolean)
          .join(" · ") || "(kosong)",
      sortable: false,
    },
    {
      id: "warnings",
      header: "Peringatan",
      accessor: (r) => r.warnings.length,
      align: "right",
      hideOnMobile: true,
    },
    {
      id: "status",
      header: "Status",
      accessor: (r) => (r.undone ? "undone" : "active"),
      cell: (r) =>
        r.undone ? (
          <Badge variant="secondary">Dibatalkan</Badge>
        ) : (
          <Badge>Aktif</Badge>
        ),
    },
    {
      id: "action",
      header: "Aksi",
      accessor: (r) => (r.undone ? 1 : 0),
      sortable: false,
      hideMobileLabel: true,
      cell: (r) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={r.undone || pendingId === r._id}
          onClick={() => handleUndo(r._id)}
          className="h-8 gap-1.5"
        >
          <Undo2 className="h-3.5 w-3.5" />
          {r.undone ? "Sudah" : pendingId === r._id ? "Memproses…" : "Undo"}
        </Button>
      ),
    },
  ];

  const filters: ReadonlyArray<FilterDef<Batch>> = [
    {
      id: "status",
      label: "Status",
      accessor: (r) => (r.undone ? "undone" : "active"),
      options: [
        { value: "active", label: "Aktif" },
        { value: "undone", label: "Dibatalkan" },
      ],
    },
  ];

  return (
    <DataTable
      data={data ?? []}
      columns={columns}
      filters={filters}
      rowKey={(r) => r._id}
      searchAccessor={(r) =>
        `${r.scope} ${new Date(r.createdAt).toLocaleString("id-ID")} ${r.warnings.join(" ")}`
      }
      searchPlaceholder="Cari riwayat batch…"
      isLoading={data === undefined}
      emptyMessage="Belum ada riwayat Quick Fill."
    />
  );
}
