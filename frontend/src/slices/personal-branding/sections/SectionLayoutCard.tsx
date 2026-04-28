"use client";

import { useMemo } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Layers } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { DEFAULT_SECTION_ORDER } from "../form/defaults";
import type { Bind } from "../form/types";

export interface SectionLayoutCardProps {
  bind: Bind;
  noCard?: boolean;
}

/**
 * Section layout card — lets the user reorder + toggle visibility of
 * each branding section. The hydrator reorders matching
 * `[data-cp-section]` siblings on the public page based on the
 * resulting `sectionOrder`.
 *
 * Visibility for `experience / education / certifications / languages
 * / projects` is wired through `autoToggles`; for `about / skills`
 * through `bioShow / skillsShow`. `contact` is always shown when at
 * least one channel is filled (no toggle).
 */
export function SectionLayoutCard({ bind, noCard = false }: SectionLayoutCardProps) {
  const order = bind("sectionOrder");
  const autoToggles = bind("autoToggles");
  const bioShow = bind("bioShow");
  const skillsShow = bind("skillsShow");

  // Resolved order — fall back to template default for keys the user
  // hasn't reordered yet. This keeps the UI stable even after schema
  // additions.
  const resolved = useMemo(() => {
    const known = new Set(DEFAULT_SECTION_ORDER.map((s) => s.key));
    const seen = new Set<string>();
    const out: string[] = [];
    for (const k of order.value) {
      if (!known.has(k) || seen.has(k)) continue;
      seen.add(k);
      out.push(k);
    }
    for (const s of DEFAULT_SECTION_ORDER) {
      if (!seen.has(s.key)) out.push(s.key);
    }
    return out;
  }, [order.value]);

  function move(idx: number, delta: -1 | 1) {
    const next = [...resolved];
    const target = idx + delta;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    order.onChange(next);
  }
  function reset() {
    order.onChange([]);
  }
  function isVisible(key: string): boolean {
    switch (key) {
      case "about":
        return bioShow.value;
      case "skills":
        return skillsShow.value;
      case "experience":
        return autoToggles.value.showExperience;
      case "education":
        return autoToggles.value.showEducation;
      case "certifications":
        return autoToggles.value.showCertifications;
      case "languages":
        return autoToggles.value.showLanguages;
      case "projects":
        return autoToggles.value.showProjects;
      case "contact":
      default:
        return true;
    }
  }
  function toggleVisible(key: string) {
    switch (key) {
      case "about":
        bioShow.onChange(!bioShow.value);
        return;
      case "skills":
        skillsShow.onChange(!skillsShow.value);
        return;
      case "experience":
        autoToggles.onChange({
          ...autoToggles.value,
          showExperience: !autoToggles.value.showExperience,
        });
        return;
      case "education":
        autoToggles.onChange({
          ...autoToggles.value,
          showEducation: !autoToggles.value.showEducation,
        });
        return;
      case "certifications":
        autoToggles.onChange({
          ...autoToggles.value,
          showCertifications: !autoToggles.value.showCertifications,
        });
        return;
      case "languages":
        autoToggles.onChange({
          ...autoToggles.value,
          showLanguages: !autoToggles.value.showLanguages,
        });
        return;
      case "projects":
        autoToggles.onChange({
          ...autoToggles.value,
          showProjects: !autoToggles.value.showProjects,
        });
        return;
    }
  }

  const labelMap = new Map(DEFAULT_SECTION_ORDER.map((s) => [s.key, s.label]));
  const isCustomOrder = order.value.length > 0;

  const fields = (
    <ol className="space-y-1.5">
      {resolved.map((key, idx) => {
        const label = labelMap.get(key) ?? key;
        const visible = isVisible(key);
        const isContact = key === "contact";
        return (
          <li
            key={key}
            className="flex items-center gap-1 rounded-md border border-border bg-muted/20 p-2 sm:gap-2"
          >
            <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">
              {idx + 1}
            </span>
            <span
              className={`min-w-0 flex-1 truncate text-sm font-medium ${visible ? "text-foreground" : "text-muted-foreground line-through"}`}
            >
              {label}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => toggleVisible(key)}
              disabled={isContact}
              aria-label={
                isContact
                  ? "Section kontak otomatis hidden saat tidak ada data"
                  : visible
                    ? `Sembunyikan section ${label}`
                    : `Tampilkan section ${label}`
              }
              className="h-7 w-7 shrink-0"
            >
              {visible ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 opacity-60" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => move(idx, -1)}
              disabled={idx === 0}
              aria-label={`Pindahkan ${label} ke atas`}
              className="h-7 w-7 shrink-0"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => move(idx, 1)}
              disabled={idx === resolved.length - 1}
              aria-label={`Pindahkan ${label} ke bawah`}
              className="h-7 w-7 shrink-0"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
          </li>
        );
      })}
    </ol>
  );

  if (noCard) {
    return (
      <div className="space-y-3">
        {isCustomOrder && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={reset}
              className="text-xs"
            >
              Reset urutan
            </Button>
          </div>
        )}
        {fields}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle as="h3" className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-brand" />
              Urutan & visibility section
            </CardTitle>
            <CardDescription>
              Tombol panah mengatur urutan section di halaman publik.
              Mata buka/tutup mengontrol apakah section ditampilkan.
            </CardDescription>
          </div>
          {isCustomOrder && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={reset}
              className="text-xs"
            >
              Reset urutan
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>{fields}</CardContent>
    </Card>
  );
}
