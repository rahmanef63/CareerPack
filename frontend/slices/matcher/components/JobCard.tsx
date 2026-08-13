"use client";

import { Briefcase, ExternalLink, MapPin, Sparkles, Tag, Wallet } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { JobListing } from "../types";
import { CATEGORY_COLORS, CATEGORY_LABELS, WORK_MODE_LABELS } from "../types";
import { formatSalary, timeAgo } from "../lib/format";

interface JobCardProps {
  job: JobListing;
  score?: number;
  variant?: "list" | "carousel";
  onView: () => void;
}

export function JobCard({ job, score, variant = "list", onView }: JobCardProps) {
  const isCarousel = variant === "carousel";
  const isTopMatch = score !== undefined && score >= 80;
  const categoryLabel = job.category ? CATEGORY_LABELS[job.category] : undefined;
  const categoryColor = job.category
    ? CATEGORY_COLORS[job.category] ?? "bg-muted text-muted-foreground"
    : undefined;
  return (
    <article
      className={cn(
        // `min-w-0` so a long title can never widen the card past its
        // grid track — an `auto`-sized track would grow to max-content
        // and take the whole page sideways with it.
        "group relative flex h-full min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md",
        isTopMatch
          ? "border-brand/40 shadow-[0_0_0_1px_oklch(var(--brand)/0.15)] hover:shadow-cta"
          : "border-border",
        isCarousel && "w-full",
      )}
    >
      {isTopMatch && (
        <span className="absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-from to-brand-to px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-brand-foreground shadow-cta">
          <Sparkles className="h-3 w-3" />
          Paling Cocok
        </span>
      )}
      <header className="flex min-w-0 items-start gap-3">
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
        {score !== undefined && score > 0 && !isTopMatch && (
          <Badge className="shrink-0 gap-1 whitespace-nowrap bg-brand-muted text-brand-muted-foreground">
            <Sparkles className="h-3 w-3" />
            {score}% cocok
          </Badge>
        )}
        {isTopMatch && (
          <Badge className="shrink-0 gap-1 bg-brand text-brand-foreground">
            {score}%
          </Badge>
        )}
      </header>

      {(categoryLabel || job.seniority) && (
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {categoryLabel && (
            <Badge className={cn("max-w-full gap-1 truncate border-0", categoryColor)}>
              <Tag className="h-3 w-3 shrink-0" />
              {categoryLabel}
            </Badge>
          )}
          {job.seniority && (
            <Badge variant="outline" className="max-w-full truncate uppercase">
              {job.seniority}
            </Badge>
          )}
          {job.employmentType && job.employmentType !== "full-time" && (
            <Badge variant="outline" className="max-w-full truncate uppercase">
              {job.employmentType}
            </Badge>
          )}
        </div>
      )}

      <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex min-w-0 max-w-full items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{job.location}</span>
        </span>
        <span className="inline-flex min-w-0 max-w-full items-center gap-1">
          <Briefcase className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {WORK_MODE_LABELS[
              job.workMode as keyof typeof WORK_MODE_LABELS
            ] ?? job.workMode}
          </span>
        </span>
        <span className="inline-flex min-w-0 max-w-full items-center gap-1">
          <Wallet className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
          </span>
        </span>
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">
        {job.description}
      </p>

      {job.requiredSkills.length > 0 && (
        <div className="flex min-w-0 flex-wrap gap-1">
          {job.requiredSkills.slice(0, 4).map((s) => (
            <Badge key={s} variant="secondary" className="max-w-full truncate">
              {s}
            </Badge>
          ))}
          {job.requiredSkills.length > 4 && (
            <Badge variant="secondary" className="shrink-0">
              +{job.requiredSkills.length - 4}
            </Badge>
          )}
        </div>
      )}

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
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
