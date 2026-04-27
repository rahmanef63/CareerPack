"use client";

import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../../convex/_generated/dataModel";
import type { ColumnDef, FilterDef } from "@/shared/components/data-table";
import { ResourceTable } from "../ResourceTable";

type CV = Doc<"cvs">;

const columns: ReadonlyArray<ColumnDef<CV>> = [
  {
    id: "title",
    header: "Judul",
    accessor: (r) => r.title,
    width: "w-1/3",
  },
  {
    id: "fullName",
    header: "Nama",
    accessor: (r) => r.personalInfo.fullName,
  },
  {
    id: "template",
    header: "Template",
    accessor: (r) => r.template,
    hideOnMobile: true,
  },
  {
    id: "experience",
    header: "Pengalaman",
    accessor: (r) => r.experience.length,
    align: "right",
    hideOnMobile: true,
  },
  {
    id: "skills",
    header: "Skill",
    accessor: (r) => r.skills.length,
    align: "right",
    hideOnMobile: true,
  },
  {
    id: "createdAt",
    header: "Dibuat",
    accessor: (r) => new Date(r._creationTime),
    cell: (r) => new Date(r._creationTime).toLocaleDateString("id-ID"),
  },
];

const filters: ReadonlyArray<FilterDef<CV>> = [
  {
    id: "template",
    label: "Template",
    accessor: (r) => r.template,
    options: [
      { value: "modern", label: "Modern" },
      { value: "classic", label: "Classic" },
      { value: "creative", label: "Creative" },
      { value: "minimal", label: "Minimal" },
    ],
  },
];

export function CVTab() {
  const data = useQuery(api.cv.queries.getUserCVs);
  const bulkDelete = useMutation(api.cv.mutations.bulkDeleteCVs);
  const quickFill = useMutation(api.onboarding.mutations.quickFill);

  return (
    <ResourceTable<CV>
      data={data}
      isLoading={data === undefined}
      columns={columns}
      filters={filters}
      rowKey={(r) => r._id}
      searchAccessor={(r) =>
        `${r.title} ${r.personalInfo.fullName} ${r.personalInfo.email} ${r.template}`
      }
      searchPlaceholder="Cari CV (judul, nama, email)…"
      resourceLabel="CV"
      exportPrefix="cv"
      exportShape={({ _id: _i, _creationTime: _t, userId: _u, ...rest }) => rest}
      onBulkDelete={async (ids) =>
        bulkDelete({ cvIds: ids as Id<"cvs">[] })
      }
      onImport={async (parsed) => {
        // Accept either a single CV object or `{ cv: {...} }` wrapper.
        const payload = isCVWrapper(parsed) ? parsed : { cv: parsed };
        const res = await quickFill({ payload, scope: "cv" });
        if (res.cv) {
          toast.success("CV ditambahkan dari JSON.");
        } else {
          toast.error(
            res.warnings[0] ??
              "CV tidak dapat diimpor — periksa format JSON.",
          );
        }
      }}
      emptyMessage="Belum ada CV. Buat dari halaman CV atau impor JSON."
    />
  );
}

function isCVWrapper(v: unknown): v is { cv: unknown } {
  return (
    typeof v === "object" && v !== null && "cv" in (v as Record<string, unknown>)
  );
}
