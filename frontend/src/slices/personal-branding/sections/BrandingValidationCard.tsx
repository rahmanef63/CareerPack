"use client";

import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import type { BrandingPayload } from "../themes";

export interface BrandingValidationCardProps {
  branding: BrandingPayload | undefined;
}

interface Row {
  label: string;
  ok: boolean;
  detail: string;
  source: string;
}

/**
 * Per-template field validation. Shows the user exactly which slots
 * the iframe templates will receive data for vs. which will fall back
 * to placeholders / hidden sections. Same payload the iframe
 * hydrator consumes — single source of truth.
 *
 * `source` tells the user *where* the data comes from so they can fix
 * the right form (CV, Profile, Personal Branding settings).
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

  const rows: Row[] = [
    {
      label: "Nama",
      ok: id.name.trim().length > 0,
      detail: id.name.trim() || "kosong",
      source: "Profil → Nama lengkap",
    },
    {
      label: "Headline",
      ok: id.headline.trim().length > 0,
      detail: id.headline.trim() || "kosong",
      source: "Personal Branding → Headline",
    },
    {
      label: "Target role",
      ok: id.targetRole.trim().length > 0,
      detail: id.targetRole.trim() || "kosong / toggle off",
      source: "Profil → Target role + toggle",
    },
    {
      label: "Lokasi",
      ok: id.location.trim().length > 0,
      detail: id.location.trim() || "kosong",
      source: "Profil → Lokasi",
    },
    {
      label: "Avatar",
      ok: Boolean(id.avatarUrl),
      detail: id.avatarUrl ? "terupload" : "belum upload / toggle off",
      source: "Profil → Avatar + toggle",
    },
    {
      label: "Bio",
      ok: branding.about.bio.trim().length > 0,
      detail: branding.about.bio.trim()
        ? `${branding.about.bio.length} karakter`
        : "kosong / toggle off",
      source: "Profil → Bio + toggle",
    },
    {
      label: "Summary CV",
      ok: branding.about.summary.trim().length > 0,
      detail: branding.about.summary.trim()
        ? `${branding.about.summary.length} karakter`
        : "kosong",
      source: "CV → Personal info → Summary",
    },
    {
      label: "Skills",
      ok: has.skills,
      detail: has.skills
        ? `${branding.skills.length} skill`
        : "belum ada data",
      source: "CV → Skills + Profil + toggle",
    },
    {
      label: "Pengalaman",
      ok: has.experience,
      detail: has.experience
        ? `${branding.experience.length} entri`
        : "belum ada data",
      source: "CV → Experience",
    },
    {
      label: "Pendidikan",
      ok: has.education,
      detail: has.education
        ? `${branding.education.length} entri`
        : "belum ada data",
      source: "CV → Education",
    },
    {
      label: "Sertifikasi",
      ok: has.certifications,
      detail: has.certifications
        ? `${branding.certifications.length} entri`
        : "belum ada data",
      source: "CV → Certifications",
    },
    {
      label: "Bahasa",
      ok: has.languages,
      detail: has.languages
        ? `${branding.languages.length} entri`
        : "belum ada data",
      source: "CV → Languages",
    },
    {
      label: "Proyek",
      ok: has.projects,
      detail: has.projects
        ? `${branding.projects.length} proyek`
        : "belum ada data",
      source: "Portofolio + CV → Projects",
    },
    {
      label: "Kontak",
      ok: has.contact,
      detail: [id.contact.email, id.contact.linkedin, id.contact.portfolio]
        .filter(Boolean)
        .join(" · ") || "belum ada data",
      source: "Personal Branding → Kontak",
    },
  ];

  const okCount = rows.filter((r) => r.ok).length;
  const total = rows.length;
  const pct = Math.round((okCount / total) * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4 text-brand" />
          Validasi Data Template
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {okCount}/{total} field terisi ({pct}%). Data yang sama dipakai
          semua template (Purple Glass, Editorial Cream, Premium Dark).
        </p>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {rows.map((r) => (
            <li
              key={r.label}
              className={cn(
                "flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs",
                r.ok
                  ? "border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20"
                  : "border-border bg-muted/30",
              )}
            >
              {r.ok ? (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-foreground">{r.label}</span>
                  <span
                    className={cn(
                      "shrink-0 truncate text-[10px]",
                      r.ok
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-muted-foreground",
                    )}
                  >
                    {r.detail}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Sumber: {r.source}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
