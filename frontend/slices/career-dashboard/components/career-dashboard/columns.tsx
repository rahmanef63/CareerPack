"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { formatDate } from "@/shared/lib/formatDate";
import {
  ResponsiveDropdownMenu as DropdownMenu,
  ResponsiveDropdownMenuContent as DropdownMenuContent,
  ResponsiveDropdownMenuLabel as DropdownMenuLabel,
  ResponsiveDropdownMenuSeparator as DropdownMenuSeparator,
  ResponsiveDropdownMenuRadioGroup as DropdownMenuRadioGroup,
  ResponsiveDropdownMenuRadioItem as DropdownMenuRadioItem,
  ResponsiveDropdownMenuTrigger as DropdownMenuTrigger,
  ResponsiveDropdownMenuItem as DropdownMenuItem,
} from "@/shared/components/ui/responsive-dropdown-menu";
import type { ColumnDef, FilterDef } from "@/shared/components/data-table";
import type { Application, ApplicationStatus } from "../../types";
import { STATUS_META } from "../../constants/status";

interface BuildArgs {
  onStatusChange: (a: Application, s: ApplicationStatus) => void;
  onDelete: (a: Application) => void;
}

export function buildApplicationColumns({
  onStatusChange, onDelete,
}: BuildArgs): ReadonlyArray<ColumnDef<Application>> {
  return [
    {
      id: "company",
      header: "Perusahaan",
      accessor: (a) => a.company,
      cell: (a) => <span className="font-medium">{a.company}</span>,
    },
    {
      id: "position",
      header: "Posisi",
      accessor: (a) => a.position,
    },
    {
      id: "status",
      header: "Status",
      accessor: (a) => a.status,
      cell: (a) => {
        const meta = STATUS_META[a.status] ?? {
          label: a.status,
          className: "bg-muted text-foreground",
        };
        return (
          <Badge variant="secondary" className={meta.className}>
            {meta.label}
          </Badge>
        );
      },
    },
    {
      id: "appliedDate",
      header: "Tanggal",
      accessor: (a) => {
        const d =
          typeof a.appliedDate === "number"
            ? new Date(a.appliedDate)
            : new Date(a.appliedDate);
        return Number.isNaN(d.getTime()) ? null : d;
      },
      cell: (a) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatDate(a.appliedDate)}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      id: "notes",
      header: "Catatan",
      accessor: (a) => a.notes ?? "",
      cell: (a) => (
        <span className="block max-w-[240px] truncate text-sm text-muted-foreground">
          {a.notes || "—"}
        </span>
      ),
      hideOnMobile: true,
      sortable: false,
    },
    {
      id: "actions",
      header: "",
      accessor: () => "",
      sortable: false,
      hideMobileLabel: true,
      cell: (a) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Aksi untuk ${a.company}`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ubah Status</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={a.status}
              onValueChange={(v) => onStatusChange(a, v as ApplicationStatus)}
            >
              {(Object.keys(STATUS_META) as ApplicationStatus[]).map((s) => (
                <DropdownMenuRadioItem key={s} value={s}>
                  {STATUS_META[s].label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => onDelete(a)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus Lamaran
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

export const APPLICATION_FILTERS: ReadonlyArray<FilterDef<Application>> = [
  {
    id: "status",
    label: "Status",
    accessor: (a) => a.status,
    options: (Object.keys(STATUS_META) as ApplicationStatus[]).map((s) => ({
      value: s,
      label: STATUS_META[s].label,
    })),
  },
];
