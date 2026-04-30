"use client";

import { useQuery } from "convex/react";
import { History } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { formatDateTime } from "@/shared/lib/formatDate";
import { DataTable } from "@/shared/components/data-table";
import type { ColumnDef, FilterDef } from "@/shared/components/data-table";

const ROLE_LABEL: Record<"admin" | "moderator" | "user", string> = {
  admin: "Admin",
  moderator: "Moderator",
  user: "Pengguna",
};

type Row = NonNullable<ReturnType<typeof useQuery<typeof api.admin.queries.listRoleAuditLogs>>>[number];

export function AuditLogPanel() {
  const logs = useQuery(api.admin.queries.listRoleAuditLogs, { limit: 200 });

  const columns: ReadonlyArray<ColumnDef<Row>> = [
    {
      id: "timestamp",
      header: "Waktu",
      accessor: (r) => r.timestamp,
      cell: (r) => <span className="text-xs text-muted-foreground">{formatDateTime(r.timestamp)}</span>,
      width: "w-[180px]",
    },
    {
      id: "actor",
      header: "Admin",
      accessor: (r) => r.actorEmail ?? "",
      cell: (r) => <span className="text-sm">{r.actorEmail ?? "—"}</span>,
    },
    {
      id: "target",
      header: "Pengguna",
      accessor: (r) => r.targetEmail ?? "",
      cell: (r) => <span className="text-sm">{r.targetEmail ?? "(tidak diketahui)"}</span>,
    },
    {
      id: "previousRole",
      header: "Sebelum",
      accessor: (r) => r.previousRole,
      cell: (r) => (
        <Badge variant="secondary" className="bg-muted text-[10px]">
          {ROLE_LABEL[r.previousRole]}
        </Badge>
      ),
      hideOnMobile: true,
      width: "w-[110px]",
    },
    {
      id: "newRole",
      header: "Sesudah",
      accessor: (r) => r.newRole,
      cell: (r) => (
        <Badge variant="secondary" className="bg-brand/20 text-brand text-[10px]">
          {ROLE_LABEL[r.newRole]}
        </Badge>
      ),
      width: "w-[110px]",
    },
  ];

  const filters: ReadonlyArray<FilterDef<Row>> = [
    {
      id: "newRole",
      label: "Role baru",
      accessor: (r) => r.newRole,
      options: [
        { value: "admin", label: "Admin" },
        { value: "moderator", label: "Moderator" },
        { value: "user", label: "Pengguna" },
      ],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Riwayat Perubahan Peran
        </CardTitle>
        <CardDescription>
          200 perubahan terakhir. Perubahan peran pengguna selalu dicatat untuk jejak audit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable<Row>
          data={logs ?? []}
          columns={columns}
          filters={filters}
          rowKey={(r) => r._id}
          searchAccessor={(r) => [r.actorEmail, r.targetEmail].filter(Boolean).join(" ")}
          searchPlaceholder="Cari email admin atau pengguna…"
          isLoading={logs === undefined}
          emptyMessage="Belum ada perubahan peran."
          initialPageSize={25}
        />
      </CardContent>
    </Card>
  );
}
