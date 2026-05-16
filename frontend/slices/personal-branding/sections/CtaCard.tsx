"use client";

import {
  Calendar,
  Download as DownloadIcon,
  ExternalLink,
  Mail,
  MousePointerClick,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { FIELD_LIMITS_PB } from "../form/defaults";
import type { Bind, CtaType } from "../form/types";

export interface CtaCardProps {
  bind: Bind;
  noCard?: boolean;
}

const TYPE_OPTIONS: ReadonlyArray<{
  value: CtaType;
  label: string;
  hint: string;
  placeholder: string;
}> = [
  {
    value: "link",
    label: "Link biasa",
    hint: "Halaman web (booking, form, dll).",
    placeholder: "https://example.com/hire-me",
  },
  {
    value: "calendly",
    label: "Booking (Calendly / Cal.com)",
    hint: "Auto-redirect ke kalender booking.",
    placeholder: "https://calendly.com/your-handle/intro",
  },
  {
    value: "email",
    label: "Email langsung",
    hint: "mailto: prefix otomatis ditambah.",
    placeholder: "you@example.com",
  },
  {
    value: "download",
    label: "Download (PDF / CV)",
    hint: "Link langsung ke file (CV PDF, deck).",
    placeholder: "https://your-site.com/cv.pdf",
  },
];

const TYPE_ICON: Record<CtaType, typeof Mail> = {
  link: ExternalLink,
  email: Mail,
  calendly: Calendar,
  download: DownloadIcon,
};

/**
 * Primary CTA card — renders a button in the public-page hero that
 * funnels visitor intent (book a call, send email, download CV).
 * Stronger than just listing contact links because it says exactly
 * what action the user wants the visitor to take.
 */
export function CtaCard({ bind, noCard = false }: CtaCardProps) {
  const label = bind("ctaLabel");
  const url = bind("ctaUrl");
  const type = bind("ctaType");
  const labelLen = label.value.length;
  const labelOver = labelLen > FIELD_LIMITS_PB.ctaLabelMax;

  const selected =
    TYPE_OPTIONS.find((o) => o.value === type.value) ?? TYPE_OPTIONS[0];
  const Icon = TYPE_ICON[type.value];

  const fields = (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tipe</Label>
          <Select
            value={type.value}
            onValueChange={(v) => type.onChange(v as CtaType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label
            htmlFor="pb-cta-label"
            className="text-xs text-muted-foreground"
          >
            Label tombol
          </Label>
          <Input
            id="pb-cta-label"
            value={label.value}
            onChange={(e) => label.onChange(e.target.value)}
            placeholder="Booking 30 menit gratis"
            maxLength={FIELD_LIMITS_PB.ctaLabelMax}
          />
          <p
            className={`text-[10px] ${labelOver ? "text-rose-600" : "text-muted-foreground"}`}
          >
            {labelLen}/{FIELD_LIMITS_PB.ctaLabelMax} karakter
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label
          htmlFor="pb-cta-url"
          className="text-xs text-muted-foreground"
        >
          URL atau email
        </Label>
        <Input
          id="pb-cta-url"
          value={url.value}
          onChange={(e) => url.onChange(e.target.value)}
          placeholder={selected.placeholder}
          type={type.value === "email" ? "email" : "url"}
          inputMode={type.value === "email" ? "email" : "url"}
        />
        <p className="text-[10px] text-muted-foreground">{selected.hint}</p>
      </div>
      {label.value && url.value && (
        <div className="overflow-hidden rounded-md border border-border bg-muted/30 p-3">
          <p className="mb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            Pratinjau
          </p>
          <button
            type="button"
            className="inline-flex max-w-full items-center gap-2 truncate rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
            onClick={(e) => e.preventDefault()}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label.value}</span>
          </button>
        </div>
      )}
    </div>
  );

  if (noCard) return fields;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle as="h3" className="flex items-center gap-2 text-base">
          <MousePointerClick className="h-4 w-4 text-brand" />
          Tombol utama (CTA)
        </CardTitle>
        <CardDescription>
          Satu aksi paling penting yang Anda mau pengunjung lakukan.
          Rendered sebagai tombol primer di hero halaman publik.
          Kosongkan jika belum mau pasang.
        </CardDescription>
      </CardHeader>
      <CardContent>{fields}</CardContent>
    </Card>
  );
}
