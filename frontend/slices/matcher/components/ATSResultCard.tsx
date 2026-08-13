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

/**
 * Semantic tokens, not raw emerald/sky/amber/orange/rose: those render
 * identically under every preset and each needed a hand-written `dark:`
 * twin to stay legible. `--success`/`--info`/`--warning`/`--destructive`
 * already carry audited light+dark values, and `--destructive` tracks the
 * active preset. D and F share the destructive hue — the five bands stay
 * distinguishable by fill strength, and the grade letter plus its label
 * ("Kurang" / "Lemah") carry the exact step either way.
 * A/B/C take the `-text` prose tones, not the fill tones: the letter and its
 * label are words on a tinted surface, where plain `--success` measures
 * 2.28:1 and `--info` 2.72:1 against their own /10 tint. D/F stay on
 * `--destructive`, which has no `-text` sibling yet.
 */
function gradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "text-success-text bg-success/10 border-success/40";
    case "B":
      return "text-info-text bg-info/10 border-info/40";
    case "C":
      return "text-warning-text bg-warning/10 border-warning/40";
    case "D":
      return "text-destructive-text bg-destructive/5 border-destructive/30";
    case "F":
    default:
      return "text-destructive-text bg-destructive/15 border-destructive/50";
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-success-text">
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
                  className="border-success/40 bg-success/10 text-success-text"
                >
                  {k}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
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
                  className="border-destructive/40 bg-destructive/10 text-destructive-text"
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
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-warning-text">
            <AlertTriangle className="h-4 w-4" /> Catatan keterbacaan
          </div>
          <ul className="ml-5 list-disc space-y-1 text-sm text-warning-text">
            {formatIssues.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="rounded-xl border border-info/40 bg-info/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-info-text">
            <Lightbulb className="h-4 w-4" /> Rekomendasi
          </div>
          <ul className="ml-5 list-disc space-y-1.5 text-sm text-foreground">
            {recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
