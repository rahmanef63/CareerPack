"use client";

import { Sparkles } from "lucide-react";
import { Label } from "@/shared/components/ui/label";
import { ResponsiveCarousel } from "@/shared/components/ui/responsive-carousel";
import { CV_TEMPLATES } from "../../../constants";
import type { CVData, CVTemplateId } from "../../../types";
import { SectionCard } from "../SectionCard";
import { PrefToggle, TemplatePickerCard } from "../TemplatePicker";

interface Props {
  cvData: CVData;
  isOpen: boolean;
  onToggle: () => void;
  updatePref: <K extends keyof CVData['displayPrefs']>(
    key: K, value: CVData['displayPrefs'][K],
  ) => void;
}

export function DisplayPrefsSection({ cvData, isOpen, onToggle, updatePref }: Props) {
  return (
    <SectionCard title="Tampilan & Template" icon={Sparkles} isOpen={isOpen} onToggle={onToggle}>
      <div className="space-y-5">
        <div>
          <Label className="text-sm">Template</Label>
          <p className="text-xs text-muted-foreground mb-3">
            Geser untuk melihat semua · ketuk untuk memilih.
          </p>
          {/* Mobile/tablet (<md): swipe carousel; desktop: 3-col grid. */}
          <div className="md:hidden -mx-1">
            <ResponsiveCarousel
              cellWidth="w-[78%]"
              cellClassName="first:pl-1 last:pr-1"
              hideControls
            >
              {CV_TEMPLATES.map((tmpl) => (
                <TemplatePickerCard
                  key={tmpl.id}
                  tmpl={tmpl}
                  active={cvData.displayPrefs.templateId === tmpl.id}
                  onSelect={() => updatePref('templateId', tmpl.id as CVTemplateId)}
                />
              ))}
            </ResponsiveCarousel>
          </div>
          <div className="hidden md:grid grid-cols-3 gap-3">
            {CV_TEMPLATES.map((tmpl) => (
              <TemplatePickerCard
                key={tmpl.id}
                tmpl={tmpl}
                active={cvData.displayPrefs.templateId === tmpl.id}
                onSelect={() => updatePref('templateId', tmpl.id as CVTemplateId)}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <PrefToggle
            label="Tampilkan foto"
            description="Konvensi Indonesia. Sembunyikan untuk lamaran luar negeri."
            checked={cvData.displayPrefs.showPicture}
            onChange={(v) => updatePref('showPicture', v)}
          />
          <PrefToggle
            label="Tampilkan usia"
            description="Direkomendasikan untuk Indonesia. Wajib isi tanggal lahir."
            checked={cvData.displayPrefs.showAge}
            onChange={(v) => updatePref('showAge', v)}
          />
          <PrefToggle
            label="Tampilkan tahun kelulusan"
            description="Standar di Indonesia. Hilangkan untuk anti-bias usia di luar negeri."
            checked={cvData.displayPrefs.showGraduationYear}
            onChange={(v) => updatePref('showGraduationYear', v)}
          />
        </div>

        <div>
          <Label className="text-sm">Warna Aksen</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Pilih warna untuk heading, garis, dan band header template.
            Kosongkan untuk pakai bawaan template.
          </p>
          <AccentColorPicker
            value={cvData.displayPrefs.accentColor}
            onChange={(v) => updatePref('accentColor', v)}
          />
        </div>
      </div>
    </SectionCard>
  );
}

const ACCENT_SWATCHES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "#0d4f3c", label: "Hijau Eksekutif" },
  { value: "#1d4ed8", label: "Biru Korporat" },
  { value: "#7c3aed", label: "Ungu Tech" },
  { value: "#dc2626", label: "Merah Bold" },
  { value: "#ea580c", label: "Oranye Hangat" },
  { value: "#0f766e", label: "Tosca" },
  { value: "#1f2937", label: "Hitam Klasik" },
];

function AccentColorPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (next: string | undefined) => void;
}) {
  const current = value?.toLowerCase();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(undefined)}
        aria-pressed={!current}
        className={`h-8 rounded-md border px-2.5 text-[11px] transition-colors ${
          !current
            ? "border-brand bg-brand-muted/30 text-foreground"
            : "border-border text-muted-foreground hover:text-foreground"
        }`}
        title="Pakai warna bawaan template"
      >
        Auto
      </button>
      {ACCENT_SWATCHES.map((sw) => {
        const active = current === sw.value.toLowerCase();
        return (
          <button
            key={sw.value}
            type="button"
            onClick={() => onChange(sw.value)}
            aria-pressed={active}
            aria-label={sw.label}
            title={sw.label}
            className={`relative h-8 w-8 rounded-md border transition-transform ${
              active
                ? "ring-2 ring-offset-2 ring-offset-background border-foreground scale-105"
                : "border-border hover:scale-105"
            }`}
            style={{ background: sw.value }}
          />
        );
      })}
      <label className="ml-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span>Custom:</span>
        <input
          type="color"
          value={current ?? "#1d4ed8"}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent p-0.5"
          aria-label="Pilih warna aksen kustom"
        />
      </label>
    </div>
  );
}
