"use client";

import { useQuery } from "convex/react";
import { Activity, CheckCircle2, Clock, Target } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";

interface EfficacyRow {
  type: string;
  attempted: number;
  completed: number;
  completionRate: number;
  avgDaysToComplete: number | null;
}

const TYPE_LABELS: Record<string, string> = {
  study_skill: "Belajar skill",
  add_roadmap_node: "Tambah roadmap",
  tailor_cv: "Tailor CV",
  subscribe_listings: "Pantau lowongan",
  set_calendar_block: "Blok kalender",
  report_outcome: "Lapor hasil",
  prepare_documents: "Siapkan dokumen",
  generic: "Aksi umum",
};

function tone(rate: number): string {
  if (rate >= 0.7) return "text-emerald-600 dark:text-emerald-400";
  if (rate >= 0.4) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

/**
 * Per-action-type efficacy — user-scoped self-reflection panel.
 * Surfaces which action categories the user actually completes vs
 * abandons. Hidden until enough telemetry exists (≥3 attempts across
 * any type).
 */
export function ActionEfficacyCard() {
  const rows = useQuery(api.engine.plan.queries.myActionEfficacy, {}) as
    | EfficacyRow[]
    | undefined;

  if (!rows || rows.length === 0) return null;
  const totalAttempts = rows.reduce((s, r) => s + r.attempted, 0);
  if (totalAttempts < 3) return null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-brand" />
          Efikasi Aksi
          <Badge variant="outline" className="ml-1 text-[10px]">
            self-telemetry
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          Rasio penyelesaian per kategori aksi quest kamu. Engine pakai
          ini buat rekomendasi alokasi waktu — kategori dengan
          completion rate tinggi diprioritaskan di plan berikutnya.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((r) => {
          const pct = Math.round(r.completionRate * 100);
          const days = r.avgDaysToComplete;
          return (
            <div
              key={r.type}
              className="rounded-md border border-border bg-card/40 p-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  {TYPE_LABELS[r.type] ?? r.type}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground tabular-nums">
                  <span className="flex items-center gap-0.5">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {r.completed}/{r.attempted}
                  </span>
                  {days !== null && days >= 0 && (
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />~{days.toFixed(1)}d
                    </span>
                  )}
                  <span className={`font-semibold ${tone(r.completionRate)}`}>
                    {pct}%
                  </span>
                </div>
              </div>
              <Progress value={pct} className="mt-1.5 h-1" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
