"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { Globe, Loader2, MapPin, ScrollText, X } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { notify } from "@/shared/lib/notify";
import {
  CONTINENT_LABEL,
  type Continent,
  getCountryMeta,
  isDomestic,
} from "../lib/countryMeta";

interface TemplateSummary {
  _id: string;
  country: string;
  countryLabel: string;
  flag?: string;
  description?: string;
  documentCount: number;
  requiredCount: number;
}

interface TemplateDoc {
  id: string;
  title: string;
  description: string;
  category: string;
  required: boolean;
  issuingAuthority?: string;
  validityYears?: number;
}

interface TemplateFull {
  country: string;
  countryLabel: string;
  flag?: string;
  description?: string;
  documents: TemplateDoc[];
}

const ALL = "all" as const;

/**
 * Country template picker — overseas only.
 *
 * Lives inside the "Kerja Luar Negeri" tab. Surfaces the per-country
 * document master lists (Phase 2 seed) as a compact dropdown rather
 * than a card grid: scales cleanly as more countries get seeded,
 * keeps mobile layout tight, and pairs with continent + language
 * filters so users zero-in on relevant destinations fast.
 *
 * Domestic (Indonesia) is filtered out — the "Kerja Lokal" tab does
 * not need a country picker.
 */
export function CountryTemplatePicker() {
  const templates = useQuery(api.documents.queries.listTemplates, {}) as
    | TemplateSummary[]
    | undefined;
  const [continent, setContinent] = useState<Continent | typeof ALL>(ALL);
  const [language, setLanguage] = useState<string>(ALL);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [previewCountry, setPreviewCountry] = useState<string | null>(null);

  const overseas = useMemo<TemplateSummary[]>(
    () => (templates ?? []).filter((t) => !isDomestic(t.country)),
    [templates],
  );

  const continentOptions = useMemo<Array<{ value: Continent; label: string }>>(
    () => {
      const set = new Set<Continent>();
      overseas.forEach((t) => set.add(getCountryMeta(t.country).continent));
      return Array.from(set)
        .map((c) => ({ value: c, label: CONTINENT_LABEL[c] }))
        .sort((a, b) => a.label.localeCompare(b.label, "id"));
    },
    [overseas],
  );

  const languageOptions = useMemo<string[]>(() => {
    const set = new Set<string>();
    overseas.forEach((t) =>
      getCountryMeta(t.country).workLanguages.forEach((l) => set.add(l)),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
  }, [overseas]);

  const filtered = useMemo(() => {
    return overseas.filter((t) => {
      const meta = getCountryMeta(t.country);
      if (continent !== ALL && meta.continent !== continent) return false;
      if (language !== ALL && !meta.workLanguages.includes(language)) return false;
      return true;
    });
  }, [overseas, continent, language]);

  // Auto-reset the selected country if the filter combo no longer includes it.
  useEffect(() => {
    if (selectedCountry && !filtered.some((t) => t.country === selectedCountry)) {
      setSelectedCountry(null);
    }
  }, [filtered, selectedCountry]);

  // Deep-link from Quest "Jalankan" — open preview if ?country=<code>
  // matches a loaded template (and is overseas).
  const sp = useSearchParams();
  const appliedRef = useRef(false);
  useEffect(() => {
    if (appliedRef.current) return;
    if (templates === undefined) return;
    const country = sp?.get("country");
    if (
      country &&
      !isDomestic(country) &&
      templates.some((t) => t.country === country)
    ) {
      setSelectedCountry(country);
      setPreviewCountry(country);
      appliedRef.current = true;
    }
  }, [sp, templates]);

  const resetFilters = () => {
    setContinent(ALL);
    setLanguage(ALL);
  };
  const filtersActive = continent !== ALL || language !== ALL;

  const selectedSummary = filtered.find((t) => t.country === selectedCountry);

  return (
    <>
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-brand" />
            Template Dokumen per Negara
            <Badge variant="outline" className="ml-1 text-[10px]">
              engine seed
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Pilih negara tujuan kerja/migrasi — impor master list dokumen
            jadi checklist personal kamu. Progres item yang sudah selesai
            tetap dipertahankan saat re-import.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {templates === undefined ? (
            <div className="grid gap-2 sm:grid-cols-3">
              <Skeleton className="h-9 rounded-md" />
              <Skeleton className="h-9 rounded-md" />
              <Skeleton className="h-9 rounded-md" />
            </div>
          ) : overseas.length === 0 ? (
            <p className="rounded-md border border-dashed border-amber-300/50 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
              Template luar negeri belum di-seed. Admin perlu jalankan
              Engine Seed dulu di <code>/admin → Engine Seed</code>.
            </p>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_auto]">
                <FilterSelect
                  label="Benua"
                  placeholder="Semua benua"
                  value={continent}
                  onChange={(v) => setContinent(v as Continent | typeof ALL)}
                  options={continentOptions}
                />
                <FilterSelect
                  label="Bahasa kerja"
                  placeholder="Semua bahasa"
                  value={language}
                  onChange={setLanguage}
                  options={languageOptions.map((l) => ({ value: l, label: l }))}
                />
                <CountryDropdown
                  filtered={filtered}
                  value={selectedCountry}
                  onChange={setSelectedCountry}
                />
                {filtersActive && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="gap-1.5 self-end text-xs text-muted-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reset filter
                  </Button>
                )}
              </div>

              {filtered.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-center text-xs text-muted-foreground">
                  Tidak ada negara cocok dengan filter saat ini.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <Badge variant="outline" className="font-normal">
                    {filtered.length} negara cocok
                  </Badge>
                  {selectedSummary && (
                    <>
                      <span className="hidden sm:inline">·</span>
                      <span className="flex items-center gap-1">
                        <ScrollText className="h-3 w-3" />
                        {selectedSummary.documentCount} dokumen ·{" "}
                        {selectedSummary.requiredCount} wajib
                      </span>
                    </>
                  )}
                </div>
              )}

              {selectedSummary && (
                <Button
                  type="button"
                  onClick={() => setPreviewCountry(selectedSummary.country)}
                  className="w-full gap-2 bg-brand hover:bg-brand sm:w-auto"
                >
                  <ScrollText className="h-4 w-4" />
                  Preview &amp; Impor {selectedSummary.flag ?? "🌐"}{" "}
                  {selectedSummary.countryLabel}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <TemplatePreviewDialog
        country={previewCountry}
        onClose={() => setPreviewCountry(null)}
      />
    </>
  );
}

interface FilterSelectProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}

function FilterSelect({
  label,
  placeholder,
  value,
  onChange,
  options,
}: FilterSelectProps) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <ResponsiveSelect value={value} onValueChange={onChange}>
        <ResponsiveSelectTrigger placeholder={placeholder} className="h-9 text-sm" />
        <ResponsiveSelectContent drawerTitle={label}>
          <ResponsiveSelectItem value={ALL}>{placeholder}</ResponsiveSelectItem>
          {options.map((opt) => (
            <ResponsiveSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </ResponsiveSelectItem>
          ))}
        </ResponsiveSelectContent>
      </ResponsiveSelect>
    </div>
  );
}

