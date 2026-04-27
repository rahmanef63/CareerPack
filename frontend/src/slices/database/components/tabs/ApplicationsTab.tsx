"use client";

import { api } from "../../../../../../convex/_generated/api";
import type { Doc } from "../../../../../../convex/_generated/dataModel";
import type { ColumnDef, FilterDef } from "@/shared/components/data-table";
import { Badge } from "@/shared/components/ui/badge";
import { defineResource } from "../../lib/defineResource";

type Application = Doc<"jobApplications">;
type CalendarEvent = Doc<"calendarEvents">;

const columns: ReadonlyArray<ColumnDef<Application>> = [
  { id: "company", header: "Perusahaan", accessor: (r) => r.company },
  { id: "position", header: "Posisi", accessor: (r) => r.position, width: "w-1/4" },
  { id: "location", header: "Lokasi", accessor: (r) => r.location, hideOnMobile: true },
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
  { id: "source", header: "Sumber", accessor: (r) => r.source, hideOnMobile: true },
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

export const ApplicationsTab = defineResource<Application>({
  query: api.applications.queries.getUserApplications,
  bulkDelete: api.applications.mutations.bulkDeleteApplications,
  quickFill: api.onboarding.mutations.quickFill,
  resourceLabel: "lamaran",
  exportPrefix: "applications",
  columns,
  filters,
  rowKey: (r) => r._id,
  searchAccessor: (r) =>
    `${r.company} ${r.position} ${r.location} ${r.status} ${r.source}`,
  searchPlaceholder: "Cari lamaran…",
  emptyMessage: "Belum ada lamaran.",
  importConfig: {
    wrapperKey: "applications",
    mode: "array",
    scope: "applications",
    formatSuccess: (res) =>
      `${res.applications.added} lamaran ditambahkan${
        res.applications.skipped > 0
          ? ` (${res.applications.skipped} dilewati)`
          : ""
      }.`,
  },
  relatedDrawer: {
    title: (r) => `${r.position} · ${r.company}`,
    subtitle: (r) =>
      `${r.location}${r.salary ? ` · ${r.salary}` : ""} · ${r.status}`,
    sections: [
      {
        title: "Agenda terkait",
        query: api.applications.queries.getCalendarEventsByApplication,
        getArgs: (r) => ({ applicationId: r._id }),
        emptyMessage: "Belum ada agenda yang terhubung ke lamaran ini.",
        renderItem: (item) => {
          const ev = item as CalendarEvent;
          return (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{ev.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {ev.date} · {ev.time}
                  {ev.location && ` · ${ev.location}`}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0">
                {ev.type}
              </Badge>
            </div>
          );
        },
      },
    ],
  },
});
