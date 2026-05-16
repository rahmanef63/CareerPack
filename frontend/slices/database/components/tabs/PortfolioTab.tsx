"use client";

import { api } from "../../../../../../convex/_generated/api";
import type { Doc } from "../../../../../../convex/_generated/dataModel";
import type { ColumnDef, FilterDef } from "@/shared/components/data-table";
import { Badge } from "@/shared/components/ui/badge";
import { defineResource } from "../../lib/defineResource";

type Portfolio = Doc<"portfolioItems"> & { coverUrl?: string | null };

const columns: ReadonlyArray<ColumnDef<Portfolio>> = [
  { id: "title", header: "Judul", accessor: (r) => r.title, width: "w-1/3" },
  {
    id: "category",
    header: "Kategori",
    accessor: (r) => r.category,
    cell: (r) => <Badge variant="outline">{r.category}</Badge>,
  },
  { id: "date", header: "Tanggal", accessor: (r) => r.date },
  {
    id: "tech",
    header: "Tech",
    accessor: (r) => (r.techStack ?? []).join(", "),
    sortable: false,
    hideOnMobile: true,
  },
  {
    id: "featured",
    header: "Unggulan",
    accessor: (r) => Boolean(r.featured),
    align: "center",
    hideOnMobile: true,
  },
];

const filters: ReadonlyArray<FilterDef<Portfolio>> = [
  {
    id: "category",
    label: "Kategori",
    accessor: (r) => r.category,
    options: [
      { value: "project", label: "Proyek" },
      { value: "certification", label: "Sertifikasi" },
      { value: "publication", label: "Publikasi" },
    ],
  },
];

export const PortfolioTab = defineResource<Portfolio>({
  query: api.portfolio.queries.listPortfolio,
  bulkDelete: api.portfolio.mutations.bulkDeletePortfolioItems,
  quickFill: api.onboarding.mutations.quickFill,
  resourceLabel: "portofolio",
  exportPrefix: "portfolio",
  columns,
  filters,
  rowKey: (r) => r._id,
  searchAccessor: (r) =>
    `${r.title} ${r.description} ${r.category} ${(r.techStack ?? []).join(" ")}`,
  searchPlaceholder: "Cari portofolio…",
  emptyMessage: "Belum ada item portofolio.",
  exportShape: ({ _id: _i, _creationTime: _t, userId: _u, coverUrl: _c, ...rest }) => rest,
  importConfig: {
    wrapperKey: "portfolio",
    mode: "array",
    scope: "portfolio",
    formatSuccess: (res) =>
      `${res.portfolio.added} portofolio ditambahkan${
        res.portfolio.skipped > 0 ? ` (${res.portfolio.skipped} dilewati)` : ""
      }.`,
  },
});
