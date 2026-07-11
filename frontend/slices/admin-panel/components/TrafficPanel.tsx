"use client";

import { useQuery } from "convex/react";
import { Eye, Users, Globe2, MapPin } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { api } from "../../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { StatCard } from "@/shared/components/stats/StatCard";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const MONTH = 30 * 24 * 60 * 60 * 1000;

type Rank = { key: string; count: number };

/**
 * Admin · Traffic — cookieless visitor analytics from the self-hosted
 * beacon: page views + unique sessions + referrers + geo (country / city
 * via geoip). Two windows (7h / 30h) off one `requireAdmin`-gated query.
 * No cookie, no stored IP.
 */
export function TrafficPanel() {
  const d7 = useQuery(api.pageviews.queries.summary, { sinceMs: WEEK });
  const d30 = useQuery(api.pageviews.queries.summary, { sinceMs: MONTH });

  if (d7 === undefined || d30 === undefined) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const perDay = d30.perDay.map((p) => ({ label: p.day.slice(5), count: p.count }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Eye} label="Tampilan · 7 hari" value={d7.total} tone="brand" />
        <StatCard
          icon={Users}
          label="Pengunjung unik · 7 hari"
          value={d7.uniqueSessions}
          tone="sky"
        />
        <StatCard icon={Eye} label="Tampilan · 30 hari" value={d30.total} tone="violet" />
        <StatCard
          icon={Globe2}
          label="Negara teratas"
          value={d30.topCountries[0]?.key ?? "—"}
          tone="success"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Volume Kunjungan (30 hari)</CardTitle>
          <CardDescription>
            Tanpa cookie, tanpa IP tersimpan — beacon self-hosted. Geo (negara /
            kota) via geoip offline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {perDay.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={perDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
                  <XAxis
                    dataKey="label"
                    stroke="oklch(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="oklch(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(var(--card))",
                      border: "1px solid oklch(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "oklch(var(--foreground))" }}
                  />
                  <Bar dataKey="count" fill="oklch(var(--brand))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada data kunjungan.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <TopList icon={Eye} title="Halaman teratas · 7 hari" items={d7.topPaths} />
        <TopList icon={Globe2} title="Sumber rujukan · 7 hari" items={d7.topReferrers} />
        <TopList icon={Globe2} title="Negara teratas · 30 hari" items={d30.topCountries} />
        <TopList icon={MapPin} title="Kota teratas · 30 hari" items={d30.topCities} />
      </div>

      {(d7.capped || d30.capped) && (
        <p className="text-xs text-muted-foreground">
          ⚠ Batas 10.000 baris tercapai — angka mungkin under-count. Tambah
          agregasi harian jika trafik tumbuh.
        </p>
      )}
    </div>
  );
}

function TopList({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ElementType;
  title: string;
  items: Rank[];
}) {
  const max = items[0]?.count ?? 1;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="w-4 h-4 text-brand" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada data.</p>
        ) : (
          <ul className="space-y-2">
            {items.slice(0, 10).map((item, idx) => (
              <li key={`${item.key}-${idx}`} className="space-y-0.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{item.key}</span>
                  <span className="tabular-nums text-xs text-muted-foreground flex-shrink-0">
                    {item.count}×
                  </span>
                </div>
                <Progress value={(item.count / max) * 100} className="h-1.5" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
