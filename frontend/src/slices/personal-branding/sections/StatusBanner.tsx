"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, ExternalLink, Globe } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export type StatusKind = "active" | "draft" | "empty";

export interface StatusBannerProps {
  status: StatusKind;
  url: string;
}

/**
 * Reads SERVER state, not local form state — so the banner always
 * shows ground truth ("page is actually published" vs "you haven't
 * saved yet"). The 404-vs-active confusion users hit before this
 * banner shipped came from confusing local toggle with server state.
 */
export function StatusBanner({ status, url }: StatusBannerProps) {
  if (status === "active") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-50 p-4 dark:bg-emerald-950/30">
        <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">
              Halaman aktif & dapat diakses publik
            </p>
            <p className="text-xs opacity-80">careerpack.org{url}</p>
          </div>
        </div>
        <Button asChild size="sm" variant="default" className="gap-2">
          <Link href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Buka halaman
          </Link>
        </Button>
      </div>
    );
  }
  if (status === "draft") {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-50 p-4 dark:bg-amber-950/30">
        <div className="flex items-start gap-3 text-amber-700 dark:text-amber-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              Halaman dalam draft — belum aktif
            </p>
            <p className="text-xs opacity-80">
              Slug sudah disimpan tapi belum diaktifkan. URL{" "}
              <code className="font-mono text-[10px]">
                careerpack.org{url}
              </code>{" "}
              masih 404. Klik &ldquo;Simpan & Publikasikan&rdquo; untuk
              membukanya.
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex items-start gap-3 text-muted-foreground">
        <Globe className="h-5 w-5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Belum ada halaman publik
          </p>
          <p className="text-xs">
            Pilih slug, atur kolom yang mau ditampilkan, lalu klik
            &ldquo;Simpan & Publikasikan&rdquo;. Mode Otomatis akan langsung
            merakit halaman dari CV + Portofolio yang sudah ada.
          </p>
        </div>
      </div>
    </div>
  );
}
