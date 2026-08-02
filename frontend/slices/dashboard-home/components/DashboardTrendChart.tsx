"use client";

import Link from "next/link";
import { TrendingUp, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

/**
 * Weekly applications trend chart — extracted so the parent
 * DashboardHome chunk doesn't statically import recharts (~100 kB gz).
 * Parent lazy-imports this module via `next/dynamic(..., { ssr: false })`
 * with a skeleton fallback, so recharts only downloads after the
 * above-the-fold KPI strip + hero paint.
 */

const CHART_CONFIG = {
  lamaran: { label: "Lamaran", color: "var(--chart-sky)" },
  wawancara: { label: "Wawancara", color: "var(--chart-violet)" },
} satisfies ChartConfig;

export interface TrendDatum {
  name: string;
  lamaran: number;
  wawancara: number;
}

export interface DashboardTrendChartProps {
  data: ReadonlyArray<TrendDatum>;
  totalApplications: number;
}

export default function DashboardTrendChart({
  data,
  totalApplications,
}: DashboardTrendChartProps) {
  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>Tren Lamaran 8 Minggu</CardTitle>
        <CardDescription>
          Volume lamaran mingguan dan yang dipanggil wawancara.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalApplications === 0 ? (
          <div className="flex h-[260px] flex-col items-center justify-center gap-3 text-center">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Belum ada data tren
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Tambah lamaran pertama untuk mulai melihat grafik
                mingguan di sini.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/dashboard/applications">
                <Plus className="h-4 w-4 mr-1" /> Tambah lamaran
              </Link>
            </Button>
          </div>
        ) : (
          <ChartContainer
            config={CHART_CONFIG}
            className="aspect-auto h-[260px] w-full"
          >
            <AreaChart
              data={data as TrendDatum[]}
              margin={{ top: 8, left: 0, right: 8 }}
            >
              <defs>
                <linearGradient id="fill-lamaran" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-lamaran)"
                    stopOpacity={0.5}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-lamaran)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
                <linearGradient id="fill-wawancara" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-wawancara)"
                    stopOpacity={0.5}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-wawancara)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                className="stroke-border"
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={24}
                fontSize={11}
                domain={[0, (dataMax: number) => Math.max(dataMax, 3)]}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="lamaran"
                type="monotone"
                stroke="var(--color-lamaran)"
                fill="url(#fill-lamaran)"
                stackId="a"
              />
              <Area
                dataKey="wawancara"
                type="monotone"
                stroke="var(--color-wawancara)"
                fill="url(#fill-wawancara)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
