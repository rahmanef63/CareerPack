"use client";

import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../../convex/_generated/dataModel";
import type { ColumnDef, FilterDef } from "@/shared/components/data-table";
import { Badge } from "@/shared/components/ui/badge";
import { ResourceTable } from "../ResourceTable";

type Portfolio = Doc<"portfolioItems"> & { coverUrl?: string | null };

const columns: ReadonlyArray<ColumnDef<Portfolio>> = [
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
    cell: (r) => <Badge variant="outline">{r.category}</Badge>,
  },
  {
    id: "date",
    header: "Tanggal",
    accessor: (r) => r.date,
  },
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

export function PortfolioTab() {
  const data = useQuery(api.portfolio.queries.listPortfolio);
  const bulkDelete = useMutation(api.portfolio.mutations.bulkDeletePortfolioItems);
  const quickFill = useMutation(api.onboarding.mutations.quickFill);

  return (
    <ResourceTable<Portfolio>
      data={data}
      isLoading={data === undefined}
      columns={columns}
      filters={filters}
      rowKey={(r) => r._id}
      searchAccessor={(r) =>
        `${r.title} ${r.description} ${r.category} ${(r.techStack ?? []).join(" ")}`
      }
      searchPlaceholder="Cari portofolio…"
      resourceLabel="portofolio"
      exportPrefix="portfolio"
      exportShape={({ _id: _i, _creationTime: _t, userId: _u, coverUrl: _c, ...rest }) => rest}
      onBulkDelete={async (ids) =>
        bulkDelete({ itemIds: ids as Id<"portfolioItems">[] })
      }
      onImport={async (parsed) => {
        const portfolio = Array.isArray(parsed)
          ? parsed
          : isPortfolioWrapper(parsed)
            ? parsed.portfolio
            : null;
        if (!portfolio) {
          toast.error(
            "Format tidak dikenali — kirim array atau objek `{ portfolio: [...] }`.",
          );
          return;
        }
        const res = await quickFill({ payload: { portfolio }, scope: "portfolio" });
        toast.success(
          `${res.portfolio.added} portofolio ditambahkan${
            res.portfolio.skipped > 0
              ? ` (${res.portfolio.skipped} dilewati)`
              : ""
          }.`,
        );
      }}
      emptyMessage="Belum ada item portofolio."
    />
  );
}

function isPortfolioWrapper(v: unknown): v is { portfolio: unknown[] } {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return Array.isArray(obj.portfolio);
}
