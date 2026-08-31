"use client";

import { Gauge, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { AnimatedProgress } from "@/shared/components/interactions/MicroInteractions";
import type { CVData } from "../types";

interface CVScoreBadgeProps {
  cvData: CVData;
}

export function CVScoreBadge({ cvData }: CVScoreBadgeProps) {
  const score = computeScore(cvData);
  const tier = score >= 85 ? "Sangat Baik" : score >= 65 ? "Bagus" : score >= 40 ? "Cukup" : "Perlu Ditingkatkan";
  const tierColor =
    score >= 85
      ? "text-success-text"
      : score >= 65
      ? "text-brand"
      : score >= 40
      ? "text-warning"
      : "text-muted-foreground";

  const tips = getTips(cvData);

  return (
    <Card className="border-border bg-gradient-to-br from-brand-muted to-background dark:from-brand-from/20">
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-brand text-brand-foreground flex items-center justify-center">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Skor Kelengkapan CV</p>
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
                  <span className="text-brand">•</span> {t}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
    </Card>
  );
}

// Deterministic heuristic — NOT an AI call. Weights loosely follow common
// ATS-scoring criteria (keyword/contact completeness, quantified impact,
// section coverage) researched 2026-08-31. Components sum to 100.
export function computeScore(cv: CVData): number {
  // Info kontak — nama, email, telepon, lokasi, dan tautan (LinkedIn/portfolio)
  // wajib lengkap agar parser ATS bisa mengekstrak data pelamar dengan benar.
  const contactFields = [
    cv.profile.name,
    cv.profile.email,
    cv.profile.phone,
    cv.profile.location,
    cv.profile.linkedin || cv.profile.portfolio,
  ];
  const contactScore = Math.min(15, contactFields.filter((v) => v && String(v).trim() !== "").length * 3);

  // Ringkasan profesional — rekruter men-scan 6 detik pertama; 200-500
  // karakter dianggap panjang ideal (lihat placeholder di PersonalInfoSection).
  const summaryLen = cv.profile.summary?.trim().length || 0;
  const summaryScore = summaryLen >= 200 && summaryLen <= 500 ? 10 : summaryLen >= 50 ? 6 : summaryLen > 0 ? 3 : 0;

  // Pengalaman kerja — kehadiran entri + kedalaman deskripsi per entri.
  const expPresenceScore = Math.min(15, cv.experience.length * 8);
  const expDepthScore = Math.min(10, cv.experience.filter((e) => e.description.length > 50).length * 5);
  const expScore = Math.min(25, expPresenceScore + expDepthScore);

  const eduScore = Math.min(10, cv.education.length * 5);
  const skillScore = Math.min(15, cv.skills.length * 2);
  const certScore = Math.min(10, cv.certifications.length * 5);
  const projectScore = Math.min(5, cv.projects.length * 2);

  // Pencapaian terukur — bullet dengan angka/persentase ("meningkatkan
  // penjualan 20%") jauh lebih meyakinkan bagi rekruter & lolos parsing ATS
  // dibanding klaim kualitatif ("bertanggung jawab atas ...").
  const quantifiedCount = cv.experience.filter((e) => /\d/.test(e.description)).length;
  const quantifiedScore = cv.experience.length > 0
    ? Math.min(10, Math.round((quantifiedCount / cv.experience.length) * 10))
    : 0;

  return Math.min(
    100,
    contactScore + summaryScore + expScore + eduScore + skillScore + certScore + projectScore + quantifiedScore,
  );
}

function getTips(cv: CVData): string[] {
  const tips: string[] = [];
  if (!cv.profile.summary || cv.profile.summary.length < 50)
    tips.push("Tambahkan ringkasan profesional minimal 50 karakter.");
  if (cv.experience.length === 0) tips.push("Tambahkan minimal 1 pengalaman kerja atau proyek.");
  else if (cv.experience.some((e) => e.description.length < 50))
    tips.push("Perpanjang deskripsi pengalaman dengan pencapaian terukur.");
  else if (cv.experience.some((e) => !/\d/.test(e.description)))
    tips.push("Tambahkan angka/persentase pada pencapaian (cth. \"menaikkan penjualan 20%\") agar lebih meyakinkan.");
  if (cv.skills.length < 5) tips.push("Tambahkan lebih banyak skill (target 5+).");
  if (cv.certifications.length === 0) tips.push("Sertakan sertifikasi relevan jika ada untuk memperkuat kredibilitas.");
  if (cv.projects.length === 0) tips.push("Sertakan 1-2 proyek untuk menunjukkan portofolio.");
  return tips;
}
