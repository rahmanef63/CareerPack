"use client";

import { useState, type ReactNode } from "react";
import {
  Briefcase,
  Calendar,
  ExternalLink,
  FileText,
  MapPin,
  ScanText,
  Tag,
  Wallet,
} from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { CoverLetterDialog } from "./CoverLetterDialog";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import { cn } from "@/shared/lib/utils";

import type { JobListing } from "../types";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  WORK_MODE_LABELS,
} from "../types";
import { formatPostedDate, formatSalary, timeAgo } from "../lib/format";

interface JobDetailDialogProps {
  job: JobListing | null;
  onOpenChange: (open: boolean) => void;
  onScanATS: (job: JobListing) => void;
}

const SOURCE_LABELS: Record<string, string> = {
  "user-paste": "Tambahan kamu",
  wwr: "WeWorkRemotely",
  remoteok: "RemoteOK",
  seed: "Demo",
};

export function JobDetailDialog({ job, onOpenChange, onScanATS }: JobDetailDialogProps) {
  const [coverLetterOpen, setCoverLetterOpen] = useState(false);
  return (
    <ResponsiveDialog open={!!job} onOpenChange={(o) => !o && onOpenChange(false)}>
      <ResponsiveDialogContent size="2xl">
        {job && (
          <>
            <ResponsiveDialogHeader>
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl",
                    job.category && CATEGORY_COLORS[job.category]
                      ? CATEGORY_COLORS[job.category]
                      : "bg-brand-muted",
                  )}
                >
                  {job.companyLogo ?? "🏢"}
                </div>
                <div className="min-w-0 flex-1">
                  <ResponsiveDialogTitle>{job.title}</ResponsiveDialogTitle>
                  <ResponsiveDialogDescription>
                    {job.company} · {job.location}
                  </ResponsiveDialogDescription>
                </div>
              </div>
            </ResponsiveDialogHeader>

            <div className="space-y-4 py-2 text-sm">
              {/* Meta pill row */}
              <div className="flex flex-wrap gap-1.5">
                {job.category && CATEGORY_LABELS[job.category] && (
                  <Badge
                    className={cn(
                      "gap-1 border-0 text-[10px]",
                      CATEGORY_COLORS[job.category] ??
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    <Tag className="h-3 w-3" />
                    {CATEGORY_LABELS[job.category]}
                  </Badge>
                )}
                {job.seniority && (
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {job.seniority}
                  </Badge>
                )}
                {job.employmentType && (
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {job.employmentType}
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <Briefcase className="h-3 w-3" />
                  {WORK_MODE_LABELS[
                    job.workMode as keyof typeof WORK_MODE_LABELS
                  ] ?? job.workMode}
                </Badge>
                {job.source && SOURCE_LABELS[job.source] && (
                  <Badge variant="secondary" className="text-[10px]">
                    {SOURCE_LABELS[job.source]}
                  </Badge>
                )}
              </div>

              {/* Quick facts row */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Wallet className="h-3 w-3" />
                  {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                </span>
                <span
                  className="inline-flex items-center gap-1"
                  title={formatPostedDate(job.postedAt)}
                >
                  <Calendar className="h-3 w-3" />
                  Diposting {timeAgo(job.postedAt)}
                </span>
              </div>

              {/* Description */}
              {job.description && (
                <section className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Deskripsi
                  </h4>
                  <div className="max-h-[50vh] space-y-3 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4 leading-relaxed">
                    {formatJobDescription(job.description)}
                  </div>
                </section>
              )}

              {/* Skills */}
              {job.requiredSkills.length > 0 && (
                <section className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Skill dibutuhkan
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredSkills.map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <ResponsiveDialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Tutup
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCoverLetterOpen(true)}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Cover Letter
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onScanATS(job)}
                className="gap-2"
              >
                <ScanText className="h-4 w-4" />
                Cek ATS
              </Button>
              {job.applyUrl && (
                <Button asChild className="gap-2">
                  <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Lamar di {job.company}
                  </a>
                </Button>
              )}
            </ResponsiveDialogFooter>
          </>
        )}
      </ResponsiveDialogContent>
      <CoverLetterDialog
        job={job}
        open={coverLetterOpen}
        onOpenChange={setCoverLetterOpen}
      />
    </ResponsiveDialog>
  );
}

/**
 * Re-introduce structure to a description that came through stripHtml.
 * Original RSS bodies use `<strong>Headquarters:</strong>` → after
 * stripping it's all run-on text. We re-inject paragraph breaks before
 * Title-Case label segments ("Headquarters:", "Minimum Requirements:")
 * and render label-prefixed paragraphs with a bolded heading.
 */
function formatJobDescription(text: string): ReactNode {
  if (!text.trim()) return null;
  const labelRe = /\s+([A-Z][A-Za-z][A-Za-z &/-]{2,40}:)\s+/g;
  const withBreaks = text.replace(labelRe, "\n\n$1 ");
  const paragraphs = withBreaks
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return paragraphs.map((para, i) => {
    const labelMatch = para.match(/^([A-Z][A-Za-z][A-Za-z &/-]{2,40}):\s*([\s\S]*)$/);
    if (labelMatch) {
      const [, label, rest] = labelMatch;
      return (
        <div key={i} className="space-y-1">
          <h5 className="font-semibold text-foreground">{label}</h5>
          {rest && <p className="text-muted-foreground">{rest}</p>}
        </div>
      );
    }
    return (
      <p key={i} className="text-muted-foreground">
        {para}
      </p>
    );
  });
}
