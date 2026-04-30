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
      </div>
    </SectionCard>
  );
}
