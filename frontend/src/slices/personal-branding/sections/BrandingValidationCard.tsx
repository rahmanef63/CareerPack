"use client";

import { CheckCircle2, AlertCircle, Info, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { cn } from "@/shared/lib/utils";
import type { BrandingPayload } from "../themes";

export interface BrandingValidationCardProps {
  branding: BrandingPayload | undefined;
}

type Severity = "required" | "recommended" | "optional";

interface RowScore {
  label: string;
  ok: boolean;
  detail: string;
  source: string;
  severity: Severity;
  /** Earned points out of `weight`. */
  earned: number;
  weight: number;
  /** Inline coach-style suggestion when not optimal. */
  hint?: string;
}

/**
 * Per-field validation + completeness score for the public branding
 * payload. Same shape the iframe hydrator consumes — single source of
 * truth.
 *
 * Each row carries:
 *  - severity (required > recommended > optional) → how badly it
 *    hurts the score when missing
 *  - explicit weight → contributes to a 0-100 score
 *  - hint → coaches the user toward "good enough" (e.g. "min 3
 *    proyek dengan gambar cover" instead of just "ada / belum")
 *
 * Templates differ in which sections they actually render (v3 has
 * education, v1/v2 currently don't), but the underlying payload is
 * shared — so the score reflects what visitors COULD see across all
 * templates, and we still surface the recommendation even if the
 * active template doesn't have a slot for it (encourages the user to
 * fill data once and reuse across templates).
 */
export function BrandingValidationCard({
  branding,
}: BrandingValidationCardProps) {
  if (!branding) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-muted-foreground" />
            Validasi Data Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Memuat data…</p>
        </CardContent>
      </Card>
    );
  }

  const id = branding.identity;
  const has = branding.has;

  // Helper: compute earned/weight for list-style fields where we want
  // a *recommended count* rather than a binary yes/no.
  function listScore(count: number, ideal: number, weight: number): number {
    if (count <= 0) return 0;
    if (count >= ideal) return weight;
    return Math.round((count / ideal) * weight);
  }

  const projectsWithImage = branding.projects.filter(
    (p) => Boolean(p.coverUrl) || Boolean(p.coverEmoji),
  ).length;
  const projectsCount = branding.projects.length;

  const rows: RowScore[] = [
    // ---- Required (heaviest weights) ----
    {
      label: "Nama lengkap",
      ok: id.name.trim().length > 0,
      detail: id.name.trim() || "kosong",
      source: "Profil → Nama lengkap",
      severity: "required",
      weight: 10,
      earned: id.name.trim().length > 0 ? 10 : 0,
      hint: id.name.trim() ? undefined : "Wajib — tanpa ini hero kosong",
    },
    {
      label: "Headline",
      ok: id.headline.trim().length >= 30,
      detail: id.headline.trim()
        ? `${id.headline.length} karakter`
        : "kosong",
      source: "Personal Branding → Headline",
      severity: "required",
      weight: 10,
      earned:
        id.headline.length === 0
          ? 0
          : id.headline.length >= 60
            ? 10
            : id.headline.length >= 30
              ? 7
              : 4,
      hint:
        id.headline.length < 30
          ? "Min 30 karakter — jelaskan value proposition + role target"
          : undefined,
    },
    {
      label: "Target role",
      ok: id.targetRole.trim().length > 0,
      detail: id.targetRole.trim() || "kosong / toggle off",
      source: "Profil → Target role + toggle",
      severity: "required",
      weight: 6,
      earned: id.targetRole.trim().length > 0 ? 6 : 0,
      hint: id.targetRole.trim()
        ? undefined
        : "Aktifkan toggle 'Tampilkan target role' + isi di Profil",
    },

    // ---- Recommended visuals ----
    {
      label: "Avatar / foto",
      ok: Boolean(id.avatarUrl),
      detail: id.avatarUrl ? "terupload" : "belum upload / toggle off",
      source: "Profil → Avatar + toggle",
      severity: "recommended",
      weight: 8,
      earned: id.avatarUrl ? 8 : 0,
      hint: id.avatarUrl
        ? undefined
        : "Foto profesional 1:1 atau 4:5 — meningkatkan trust 2-3x",
    },
    {
      label: "Bio singkat",
      ok: branding.about.bio.trim().length >= 80,
      detail: branding.about.bio.trim()
        ? `${branding.about.bio.length} karakter`
        : "kosong / toggle off",
      source: "Profil → Bio + toggle",
      severity: "recommended",
      weight: 5,
      earned:
        branding.about.bio.length === 0
          ? 0
          : branding.about.bio.length >= 200
            ? 5
            : branding.about.bio.length >= 80
              ? 3
              : 1,
      hint:
        branding.about.bio.length < 80
          ? "Idealnya 200-400 karakter, ceritakan sudut pandang unik"
          : undefined,
    },
    {
      label: "Summary CV",
      ok: branding.about.summary.trim().length >= 80,
      detail: branding.about.summary.trim()
        ? `${branding.about.summary.length} karakter`
        : "kosong",
      source: "CV → Personal info → Summary",
      severity: "recommended",
      weight: 4,
      earned:
        branding.about.summary.length === 0
          ? 0
          : branding.about.summary.length >= 150
            ? 4
            : 2,
      hint:
        branding.about.summary.length < 80
          ? "Minimal 80 karakter — tampil di seksi About"
          : undefined,
    },
    {
      label: "Lokasi",
      ok: id.location.trim().length > 0,
      detail: id.location.trim() || "kosong",
      source: "Profil → Lokasi",
      severity: "optional",
      weight: 2,
      earned: id.location.trim().length > 0 ? 2 : 0,
      hint: id.location.trim()
        ? undefined
        : "Kota/negara — recruiter sering filter berdasarkan lokasi",
    },

    // ---- Skills (count-based) ----
    {
      label: "Skills",
      ok: branding.skills.length >= 5,
      detail: has.skills ? `${branding.skills.length} skill` : "belum ada",
      source: "CV → Skills + Profil + toggle",
      severity: "recommended",
      weight: 8,
      earned: listScore(branding.skills.length, 8, 8),
      hint:
        branding.skills.length < 5
          ? "Minimal 5 skill, ideal 8+ — gabung dari CV + skill profil"
          : branding.skills.length < 8
            ? "Tambah lagi sampai 8+ untuk tampilan grid yang penuh"
            : undefined,
    },

    // ---- Experience (count + quality) ----
    {
      label: "Pengalaman",
      ok: branding.experience.length >= 2,
      detail: has.experience
        ? `${branding.experience.length} entri`
        : "belum ada",
      source: "CV → Experience",
      severity: "required",
      weight: 12,
      earned: listScore(branding.experience.length, 3, 12),
      hint:
        branding.experience.length === 0
          ? "Wajib min 1 — visitor menilai dari rentang karir"
          : branding.experience.length < 3
            ? "Idealnya 3 pengalaman, masing-masing dengan achievements"
            : undefined,
    },
    {
      label: "Achievements per pengalaman",
      ok:
        branding.experience.length === 0
          ? false
          : branding.experience.every((e) => e.achievements.length >= 2),
      detail:
        branding.experience.length === 0
          ? "—"
          : `${branding.experience.filter((e) => e.achievements.length >= 2).length}/${branding.experience.length} entri ≥2 bullet`,
      source: "CV → Experience → Achievements",
      severity: "recommended",
      weight: 5,
      earned:
        branding.experience.length === 0
          ? 0
          : Math.round(
              (branding.experience.filter((e) => e.achievements.length >= 2)
                .length /
                branding.experience.length) *
                5,
            ),
      hint:
        branding.experience.length === 0
          ? undefined
          : branding.experience.some((e) => e.achievements.length < 2)
            ? "Setiap role idealnya ada 2-4 bullet achievement (kuantitatif)"
            : undefined,
    },

    // ---- Projects (count + image quality) ----
    {
      label: "Proyek / portofolio",
      ok: projectsCount >= 3,
      detail: has.projects ? `${projectsCount} proyek` : "belum ada",
      source: "Portofolio + CV → Projects",
      severity: "required",
      weight: 12,
      earned: listScore(projectsCount, 3, 12),
      hint:
        projectsCount === 0
          ? "Wajib min 3 — visitor cari bukti kerja, bukan klaim"
          : projectsCount < 3
            ? `Tambah ${3 - projectsCount} proyek lagi untuk minimum yang direkomendasikan`
            : undefined,
    },
    {
      label: "Cover gambar proyek",
      ok: projectsCount > 0 && projectsWithImage >= Math.min(3, projectsCount),
      detail:
        projectsCount === 0
          ? "—"
          : `${projectsWithImage}/${projectsCount} ada cover`,
      source: "Portofolio → Cover (upload gambar atau emoji)",
      severity: "recommended",
      weight: 6,
      earned:
        projectsCount === 0
          ? 0
          : Math.round((projectsWithImage / projectsCount) * 6),
      hint:
        projectsCount === 0
          ? undefined
          : projectsWithImage < projectsCount
            ? "Upload cover image (lebih kuat) atau emoji untuk setiap proyek"
            : undefined,
    },

    // ---- Education / Cert / Lang (optional but credibility-building) ----
    {
      label: "Pendidikan",
      ok: branding.education.length >= 1,
      detail: has.education
        ? `${branding.education.length} entri`
        : "belum ada",
      source: "CV → Education",
      severity: "optional",
      weight: 3,
      earned: branding.education.length > 0 ? 3 : 0,
      hint:
        branding.education.length === 0
          ? "Min 1 entri — terutama untuk fresh grad / career switch"
          : undefined,
    },
    {
      label: "Sertifikasi",
      ok: branding.certifications.length >= 1,
      detail: has.certifications
        ? `${branding.certifications.length} entri`
        : "belum ada",
      source: "CV → Certifications",
      severity: "optional",
      weight: 3,
      earned: listScore(branding.certifications.length, 2, 3),
      hint:
        branding.certifications.length === 0
          ? "Tambah sertifikasi industri (AWS, GCP, Scrum, etc.)"
          : undefined,
    },
    {
      label: "Bahasa",
      ok: branding.languages.length >= 1,
      detail: has.languages
        ? `${branding.languages.length} entri`
        : "belum ada",
      source: "CV → Languages",
      severity: "optional",
      weight: 2,
      earned: branding.languages.length > 0 ? 2 : 0,
      hint:
        branding.languages.length === 0
          ? "Min 1 bahasa — penting untuk role yang serve cross-border"
          : undefined,
    },

    // ---- Contact (visitor-conversion) ----
    {
      label: "Email kontak",
      ok: id.contact.email.trim().length > 0,
      detail: id.contact.email.trim() || "belum",
      source: "Personal Branding → Email kontak",
      severity: "required",
      weight: 4,
      earned: id.contact.email.trim().length > 0 ? 4 : 0,
      hint: id.contact.email.trim()
        ? undefined
        : "Tanpa email, visitor tidak bisa kontak balik",
    },
    {
      label: "LinkedIn",
      ok: id.contact.linkedin.trim().length > 0,
      detail: id.contact.linkedin.trim() ? "tersedia" : "belum",
      source: "Personal Branding → LinkedIn URL",
      severity: "recommended",
      weight: 4,
      earned: id.contact.linkedin.trim().length > 0 ? 4 : 0,
      hint: id.contact.linkedin.trim()
        ? undefined
        : "URL LinkedIn — recruiter cek profil ini 90% dari waktu",
    },
    {
      label: "Portfolio URL",
      ok: id.contact.portfolio.trim().length > 0,
      detail: id.contact.portfolio.trim() ? "tersedia" : "belum",
      source: "Personal Branding → Portfolio URL",
      severity: "optional",
      weight: 2,
      earned: id.contact.portfolio.trim().length > 0 ? 2 : 0,
    },
  ];

  const totalEarned = rows.reduce((s, r) => s + r.earned, 0);
  const totalWeight = rows.reduce((s, r) => s + r.weight, 0);
  const score = Math.round((totalEarned / totalWeight) * 100);
  const grade =
    score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "E";
  const gradeColor =
    score >= 75
      ? "text-emerald-600 dark:text-emerald-400"
      : score >= 60
        ? "text-amber-600 dark:text-amber-400"
        : "text-rose-600 dark:text-rose-400";

  const requiredMissing = rows.filter(
    (r) => r.severity === "required" && r.earned < r.weight,
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-brand" />
              Validasi & Skor Kelengkapan
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Skor dipakai bersama untuk semua template (Purple Glass,
              Editorial Cream, Premium Dark). Ikuti rekomendasi untuk
              memaksimalkan kesan profesional.
            </p>
          </div>
          <div className="text-right">
            <div className={cn("text-3xl font-bold leading-none", gradeColor)}>
              {grade}
            </div>
            <div className="text-xs text-muted-foreground">{score}/100</div>
          </div>
        </div>
        <Progress value={score} className="mt-3 h-2" />
        {requiredMissing.length > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-50/50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <strong>{requiredMissing.length} field wajib</strong> belum
              terpenuhi:{" "}
              {requiredMissing.map((r) => r.label).join(", ")}.
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {rows.map((r) => {
            const partial = r.earned > 0 && r.earned < r.weight;
            const tone = r.earned >= r.weight ? "ok" : partial ? "partial" : "miss";
            return (
              <li
                key={r.label}
                className={cn(
                  "flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs",
                  tone === "ok"
                    ? "border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20"
                    : tone === "partial"
                      ? "border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20"
                      : "border-border bg-muted/30",
                )}
              >
                {tone === "ok" ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle
                    className={cn(
                      "mt-0.5 h-3.5 w-3.5 shrink-0",
                      tone === "partial"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground",
                    )}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {r.label}
                      {r.severity === "required" && (
                        <Badge
                          variant="outline"
                          className="ml-1.5 h-4 border-rose-500/40 px-1 py-0 text-[8px] uppercase text-rose-600 dark:text-rose-400"
                        >
                          wajib
                        </Badge>
                      )}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 truncate text-[10px]",
                        tone === "ok"
                          ? "text-emerald-700 dark:text-emerald-300"
                          : tone === "partial"
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-muted-foreground",
                      )}
                    >
                      {r.detail} · {r.earned}/{r.weight} pt
                    </span>
                  </div>
                  {r.hint && (
                    <p
                      className={cn(
                        "text-[10px]",
                        tone === "miss"
                          ? "text-muted-foreground"
                          : "text-amber-700 dark:text-amber-300",
                      )}
                    >
                      💡 {r.hint}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/70">
                    Sumber: {r.source}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
