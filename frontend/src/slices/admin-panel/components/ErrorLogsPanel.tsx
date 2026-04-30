"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDateTime } from "@/shared/lib/formatDate";

const SOURCE_OPTIONS = [
  { value: "all", label: "Semua sumber" },
  { value: "nextjs", label: "Next.js (onRequestError)" },
  { value: "convex", label: "Convex" },
  { value: "client", label: "Client" },
] as const;

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/**
 * Read-only viewer for the `errorLogs` table. Currently only
 * `instrumentation.ts.onRequestError` writes into it — Convex
 * server-side and client-side hooks could publish here later.
 *
 * Filter dropdown narrows by `source` field; the underlying query
 * does the filter server-side. Pagination cursor lives in local
 * state so admin can browse history without re-running the query.
 */
export function ErrorLogsPanel() {
  const [source, setSource] = useState<(typeof SOURCE_OPTIONS)[number]["value"]>("all");
  const [cursor, setCursor] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(30);

  const result = useQuery(api.admin.queries.viewErrorLogs, {
    cursor,
    limit: pageSize,
    source: source === "all" ? undefined : source,
  });

  const logs = result?.page ?? [];
  const isLoading = result === undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertOctagon className="h-5 w-5" />
          Log Kesalahan
        </CardTitle>
        <CardDescription>
          Kesalahan tertangkap dari Next.js / Convex / klien. Hanya admin yang
          bisa mengakses log ini.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <ResponsiveSelect
            value={source}
            onValueChange={(v) => {
              setSource(v as typeof source);
              setCursor(null);
            }}
          >
            <ResponsiveSelectTrigger
              className="h-9 sm:w-[220px]"
              aria-label="Filter sumber"
            />
            <ResponsiveSelectContent drawerTitle="Sumber log">
              {SOURCE_OPTIONS.map((o) => (
                <ResponsiveSelectItem key={o.value} value={o.value}>
                  {o.label}
                </ResponsiveSelectItem>
              ))}
            </ResponsiveSelectContent>
          </ResponsiveSelect>
          <ResponsiveSelect
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setCursor(null);
            }}
          >
            <ResponsiveSelectTrigger
              className="h-9 sm:w-[140px]"
              aria-label="Baris per halaman"
            >
              {pageSize} / hal
            </ResponsiveSelectTrigger>
            <ResponsiveSelectContent drawerTitle="Baris per halaman">
              {PAGE_SIZE_OPTIONS.map((n) => (
                <ResponsiveSelectItem key={n} value={String(n)}>
                  {n}
                </ResponsiveSelectItem>
              ))}
            </ResponsiveSelectContent>
          </ResponsiveSelect>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor(null)}
            className="gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-2 rounded-md border border-border p-3" aria-busy="true" aria-live="polite">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {!isLoading && logs.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Tidak ada log yang cocok. Itu bagus.
          </p>
        )}

        {logs.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Waktu</th>
                  <th className="px-3 py-2 font-medium">Sumber</th>
                  <th className="hidden px-3 py-2 font-medium md:table-cell">
                    Route
                  </th>
                  <th className="px-3 py-2 font-medium">Pesan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((l) => (
                  <tr key={l._id} className="align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                      {formatDateTime(l.timestamp)}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="secondary" className="bg-muted">
                        {l.source}
                      </Badge>
                    </td>
                    <td className="hidden max-w-[180px] truncate px-3 py-2 text-xs text-muted-foreground md:table-cell">
                      {l.route ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <details>
                        <summary className="cursor-pointer line-clamp-2 font-mono text-foreground/80">
                          {l.message}
                        </summary>
                        {l.stack && (
                          <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted/50 p-2 text-[10px] text-muted-foreground">
                            {l.stack}
                          </pre>
                        )}
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result && !result.isDone && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCursor(result.continueCursor)}
            >
              Muat lebih lama
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