interface CountryDropdownProps {
  filtered: ReadonlyArray<TemplateSummary>;
  value: string | null;
  onChange: (code: string) => void;
}

function CountryDropdown({ filtered, value, onChange }: CountryDropdownProps) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Negara
      </label>
      <ResponsiveSelect
        value={value ?? undefined}
        onValueChange={onChange}
        disabled={filtered.length === 0}
      >
        <ResponsiveSelectTrigger
          placeholder={
            filtered.length === 0 ? "Tidak ada negara" : "Pilih negara tujuan…"
          }
          className="h-9 text-sm"
        />
        <ResponsiveSelectContent drawerTitle="Pilih negara">
          {filtered.map((t) => (
            <ResponsiveSelectItem key={t._id} value={t.country}>
              <span className="inline-flex items-center gap-2">
                <span>{t.flag ?? "🌐"}</span>
                <span>{t.countryLabel}</span>
                <span className="text-[10px] text-muted-foreground">
                  · {t.documentCount} dok
                </span>
              </span>
            </ResponsiveSelectItem>
          ))}
        </ResponsiveSelectContent>
      </ResponsiveSelect>
    </div>
  );
}

interface PreviewDialogProps {
  country: string | null;
  onClose: () => void;
}

function TemplatePreviewDialog({ country, onClose }: PreviewDialogProps) {
  const template = useQuery(
    api.documents.queries.getTemplateByCountry,
    country ? { country } : "skip",
  ) as TemplateFull | null | undefined;
  const instantiate = useMutation(
    api.documents.mutations.instantiateFromTemplate,
  );
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!country) return;
    setImporting(true);
    try {
      const r = await instantiate({ country });
      notify.success(
        `${r.inserted} dokumen baru diimpor · ${r.preserved} status lama dipertahankan`,
      );
      onClose();
    } catch (err) {
      notify.fromError(err, "Gagal impor template");
    } finally {
      setImporting(false);
    }
  };

  return (
    <ResponsiveDialog open={country !== null} onOpenChange={(o) => !o && onClose()}>
      <ResponsiveDialogContent size="2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{template?.flag ?? "🌐"}</span>
            <span>{template?.countryLabel ?? "Template Negara"}</span>
            {template && (
              <Badge variant="outline" className="ml-1 text-[10px]">
                {template.documents.length} dokumen
              </Badge>
            )}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {template?.description ??
              "Daftar dokumen master untuk negara ini. Impor untuk membuat checklist personal."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="max-h-[60dvh] space-y-1.5 overflow-y-auto pr-1">
          {!template ? (
            <Skeleton className="h-32 w-full rounded-lg" />
          ) : (
            template.documents.map((d) => (
              <div
                key={d.id}
                className="rounded-md border border-border bg-card p-2.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold">{d.title}</div>
                  {d.required ? (
                    <Badge variant="destructive" className="shrink-0 text-[9px]">
                      Wajib
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 text-[9px]">
                      Opsional
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {d.description}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Badge variant="outline" className="text-[9px]">
                    {d.category}
                  </Badge>
                  {d.issuingAuthority && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      {d.issuingAuthority}
                    </span>
                  )}
                  {d.validityYears !== undefined && (
                    <span>· Berlaku {d.validityYears} thn</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <ResponsiveDialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Tutup
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={importing || !template}
            className="gap-2 bg-brand hover:bg-brand"
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Mengimpor…
              </>
            ) : (
              <>Impor ke Checklist Saya</>
            )}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
