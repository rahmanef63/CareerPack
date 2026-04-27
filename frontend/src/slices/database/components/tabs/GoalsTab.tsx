"use client";

import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../../convex/_generated/dataModel";
import type { ColumnDef, FilterDef } from "@/shared/components/data-table";
import { Badge } from "@/shared/components/ui/badge";
import { ResourceTable } from "../ResourceTable";

type Goal = Doc<"careerGoals">;

const columns: ReadonlyArray<ColumnDef<Goal>> = [
  {
    id: "title",
    header: "Judul",
    accessor: (r) => r.title,
    width: "w-1/3",
  },
  {
    id: "category",
    header: "Kategori",
    accessor: (r) => r.category,
  },
  {
    id: "status",
    header: "Status",
    accessor: (r) => r.status,
    cell: (r) => (
      <Badge variant={r.status === "completed" ? "default" : "outline"}>
        {r.status}
      </Badge>
    ),
  },
  {
    id: "progress",
    header: "Progress",
    accessor: (r) => r.progress,
    align: "right",
    cell: (r) => `${r.progress}%`,
  },
  {
    id: "targetDate",
    header: "Target",
    accessor: (r) => new Date(r.targetDate),
    cell: (r) => new Date(r.targetDate).toLocaleDateString("id-ID"),
    hideOnMobile: true,
  },
];

const filters: ReadonlyArray<FilterDef<Goal>> = [
  {
    id: "status",
    label: "Status",
    accessor: (r) => r.status,
    options: [
      { value: "active", label: "Aktif" },
      { value: "completed", label: "Selesai" },
      { value: "archived", label: "Diarsipkan" },
    ],
  },
];

export function GoalsTab() {
  const data = useQuery(api.goals.queries.getUserGoals);
  const bulkDelete = useMutation(api.goals.mutations.bulkDeleteGoals);
  const quickFill = useMutation(api.onboarding.mutations.quickFill);

  return (
    <ResourceTable<Goal>
      data={data}
      isLoading={data === undefined}
      columns={columns}
      filters={filters}
      rowKey={(r) => r._id}
      searchAccessor={(r) => `${r.title} ${r.description} ${r.category}`}
      searchPlaceholder="Cari goal…"
      resourceLabel="goal"
      exportPrefix="goals"
      exportShape={({ _id: _i, _creationTime: _t, userId: _u, ...rest }) => rest}
      onBulkDelete={async (ids) =>
        bulkDelete({ goalIds: ids as Id<"careerGoals">[] })
      }
      onImport={async (parsed) => {
        const goals = Array.isArray(parsed)
          ? parsed
          : isGoalsWrapper(parsed)
            ? parsed.goals
            : null;
        if (!goals) {
          toast.error("Format JSON tidak dikenali — kirim array atau `{ goals: [...] }`.");
          return;
        }
        const res = await quickFill({ payload: { goals }, scope: "goals" });
        toast.success(
          `${res.goals.added} goal ditambahkan${
            res.goals.skipped > 0 ? ` (${res.goals.skipped} dilewati)` : ""
          }.`,
        );
      }}
      emptyMessage="Belum ada goal."
    />
  );
}

function isGoalsWrapper(v: unknown): v is { goals: unknown[] } {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return Array.isArray(obj.goals);
}
