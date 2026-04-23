"use client";

import { useQuery } from "convex/react";
import { History } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

const ROLE_LABEL: Record<"admin" | "moderator" | "user", string> = {
  admin: "Admin",
  moderator: "Moderator",
  user: "Pengguna",
};

const DATE_FMT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function AuditLogPanel() {
  const logs = useQuery(api.admin.listRoleAuditLogs, { limit: 50 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Riwayat Perubahan Peran
        </CardTitle>
        <CardDescription>
          50 perubahan terakhir. Perubahan peran pengguna selalu dicatat untuk jejak audit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs === undefined && (
          <p className="text-sm text-muted-foreground">Memuat riwayat…</p>
        )}
        {logs && logs.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada perubahan peran.</p>
        )}
        {logs && logs.length > 0 && (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li
                key={log._id}
                className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-0.5 text-sm">
                  <p>
                    <span className="font-medium">{log.actorEmail ?? "Admin"}</span>
                    {" mengubah "}
                    <span className="font-medium">{log.targetEmail ?? "(tidak diketahui)"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {DATE_FMT.format(new Date(log.timestamp))}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="bg-muted">
                    {ROLE_LABEL[log.previousRole]}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="secondary" className="bg-brand/20 text-brand">
                    {ROLE_LABEL[log.newRole]}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
