"use client";

import { useQuery } from "convex/react";
import { MessageSquare } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { formatDateTime } from "@/shared/lib/formatDate";

export function FeedbackPanel() {
  const items = useQuery(api.admin.queries.listFeedback, { limit: 50 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Masukan Pengguna
        </CardTitle>
        <CardDescription>
          50 masukan terakhir dari form Pusat Bantuan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items === undefined && (
          <p className="text-sm text-muted-foreground">Memuat masukan…</p>
        )}
        {items && items.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada masukan.</p>
        )}
        {items && items.length > 0 && (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item._id}
                className="rounded-lg border border-border bg-muted/30 p-4"
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{item.subject}</p>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {formatDateTime(item.timestamp)}
                  </Badge>
                </div>
                <p className="mb-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {item.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  Dari: {item.submitterEmail ?? "Anonim"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
