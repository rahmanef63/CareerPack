"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Globe, Loader2, MapPin, ScrollText } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
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
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import { notify } from "@/shared/lib/notify";

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

/**
 * Country template picker — surfaces the per-country document
 * master lists (Phase 2 seed) as a one-click "import to my
 * checklist" flow. Preserves prior completion state when re-running
 * the same country, so users can layer templates without resetting
 * their progress.
 */
export function CountryTemplateCard() {
  const templates = useQuery(api.documents.queries.listTemplates, {}) as
    | TemplateSummary[]
    | undefined;
  const [previewCountry, setPreviewCountry] = useState<string | null>(null);

  return (
    <>
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-brand" />
            Template Dokumen per Negara
            <Badge variant="outline" className="ml-1 text-[10px]">
              engine seed
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Pilih negara tujuan kerja/migrasi — impor master list dokumen
            yang dibutuhkan jadi checklist personal kamu. Progres item
            yang sudah selesai tetap dipertahankan saat re-import.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!templates ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-md" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <p className="rounded-md border border-dashed border-amber-300/50 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
              Template belum di-seed. Admin perlu jalankan Engine Seed
              dulu di <code>/admin → Engine Seed</code>.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {templates.map((t) => (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => setPreviewCountry(t.country)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-md border border-border bg-card p-3 text-left transition-colors",
                    "hover:border-brand/50 hover:bg-brand/5",
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">{t.flag ?? "🌐"}</span>
                    <span className="text-xs font-semibold">
                      {t.countryLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <ScrollText className="h-3 w-3" />
                    {t.documentCount} dok · {t.requiredCount} wajib
                  </div>
                </button>
              ))}
            </div>
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
