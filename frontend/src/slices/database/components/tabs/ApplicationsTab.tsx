"use client";

import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../../convex/_generated/dataModel";
import type { ColumnDef, FilterDef } from "@/shared/components/data-table";
import { Badge } from "@/shared/components/ui/badge";
import { ResourceTable } from "../ResourceTable";

type Application = Doc<"jobApplications">;

const columns: ReadonlyArray<ColumnDef<Application>> = [
  {
    id: "company",
    header: "Perusahaan",
    accessor: (r) => r.company,
  },
  {
    id: "position",
    header: "Posisi",
    accessor: (r) => r.position,
    width: "w-1/4",
  },
  {
    id: "location",
    header: "Lokasi",
    accessor: (r) => r.location,
    hideOnMobile: true,
  },
  {
    id: "status",
    header: "Status",
    accessor: (r) => r.status,
    cell: (r) => <Badge variant="outline">{r.status}</Badge>,
  },
  {
    id: "appliedDate",
    header: "Tanggal Apply",
    accessor: (r) => new Date(r.appliedDate),
    cell: (r) => new Date(r.appliedDate).toLocaleDateString("id-ID"),
  },
  {
    id: "source",
    header: "Sumber",
    accessor: (r) => r.source,
    hideOnMobile: true,
  },
];

const filters: ReadonlyArray<FilterDef<Application>> = [
  {
    id: "status",
    label: "Status",
    accessor: (r) => r.status,
    options: [
      { value: "applied", label: "Applied" },
      { value: "screening", label: "Screening" },
      { value: "interview", label: "Interview" },
      { value: "offer", label: "Offer" },
      { value: "rejected", label: "Rejected" },
      { value: "withdrawn", label: "Withdrawn" },
    ],
  },
];

export function ApplicationsTab() {
  const data = useQuery(api.applications.queries.getUserApplications);
  const bulkDelete = useMutation(api.applications.mutations.bulkDeleteApplications);
  const quickFill = useMutation(api.onboarding.mutations.quickFill);

  return (
    <ResourceTable<Application>
      data={data}
      isLoading={data === undefined}
      columns={columns}
      filters={filters}
      rowKey={(r) => r._id}
      searchAccessor={(r) =>
        `${r.company} ${r.position} ${r.location} ${r.status} ${r.source}`
      }
      searchPlaceholder="Cari lamaran…"
      resourceLabel="lamaran"
      exportPrefix="applications"
      exportShape={({ _id: _i, _creationTime: _t, userId: _u, ...rest }) => rest}
      onBulkDelete={async (ids) =>
        bulkDelete({ applicationIds: ids as Id<"jobApplications">[] })
      }
      onImport={async (parsed) => {
        const applications = Array.isArray(parsed)
          ? parsed
          : isApplicationsWrapper(parsed)
            ? parsed.applications
            : null;
        if (!applications) {
          toast.error("Format tidak dikenali — array atau `{ applications: [...] }`.");
          return;
        }
        const res = await quickFill({
          payload: { applications },
          scope: "applications",
        });
        toast.success(
          `${res.applications.added} lamaran ditambahkan${
            res.applications.skipped > 0
              ? ` (${res.applications.skipped} dilewati)`
              : ""
          }.`,
        );
      }}
      emptyMessage="Belum ada lamaran."
    />
  );
}

function isApplicationsWrapper(v: unknown): v is { applications: unknown[] } {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return Array.isArray(obj.applications);
}
