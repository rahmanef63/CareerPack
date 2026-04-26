"use client";

import {
  Camera,
  FileText,
  Tag,
  Wrench,
  FolderKanban,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Switch } from "@/shared/components/ui/switch";
import type { Bind, FieldKey, SectionOverrides } from "../form/types";

interface ToggleSpec {
  key: Extract<
    FieldKey,
    "avatarShow" | "bioShow" | "skillsShow" | "targetRoleShow" | "portfolioShow"
  >;
  label: string;
  description: string;
  icon: typeof Camera;
}

const DEFAULT_TOGGLES: ReadonlyArray<ToggleSpec> = [
  {
    key: "avatarShow",
    label: "Foto profil",
    description: "Pakai avatar dari Profil Saya di hero halaman.",
    icon: Camera,
  },
  {
    key: "targetRoleShow",
    label: "Target role",
    description: "Tag bawah nama, contoh: Frontend Engineer.",
    icon: Tag,
  },
  {
    key: "bioShow",
    label: "Bio",
    description:
      "Mode Otomatis: bio tampil sebagai blok 'Tentang'. Mode Manual: kontrol bio lewat block paragraph.",
    icon: FileText,
  },
  {
    key: "skillsShow",
    label: "Keterampilan",
    description: "Daftar skill dari Profil Saya.",
    icon: Wrench,
  },
  {
    key: "portfolioShow",
    label: "Portofolio",
    description:
      "Item Portofolio jadi grid (mode Otomatis) atau di bawah blok (legacy).",
    icon: FolderKanban,
  },
];

export interface HeroTogglesCardProps extends SectionOverrides {
  bind: Bind;
  /** Override the toggle spec list — useful for opensource derivatives
   *  that want to hide a toggle or rename copy. */
  toggles?: ReadonlyArray<ToggleSpec>;
}

export function HeroTogglesCard({
  bind,
  toggles = DEFAULT_TOGGLES,
  title = "Tampilkan di hero",
  description = "Saklar opt-in untuk tiap kolom. Hanya yang dicentang yang dibagikan publik.",
  className,
}: HeroTogglesCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {toggles.map((t) => {
          const Icon = t.icon;
          const field = bind(t.key);
          return (
            <div
              key={t.key}
              className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-muted text-brand-muted-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.description}
                  </p>
                </div>
              </div>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label={`Tampilkan ${t.label}`}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
