"use client";

import { api } from "../../../../../../convex/_generated/api";
import type { Doc } from "../../../../../../convex/_generated/dataModel";
import type { ColumnDef, FilterDef } from "@/shared/components/data-table";
import { Badge } from "@/shared/components/ui/badge";
import { formatDate } from "@/shared/lib/formatDate";
import { defineResource } from "../../lib/defineResource";

type Goal = Doc<"careerGoals">;

const columns: ReadonlyArray<ColumnDef<Goal>> = [
  { id: "title", header: "Judul", accessor: (r) => r.title, width: "w-1/3" },
  { id: "category", header: "Kategori", accessor: (r) => r.category },
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
    cell: (r) => formatDate(r.targetDate),
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

export const GoalsTab = defineResource<Goal>({
  query: api.goals.queries.getUserGoals,
  bulkDelete: api.goals.mutations.bulkDeleteGoals,
  quickFill: api.onboarding.mutations.quickFill,
  resourceLabel: "goal",
  exportPrefix: "goals",
  columns,
  filters,
  rowKey: (r) => r._id,
  searchAccessor: (r) => `${r.title} ${r.description} ${r.category}`,
  searchPlaceholder: "Cari goal…",
  emptyMessage: "Belum ada goal.",
  importConfig: {
    wrapperKey: "goals",
    mode: "array",
    scope: "goals",
    formatSuccess: (res) =>
      `${res.goals.added} goal ditambahkan${
        res.goals.skipped > 0 ? ` (${res.goals.skipped} dilewati)` : ""
      }.`,
  },
});
