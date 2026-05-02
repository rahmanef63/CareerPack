"use client";

import { Briefcase, ExternalLink, MapPin, Sparkles, Tag, Wallet } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { JobListing } from "../types";
import { CATEGORY_COLORS, CATEGORY_LABELS, WORK_MODE_LABELS } from "../types";

function formatSalary(min?: number, max?: number, currency = "IDR"): string {
  if (!min && !max) return "Gaji dinegosiasikan";
  const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}jt` : `${n.toLocaleString()}`;
  if (min && max) return `${currency} ${fmt(min)}–${fmt(max)}`;
  return `${currency} ${fmt((min ?? max) as number)}`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return "Hari ini";
  if (diff < 2 * day) return "Kemarin";
  if (diff < 7 * day) return `${Math.floor(diff / day)}h`;
  return `${Math.floor(diff / (7 * day))}mg`;
}

interface JobCardProps {
  job: JobListing;
  score?: number;
  variant?: "list" | "carousel";
  onView: () => void;
}

export function JobCard({ job, score, variant = "list", onView }: JobCardProps) {
  const isCarousel = variant === "carousel";
  const categoryLabel = job.category ? CATEGORY_LABELS[job.category] : undefined;
  const categoryColor = job.category
    ? CATEGORY_COLORS[job.category] ?? "bg-muted text-muted-foreground"
    : undefined;
  return (
    <article
      className={cn(
        "flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md",
        isCarousel && "w-full",
      )}
    >
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-muted text-xl">
          {job.companyLogo ?? "🏢"}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 font-semibold text-foreground">
            {job.title}
          </h3>
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {job.company}
          </p>
        </div>
        {score !== undefined && score > 0 && (
          <Badge className="gap-1 bg-brand-muted text-brand">
            <Sparkles className="h-3 w-3" />
            {score}% cocok
          </Badge>
        )}
      </header>

      {(categoryLabel || job.seniority) && (
        <div className="flex flex-wrap gap-1.5">
          {categoryLabel && (
            <Badge className={cn("gap-1 border-0 text-[10px]", categoryColor)}>
              <Tag className="h-3 w-3" />
              {categoryLabel}
            </Badge>
          )}
          {job.seniority && (
            <Badge variant="outline" className="text-[10px] uppercase">
              {job.seniority}
            </Badge>
          )}
          {job.employmentType && job.employmentType !== "full-time" && (
            <Badge variant="outline" className="text-[10px] uppercase">
              {job.employmentType}
            </Badge>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {job.location}
        </span>
        <span className="inline-flex items-center gap-1">
          <Briefcase className="h-3 w-3" />
          {WORK_MODE_LABELS[
            job.workMode as keyof typeof WORK_MODE_LABELS
          ] ?? job.workMode}
        </span>
        <span className="inline-flex items-center gap-1">
          <Wallet className="h-3 w-3" />
          {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
        </span>
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">
        {job.description}
      </p>

      {job.requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.requiredSkills.slice(0, 4).map((s) => (
            <Badge key={s} variant="secondary" className="text-[10px]">
              {s}
            </Badge>
          ))}
          {job.requiredSkills.length > 4 && (
            <Badge variant="secondary" className="text-[10px]">
              +{job.requiredSkills.length - 4}
            </Badge>
          )}
        </div>
      )}

      <footer className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-muted-foreground">{timeAgo(job.postedAt)}</span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onView}>
            Detail
          </Button>
          {job.applyUrl && (
            <Button asChild size="sm" className="gap-1">
              <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />
                Lamar
              </a>
            </Button>
          )}
        </div>
      </footer>
    </article>
  );
}
