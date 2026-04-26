"use client";

import { AlertTriangle, Lightbulb, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { cn } from "@/shared/lib/utils";

interface Breakdown {
  keywordCoverage: number;
  hardSkills: number;
  experienceFit: number;
  sectionCompleteness: number;
  parseability: number;
}

interface ATSResultCardProps {
  score: number;
  grade: string;
  breakdown: Breakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  formatIssues: string[];
  recommendations: string[];
  jobTitle?: string;
  jobCompany?: string;
}

const DIMENSIONS: Array<{
  key: keyof Breakdown;
  label: string;
  max: number;
}> = [
  { key: "keywordCoverage", label: "Cakupan keyword", max: 35 },
  { key: "hardSkills", label: "Skill wajib", max: 25 },
  { key: "experienceFit", label: "Kesesuaian pengalaman", max: 15 },
  { key: "sectionCompleteness", label: "Kelengkapan bagian", max: 15 },
  { key: "parseability", label: "Keterbacaan ATS", max: 10 },
];

function gradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40";
    case "B":
      return "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-500/40";
    case "C":
      return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-500/40";
    case "D":
      return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-500/40";
    case "F":
    default:
      return "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-500/40";
  }
}

function gradeLabel(grade: string): string {
  switch (grade) {
    case "A":
      return "Sangat baik";
    case "B":
      return "Baik";
    case "C":
      return "Cukup";
    case "D":
      return "Kurang";
    case "F":
    default:
      return "Lemah";
  }
}

export function ATSResultCard({
  score,
  grade,
  breakdown,
  matchedKeywords,
  missingKeywords,
  formatIssues,
  recommendations,
  jobTitle,
  jobCompany,
}: ATSResultCardProps) {
  return (
    <div className="space-y-5">
      {/* Headline */}
      <div className={cn("rounded-xl border p-5", gradeColor(grade))}>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-current bg-card text-3xl font-bold">
            {score}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">Grade {grade}</span>
              <span className="text-sm opacity-80">— {gradeLabel(grade)}</span>
            </div>
            {jobTitle && (
              <p className="mt-1 text-sm opacity-90 truncate">
                {jobTitle}
                {jobCompany ? ` · ${jobCompany}` : ""}
              </p>
            )}
            <p className="mt-1 text-xs opacity-75">
              Skor ini estimasi internal — bukan emulasi parser ATS spesifik.
              Pakai sebagai panduan, bukan jaminan.
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold">Detil per dimensi</h3>
        <div className="space-y-3">
          {DIMENSIONS.map((d) => {
            const value = breakdown[d.key];
            const pct = Math.round((value / d.max) * 100);
            return (
              <div key={d.key}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="font-mono font-semibold">
                    {value} / {d.max}
                  </span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Matched / missing chips */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Sudah cocok ({matchedKeywords.length})
          </div>
          {matchedKeywords.length === 0 ? (
            <p className="text-xs text-muted-foreground">Belum ada keyword yang cocok.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {matchedKeywords.map((k) => (
                <Badge
                  key={k}
                  variant="outline"
                  className="border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  {k}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
            <XCircle className="h-4 w-4" />
            Perlu ditambah ({missingKeywords.length})
          </div>
          {missingKeywords.length === 0 ? (
            <p className="text-xs text-muted-foreground">Hebat — semua keyword tercakup.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {missingKeywords.map((k) => (
                <Badge
                  key={k}
                  variant="outline"
                  className="border-rose-500/40 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  {k}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Format issues */}
      {formatIssues.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-50 p-4 dark:bg-amber-950/30">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" /> Catatan keterbacaan
          </div>
          <ul className="ml-5 list-disc space-y-1 text-sm text-amber-800 dark:text-amber-200">
            {formatIssues.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="rounded-xl border border-sky-500/40 bg-sky-50 p-4 dark:bg-sky-950/30">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-sky-300">
            <Lightbulb className="h-4 w-4" /> Rekomendasi
          </div>
          <ul className="ml-5 list-disc space-y-1.5 text-sm text-sky-900 dark:text-sky-200">
            {recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
