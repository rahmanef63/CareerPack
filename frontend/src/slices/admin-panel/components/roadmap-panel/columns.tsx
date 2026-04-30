"use client";

import { BookOpen, ChevronDown, Trash2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Progress } from "@/shared/components/ui/progress";
import type { ColumnDef } from "@/shared/components/data-table";
import { formatDate } from "@/shared/lib/formatDate";
import type { RoadmapRow } from "../../types/roadmap";

interface Handlers {
  onOpenSheet: (row: RoadmapRow) => void;
  onDelete: (row: RoadmapRow) => void;
}

export function buildRoadmapColumns(h: Handlers): ReadonlyArray<ColumnDef<RoadmapRow>> {
  return [
    {
      id: "userEmail",
      header: "Pengguna",
      accessor: (r) => r.userEmail,
      cell: (r) =>
        r.userEmail ? (
          <span className="font-mono text-xs">{r.userEmail}</span>
        ) : (
          <span className="italic text-muted-foreground">(anonim)</span>
        ),
    },
    {
      id: "careerPath",
      header: "Career Path",
      accessor: (r) => r.careerPath,
      cell: (r) => <span className="font-medium">{r.careerPath}</span>,
    },
    {
      id: "skillsCount",
      header: "Skills",
      accessor: (r) => r.skillsCount,
      align: "right",
      hideOnMobile: true,
      cell: (r) => (
        <Badge variant="secondary" className="tabular-nums">
          {r.skillsCount}
        </Badge>
      ),
    },
    {
      id: "progress",
      header: "Progress",
      accessor: (r) => r.progress,
      hideOnMobile: true,
      cell: (r) => (
        <div className="flex items-center gap-2 min-w-[90px]">
          <Progress value={r.progress} className="h-1.5 flex-1" />
          <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
            {r.progress}%
          </span>
        </div>
      ),
    },
    {
      id: "createdAt",
      header: "Dibuat",
      accessor: (r) => r.createdAt,
      align: "right",
      hideOnMobile: true,
      cell: (r) => (
        <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      accessor: () => "",
      sortable: false,
      hideMobileLabel: true,
      cell: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
              aria-label="Aksi roadmap"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={() => h.onOpenSheet(r)}>
              <BookOpen className="mr-2 h-4 w-4" />
              Kelola Skills
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => h.onDelete(r)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus Roadmap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
