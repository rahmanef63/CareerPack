"use client";

import { api } from "../../../../../../convex/_generated/api";
import type { Doc } from "../../../../../../convex/_generated/dataModel";
import type { ColumnDef, FilterDef } from "@/shared/components/data-table";
import { Badge } from "@/shared/components/ui/badge";
import { formatDate } from "@/shared/lib/formatDate";
import { defineResource } from "../../lib/defineResource";

type CV = Doc<"cvs">;
type Application = Doc<"jobApplications">;
type ATSScan = Doc<"atsScans">;

const columns: ReadonlyArray<ColumnDef<CV>> = [
  { id: "title", header: "Judul", accessor: (r) => r.title, width: "w-1/3" },
  { id: "fullName", header: "Nama", accessor: (r) => r.personalInfo.fullName },
  { id: "template", header: "Template", accessor: (r) => r.template, hideOnMobile: true },
  { id: "experience", header: "Pengalaman", accessor: (r) => r.experience.length, align: "right", hideOnMobile: true },
  { id: "skills", header: "Skill", accessor: (r) => r.skills.length, align: "right", hideOnMobile: true },
  {
    id: "createdAt",
    header: "Dibuat",
    accessor: (r) => new Date(r._creationTime),
    cell: (r) => formatDate(r._creationTime),
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

export const CVTab = defineResource<CV>({
  query: api.cv.queries.getUserCVs,
  bulkDelete: api.cv.mutations.bulkDeleteCVs,
  quickFill: api.onboarding.mutations.quickFill,
  resourceLabel: "CV",
  exportPrefix: "cv",
  columns,
  filters,
  rowKey: (r) => r._id,
  searchAccessor: (r) =>
    `${r.title} ${r.personalInfo.fullName} ${r.personalInfo.email} ${r.template}`,
  searchPlaceholder: "Cari CV (judul, nama, email)…",
  emptyMessage: "Belum ada CV. Buat dari halaman CV atau impor JSON.",
  importConfig: {
    wrapperKey: "cv",
    mode: "object",
    scope: "cv",
    formatSuccess: (res) => (res.cv ? "CV ditambahkan dari JSON." : null),
  },
  relatedDrawer: {
    title: (r) => r.title,
    subtitle: (r) =>
      `${r.personalInfo.fullName} · ${r.experience.length} pengalaman · ${r.skills.length} skill`,
    sections: [
      {
        title: "Lamaran pakai CV ini",
        query: api.cv.queries.getApplicationsByCV,
        getArgs: (r) => ({ cvId: r._id }),
        emptyMessage: "Belum ada lamaran yang menautkan CV ini.",
        renderItem: (item) => {
          const app = item as Application;
          return (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {app.position} · {app.company}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatDate(app.appliedDate)}
                  {app.location && ` · ${app.location}`}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0">
                {app.status}
              </Badge>
            </div>
          );
        },
      },
      {
        title: "Riwayat ATS Scan",
        query: api.cv.queries.getATSScansByCV,
        getArgs: (r) => ({ cvId: r._id }),
        emptyMessage: "Belum pernah di-scan ATS.",
        renderItem: (item) => {
          const scan = item as ATSScan;
          return (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {scan.jobTitle}
                  {scan.jobCompany && ` · ${scan.jobCompany}`}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatDate(scan.createdAt)}
                </p>
              </div>
              <Badge
                variant={scan.score >= 70 ? "default" : "secondary"}
                className="shrink-0"
              >
                {scan.score} · {scan.grade}
              </Badge>
            </div>
          );
        },
      },
    ],
  },
});
