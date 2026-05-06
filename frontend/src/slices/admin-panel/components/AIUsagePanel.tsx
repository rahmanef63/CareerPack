"use client";

import { useQuery } from "convex/react";
import { Activity, AlertTriangle, Users } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";

/**
 * AI usage rollup for the admin dashboard. Pairs with `ErrorLogsPanel`
 * for full ops visibility:
 *   - 30-day sparkline of AI requests + errors per day
 *   - Top-10 users by 30-day AI request count (capacity / abuse signal)
 *   - Top-10 error sources (where the AI pipeline breaks most often)
 *   - Current rolling load (60s + 24h)
 *
 * All data comes from `getAIUsageStats` — single round-trip, single
 * `requireAdmin` gate. No client-side aggregation; the query already
 * does the heavy lifting.
 */
export function AIUsagePanel() {
  const stats = useQuery(api.admin.queries.getAIUsageStats, {});

  if (stats === undefined) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const peak = Math.max(1, ...stats.daily.map((d) => Math.max(d.requests, d.errors)));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          icon={Activity}
          label="Permintaan 60s"
          value={stats.currentLoad.last60s}
          hint="rolling 1 menit"
        />
        <StatTile
          icon={Activity}
          label="Permintaan 24j"
          value={stats.currentLoad.last24h}
          hint="rolling 24 jam"
        />
        <StatTile
          icon={Users}
          label="Total 30 hari"
          value={stats.totalRequests30d}
          hint="seluruh user"
        />
        <StatTile
          icon={AlertTriangle}
          label="Error 30 hari"
          value={stats.totalErrors30d}
          hint="dari errorLogs"
          tone={stats.totalErrors30d > 0 ? "warn" : "ok"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sparkline 30 hari</CardTitle>
          <CardDescription>
            Permintaan AI (biru) + error (merah) per hari. Hover untuk angka.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-32 overflow-x-auto">
            {stats.daily.map((d) => {
              const reqH = (d.requests / peak) * 100;
              const errH = (d.errors / peak) * 100;
              return (
                <div
                  key={d.date}
                  className="flex flex-col-reverse items-center gap-0.5 min-w-[14px]"
                  title={`${d.date}: ${d.requests} req, ${d.errors} err`}
                >
                  <div
                    className="w-3 rounded-t bg-brand/70"
                    style={{ height: `${Math.max(2, reqH)}%` }}
                  />
                  {d.errors > 0 && (
                    <div
                      className="w-3 rounded-t bg-destructive"
                      style={{ height: `${Math.max(2, errH)}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>{stats.daily[0]?.date}</span>
            <span>{stats.daily[stats.daily.length - 1]?.date}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top user 30 hari</CardTitle>
            <CardDescription>
              Pengguna dengan permintaan AI terbanyak.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topUsers.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>
            )}
            <ul className="space-y-1.5">
              {stats.topUsers.map((u) => (
                <li
                  key={u.userId}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate">
                    {u.email ?? u.name ?? "(anon)"}
                  </span>
                  <Badge variant="secondary">{u.count}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top error 30 hari</CardTitle>
            <CardDescription>
              Source dengan error terbanyak — fokus debugging di sini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topErrorSources.length === 0 && (
              <p className="text-sm text-muted-foreground">Tidak ada error. ✨</p>
            )}
            <ul className="space-y-1.5">
              {stats.topErrorSources.map((s) => (
                <li
                  key={s.value}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <code className="text-xs">{s.value}</code>
                  <Badge variant="destructive">{s.count}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = "ok",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  hint: string;
  tone?: "ok" | "warn";
}) {
  return (
    <Card>
      <CardContent className="p-3 space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className={`h-3.5 w-3.5 ${tone === "warn" ? "text-destructive" : ""}`} />
          {label}
        </div>
        <div className={`text-2xl font-semibold ${tone === "warn" ? "text-destructive" : ""}`}>
          {value.toLocaleString()}
        </div>
        <div className="text-[10px] text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}
