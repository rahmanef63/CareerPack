"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AlertOctagon, Copy, RefreshCw, Trash2 } from "lucide-react";
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
import { notify } from "@/shared/lib/notify";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

const RETENTION_PRESETS = [
  { label: "> 30 hari", ms: 30 * 24 * 60 * 60 * 1000 },
  { label: "> 7 hari", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "> 24 jam", ms: 24 * 60 * 60 * 1000 },
] as const;

/**
 * Read + write surface for the `errorLogs` table.
 *
 * Sources are now derived dynamically from `listErrorSources` instead of
 * a hard-coded list — the slice-manifest expansion + the new
 * `_shared/errorSink.ts` helper add new source labels (`ai.chat`,
 * `cv.translate`, `cv.tailor`, `matcher.ats.extractKeywords`, …) faster
 * than a static enum can keep up with.
 *
 * Admin can also clear stale rows via `clearErrorLogs` to keep the
 * table from unbounded growth (no TTL cron yet).
 */
export function ErrorLogsPanel() {
  const [source, setSource] = useState<string>("all");
  const [cursor, setCursor] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(30);

  const sources = useQuery(api.admin.queries.listErrorSources, {});
  const result = useQuery(api.admin.queries.viewErrorLogs, {
    cursor,
    limit: pageSize,
    source: source === "all" ? undefined : source,
  });
  const clearLogs = useMutation(api.admin.mutations.clearErrorLogs);

  const logs = result?.page ?? [];
  const isLoading = result === undefined;

  async function handleClear(olderThanMs: number) {
    const label = RETENTION_PRESETS.find((p) => p.ms === olderThanMs)?.label ?? "lama";
    if (!confirm(`Hapus log ${label}? Tidak bisa di-undo.`)) return;
    try {
      const r = await clearLogs({ olderThanMs });
      notify.success(`Hapus ${r.deleted} log${r.hasMore ? " (masih ada lagi — re-jalankan)" : ""}`);
      setCursor(null);
    } catch (e) {
      notify.fromError(e, "Gagal hapus log");
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      notify.success("Disalin ke clipboard");
    } catch (e) {
      notify.fromError(e, "Gagal salin");
    }
  }

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
              setSource(v);
              setCursor(null);
            }}
          >
            <ResponsiveSelectTrigger
              className="h-9 sm:w-[260px]"
              aria-label="Filter sumber"
            />
            <ResponsiveSelectContent drawerTitle="Sumber log">
              <ResponsiveSelectItem value="all">Semua sumber</ResponsiveSelectItem>
              {sources?.map((s) => (
                <ResponsiveSelectItem key={s.source} value={s.source}>
                  {s.source} ({s.count})
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
          <div className="ml-auto flex flex-wrap items-center gap-1">
            {RETENTION_PRESETS.map((p) => (
              <Button
                key={p.ms}
                variant="outline"
                size="sm"
                onClick={() => handleClear(p.ms)}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {p.label}
              </Button>
            ))}
          </div>
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
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1.5 px-2 text-[10px]"
                            onClick={() =>
                              copyToClipboard(
                                [
                                  `Source: ${l.source}`,
                                  `Time: ${formatDateTime(l.timestamp)}`,
                                  l.route ? `Route: ${l.route}` : null,
                                  `Message: ${l.message}`,
                                  l.stack ? `Stack:\n${l.stack}` : null,
                                ]
                                  .filter(Boolean)
                                  .join("\n"),
                              )
                            }
                          >
                            <Copy className="h-3 w-3" />
                            Salin
                          </Button>
                        </div>
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
