"use client";

import {
  CheckCircle2,
  Briefcase,
  GraduationCap,
  Award,
  FolderKanban,
  Share2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Switch } from "@/shared/components/ui/switch";
import type { AutoToggles } from "../../../../../convex/profile/autoBlocks";

interface Props {
  toggles: AutoToggles;
  onChange: (next: AutoToggles) => void;
  noCard?: boolean;
}

const SECTIONS: ReadonlyArray<{
  key: keyof AutoToggles;
  label: string;
  description: string;
  icon: typeof Briefcase;
}> = [
  {
    key: "showExperience",
    label: "Pengalaman kerja",
    description: "Diambil otomatis dari CV — semua entry pengalaman.",
    icon: Briefcase,
  },
  {
    key: "showEducation",
    label: "Pendidikan",
    description: "Riwayat pendidikan dari CV (universitas, jurusan, periode).",
    icon: GraduationCap,
  },
  {
    key: "showCertifications",
    label: "Sertifikasi",
    description: "Sertifikat profesional dari CV.",
    icon: Award,
  },
  {
    key: "showProjects",
    label: "Proyek (CV)",
    description: "Bagian proyek di CV — tampil sebagai tombol jika ada link.",
    icon: FolderKanban,
  },
  {
    key: "showSocial",
    label: "Tombol sosial",
    description: "Baris ikon: LinkedIn, Portfolio, Email — dari Pengaturan.",
    icon: Share2,
  },
];

/**
 * Otomatis mode — tidak ada block authoring. User cukup pilih
 * tema, atur header background, lalu nyalakan/matikan section yang
 * mau ditampilkan. Konten ditarik server-side dari CV + Profil +
 * Portofolio yang sudah ada.
 *
 * Dirancang untuk user tanpa basic skill: zero coding, zero block
 * editing, halaman jadi dalam < 1 menit.
 */
export function AutoModePanel({ toggles, onChange, noCard = false }: Props) {
  const set = (key: keyof AutoToggles, value: boolean) => {
    onChange({ ...toggles, [key]: value });
  };

  const fields = (
    <div className="space-y-2">
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        const checked = Boolean(toggles[s.key]);
        return (
          <div
            key={s.key}
            className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-muted text-brand-muted-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            </div>
            <Switch
              checked={checked}
              onCheckedChange={(v) => set(s.key, v)}
              aria-label={`Tampilkan ${s.label}`}
            />
          </div>
        );
      })}
      <p className="pt-2 text-xs text-muted-foreground">
        Tip: untuk menampilkan <strong>Foto profil</strong>, <strong>Bio</strong>,{" "}
        <strong>Keterampilan</strong>, atau <strong>Portofolio</strong>,
        aktifkan switch-nya di card <em>Tampilkan di hero</em>.
      </p>
    </div>
  );

  if (noCard) return fields;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Mode Otomatis
        </CardTitle>
        <CardDescription>
          Halaman publik dirakit otomatis dari CV, Profil, dan Portofolio
          Anda. Kalau Anda update CV nanti, halaman ini ikut update — tanpa
          harus edit manual.
        </CardDescription>
      </CardHeader>
      <CardContent>{fields}</CardContent>
    </Card>
  );
}
