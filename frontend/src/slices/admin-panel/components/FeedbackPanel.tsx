"use client";

import { useQuery } from "convex/react";
import { MessageSquare } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatDateTime } from "@/shared/lib/formatDate";
import { DataTable } from "@/shared/components/data-table";
import type { ColumnDef } from "@/shared/components/data-table";

type Row = NonNullable<ReturnType<typeof useQuery<typeof api.admin.queries.listFeedback>>>[number];

export function FeedbackPanel() {
  const items = useQuery(api.admin.queries.listFeedback, { limit: 200 });

  const columns: ReadonlyArray<ColumnDef<Row>> = [
    {
      id: "timestamp",
      header: "Waktu",
      accessor: (r) => r.timestamp,
      cell: (r) => <span className="text-xs text-muted-foreground">{formatDateTime(r.timestamp)}</span>,
      width: "w-[180px]",
    },
    {
      id: "submitter",
      header: "Dari",
      accessor: (r) => r.submitterEmail ?? "anonim",
      cell: (r) => (
        <span className="text-sm font-mono">{r.submitterEmail ?? <span className="italic text-muted-foreground">anonim</span>}</span>
      ),
      width: "w-[220px]",
      hideOnMobile: true,
    },
    {
      id: "subject",
      header: "Subjek",
      accessor: (r) => r.subject,
      cell: (r) => <span className="font-medium text-sm">{r.subject}</span>,
    },
    {
      id: "message",
      header: "Pesan",
      accessor: (r) => r.message,
      cell: (r) => (
        <details className="text-xs">
          <summary className="cursor-pointer line-clamp-2 max-w-[420px]">
            {r.message}
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-muted-foreground max-w-[420px]">
            {r.message}
          </p>
        </details>
      ),
      sortable: false,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Masukan Pengguna
        </CardTitle>
        <CardDescription>
          200 masukan terakhir dari form Pusat Bantuan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable<Row>
          data={items ?? []}
          columns={columns}
          rowKey={(r) => r._id}
          searchAccessor={(r) => [r.subject, r.message, r.submitterEmail].filter(Boolean).join(" ")}
          searchPlaceholder="Cari subjek, pesan, atau email…"
          isLoading={items === undefined}
          emptyMessage="Belum ada masukan."
          initialPageSize={25}
        />
      </CardContent>
    </Card>
  );
}
