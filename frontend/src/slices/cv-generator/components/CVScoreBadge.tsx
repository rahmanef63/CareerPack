"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { AnimatedProgress, ConfettiBurst } from "@/shared/components/MicroInteractions";
import type { CVData } from "../types";

interface CVScoreBadgeProps {
  cvData: CVData;
}

const MILESTONES = [50, 75, 100];

export function CVScoreBadge({ cvData }: CVScoreBadgeProps) {
  const score = computeScore(cvData);
  const tier = score >= 85 ? "Sangat Baik" : score >= 65 ? "Bagus" : score >= 40 ? "Cukup" : "Perlu Ditingkatkan";
  const tierColor =
    score >= 85
      ? "text-emerald-600"
      : score >= 65
      ? "text-career-600"
      : score >= 40
      ? "text-amber-600"
      : "text-slate-500";

  const [confettiKey, setConfettiKey] = useState(0);
  const passedMilestone = useRef<number>(0);
  useEffect(() => {
    const reached = MILESTONES.find((m) => score >= m && passedMilestone.current < m);
    if (reached) {
      passedMilestone.current = reached;
      setConfettiKey((k) => k + 1);
    }
  }, [score]);

  const tips = getTips(cvData);

  return (
    <>
      <Card className="border-border bg-gradient-to-br from-career-50 to-background dark:from-career-900/20">
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-career-500 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Skor CV (AI)</p>
                <p className={`text-2xl font-bold ${tierColor}`}>{score}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${tierColor}`}>{tier}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                <TrendingUp className="w-3 h-3" /> dari 100
              </p>
            </div>
          </div>

          <AnimatedProgress value={score} />

          {tips.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-1 pt-1">
              {tips.slice(0, 3).map((t, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-career-600">•</span> {t}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <ConfettiBurst trigger={confettiKey} />
    </>
  );
}

export function computeScore(cv: CVData): number {
  const profileFields = Object.values(cv.profile).filter((v) => v && String(v).trim() !== "").length;
  const profileScore = Math.min(40, profileFields * 5); // up to 40
  const expScore = Math.min(25, cv.experience.length * 8 + cv.experience.filter((e) => e.description.length > 50).length * 4);
  const eduScore = Math.min(15, cv.education.length * 7);
  const skillScore = Math.min(15, cv.skills.length * 2);
  const projectScore = Math.min(5, cv.projects.length * 2);
  return Math.min(100, profileScore + expScore + eduScore + skillScore + projectScore);
}

function getTips(cv: CVData): string[] {
  const tips: string[] = [];
  if (!cv.profile.summary || cv.profile.summary.length < 50)
    tips.push("Tambahkan ringkasan profesional minimal 50 karakter.");
  if (cv.experience.length === 0) tips.push("Tambahkan minimal 1 pengalaman kerja atau proyek.");
  else if (cv.experience.some((e) => e.description.length < 50))
    tips.push("Perpanjang deskripsi pengalaman dengan pencapaian terukur.");
  if (cv.skills.length < 5) tips.push("Tambahkan lebih banyak skill (target 5+).");
  if (cv.projects.length === 0) tips.push("Sertakan 1-2 proyek untuk menunjukkan portofolio.");
  return tips;
}
