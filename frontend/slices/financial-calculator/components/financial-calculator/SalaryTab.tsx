"use client";

import { TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  ResponsiveSelect as Select,
  ResponsiveSelectContent as SelectContent,
  ResponsiveSelectItem as SelectItem,
  ResponsiveSelectTrigger as SelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { cn } from "@/shared/lib/utils";
import { formatIDR, formatShortIDR } from "@/shared/lib/formatCurrency";
import { indonesianJobMarketData } from "@/shared/data/indonesianData";
import { useChartColors } from "../../hooks/useChartColors";

interface Props {
  targetPosition: string;
  setTargetPosition: (v: string) => void;
}

export function SalaryTab({ targetPosition, setTargetPosition }: Props) {
  const chartColors = useChartColors();
  const salaryData = indonesianJobMarketData.find((j) => j.position === targetPosition);

  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Pilih Posisi</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={targetPosition} onValueChange={setTargetPosition}>
            <SelectTrigger className="w-full max-w-md" />
            <SelectContent>
              {indonesianJobMarketData.map((job) => (
                <SelectItem key={job.position} value={job.position}>
                  {job.position}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {salaryData && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="border-border">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">Minimum</p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {formatIDR(salaryData.salaryRange.min)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">Median</p>
                  <p className="text-xl font-bold text-brand mt-1">
                    {formatIDR(salaryData.salaryRange.median)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">Maksimum</p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {formatIDR(salaryData.salaryRange.max)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Rentang Gaji</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { label: "Minimum", value: salaryData.salaryRange.min, fill: chartColors.barMin },
                        { label: "Median", value: salaryData.salaryRange.median, fill: chartColors.barMid },
                        { label: "Maksimum", value: salaryData.salaryRange.max, fill: chartColors.barMax },
                      ]}
                      margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridLine} vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke={chartColors.tickText}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke={chartColors.tickText}
                        fontSize={11}
                        tickFormatter={formatShortIDR}
                        tickLine={false}
                        axisLine={false}
                        width={56}
                      />
                      <Tooltip
                        cursor={{ fill: chartColors.cursorFill }}
                        formatter={(value: number) => [formatIDR(value), "Gaji"]}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {[
                          { fill: chartColors.barMin },
                          { fill: chartColors.barMid },
                          { fill: chartColors.barMax },
                        ].map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Skill Utama</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {salaryData.topSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-brand-muted text-brand">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Tren Pasar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    salaryData.demandTrend === "increasing" ? "bg-success/20" : "bg-warning/20",
                  )}>
                    <TrendingUp className={cn(
                      "w-6 h-6",
                      salaryData.demandTrend === "increasing" ? "text-success" : "text-warning",
                    )} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground capitalize">
                      {salaryData.demandTrend === "increasing" ? "Meningkat" : "Stabil"}
                    </p>
                    <p className="text-sm text-muted-foreground">Tren Permintaan</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
