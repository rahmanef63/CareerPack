"use client";

import {
  AlertCircle,
  Camera,
  Eye,
  FileText,
  Tag,
  Wrench,
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

export interface HeroProfileSnapshot {
  fullName: string;
  bio: string;
  targetRole: string;
  skills: string[];
}

export interface HeroTogglesCardProps extends SectionOverrides {
  bind: Bind;
  /** Override the toggle spec list — useful for opensource derivatives
   *  that want to hide a toggle or rename copy. */
  toggles?: ReadonlyArray<ToggleSpec>;
  noCard?: boolean;
  /** Profile data fed in from the parent — used to render an inline
   *  "Akan tampil: …" preview line under each toggle so users see
   *  exactly what will render before they enable it. Pass `undefined`
   *  to disable previews (e.g. on the public-derivative tab). */
  profile?: HeroProfileSnapshot;
}

interface PreviewBadge {
  text: string;
  warning: boolean;
}

function previewFor(
  key: ToggleSpec["key"],
  profile: HeroProfileSnapshot | undefined,
): PreviewBadge | null {
  if (!profile) return null;
  switch (key) {
    case "avatarShow":
      return profile.fullName
        ? { text: "Foto profil dari Profil Saya", warning: false }
        : { text: "Belum ada foto di Profil", warning: true };
    case "targetRoleShow":
      return profile.targetRole
        ? { text: profile.targetRole, warning: false }
        : { text: "Target role kosong di Profil", warning: true };
    case "bioShow": {
      const bio = profile.bio.trim();
      if (!bio) return { text: "Bio kosong di Profil", warning: true };
      const short = bio.length > 70 ? `${bio.slice(0, 70)}…` : bio;
      return { text: short, warning: false };
    }
    case "skillsShow": {
      if (profile.skills.length === 0)
        return { text: "Skills kosong di Profil", warning: true };
      const head = profile.skills.slice(0, 4).join(" · ");
      const rest =
        profile.skills.length > 4 ? ` +${profile.skills.length - 4}` : "";
      return { text: `${head}${rest}`, warning: false };
    }
    case "portfolioShow":
      return { text: "Diambil dari /dashboard/portfolio", warning: false };
  }
}

export function HeroTogglesCard({
  bind,
  toggles = DEFAULT_TOGGLES,
  title = "Tampilkan di hero",
  description = "Saklar opt-in untuk tiap kolom. Hanya yang dicentang yang dibagikan publik.",
  className,
  noCard = false,
  profile,
}: HeroTogglesCardProps) {
  const autoToggles = bind("autoToggles");
  const socialOn = Boolean(autoToggles.value.showSocial);

  const fields = (
    <div className="space-y-2">
      {toggles.map((t) => {
        const Icon = t.icon;
        const field = bind(t.key);
        const preview = previewFor(t.key, profile);
        return (
          <div
            key={t.key}
            className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-muted text-brand-muted-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
                {preview && (
                  <p
                    className={
                      preview.warning
                        ? "mt-1 inline-flex max-w-full items-start gap-1 text-[10px] text-amber-700 dark:text-amber-300"
                        : "mt-1 inline-flex max-w-full items-start gap-1 text-[10px] text-emerald-700 dark:text-emerald-300"
                    }
                  >
                    {preview.warning ? (
                      <AlertCircle className="mt-0.5 h-2.5 w-2.5 shrink-0" />
                    ) : (
                      <Eye className="mt-0.5 h-2.5 w-2.5 shrink-0" />
                    )}
                    <span className="truncate">
                      {preview.warning ? "" : "Akan tampil: "}
                      {preview.text}
                    </span>
                  </p>
                )}
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
      <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-muted text-brand-muted-foreground">
            <Share2 className="h-4 w-4" />
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium">Tombol sosial</p>
            <p className="text-xs text-muted-foreground">
              Baris ikon LinkedIn / Portfolio / Email di hero — diambil dari
              kontak publik.
            </p>
          </div>
        </div>
        <Switch
          checked={socialOn}
          onCheckedChange={(v) =>
            autoToggles.onChange({ ...autoToggles.value, showSocial: Boolean(v) })
          }
          aria-label="Tampilkan tombol sosial"
        />
      </div>
    </div>
  );

  if (noCard) return fields;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{fields}</CardContent>
    </Card>
  );
}
