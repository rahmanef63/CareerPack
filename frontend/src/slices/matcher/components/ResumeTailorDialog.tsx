"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
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

import type { JobListing } from "../types";

interface ResumeTailorDialogProps {
  job: JobListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BulletChange {
  index: number;
  before: string;
  after: string;
  changed: boolean;
}

interface ExperienceSuggestion {
  experienceId: string;
  role: string;
  company: string;
  changes: BulletChange[];
}

interface SuggestionResult {
  jobMeta: string;
  experiences: ExperienceSuggestion[];
}

export function ResumeTailorDialog({ job, open, onOpenChange }: ResumeTailorDialogProps) {
  const cvs = useQuery(api.cv.queries.getUserCVs);
  const tailor = useAction(api.cv.actions.tailorCVForJob);
  const updateCV = useMutation(api.cv.mutations.updateCV);

  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<SuggestionResult | null>(null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  const cv = cvs && cvs.length > 0 ? cvs[0] : null;

  const reset = () => {
    setResult(null);
    setAccepted(new Set());
    setGenerating(false);
    setApplying(false);
  };

  const handleGenerate = async () => {
    if (!job) return;
    setGenerating(true);
    setResult(null);
    setAccepted(new Set());
    try {
      const res = await tailor({ jobListingId: job._id });
      setResult(res);
      // Pre-select all changed bullets — user can deselect.
      const init = new Set<string>();
      for (const exp of res.experiences) {
        for (const c of exp.changes) {
          if (c.changed) init.add(`${exp.experienceId}::${c.index}`);
        }
      }
      setAccepted(init);
      const total = res.experiences.reduce((s, e) => s + e.changes.filter((c) => c.changed).length, 0);
      notify.success(`${total} saran tailor siap — review lalu apply`);
    } catch (err) {
      notify.fromError(err, "Gagal generate suggestion");
    } finally {
      setGenerating(false);
    }
  };

  const toggleAccept = (key: string) => {
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleApply = async () => {
    if (!cv || !result) return;
    setApplying(true);
    try {
      // Merge accepted rewrites into the CV experience array.
      const expById = new Map(result.experiences.map((e) => [e.experienceId, e]));
      const nextExperience = cv.experience.map((exp) => {
        const sugg = expById.get(exp.id);
        if (!sugg) return exp;
        const newAchievements = exp.achievements.map((orig, idx) => {
          const key = `${exp.id}::${idx}`;
          const change = sugg.changes.find((c) => c.index === idx);
          if (!change) return orig;
          return accepted.has(key) ? change.after : orig;
        });
        return { ...exp, achievements: newAchievements };
      });

      await updateCV({
        cvId: cv._id as Id<"cvs">,
        updates: { experience: nextExperience },
      });
      notify.success("CV ter-update — cek di CV Generator");
      onOpenChange(false);
      setTimeout(reset, 300);
    } catch (err) {
      notify.fromError(err, "Gagal apply rewrite");
    } finally {
      setApplying(false);
    }
  };

  const totalChanges = result
    ? result.experiences.reduce((s, e) => s + e.changes.filter((c) => c.changed).length, 0)
    : 0;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onOpenChange(false);
          setTimeout(reset, 300);
        } else onOpenChange(true);
      }}
    >
      <ResponsiveDialogContent size="3xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <WandSparkles className="h-5 w-5 text-brand" />
            Resume Tailor
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {job
              ? `AI tulis ulang bullet pengalaman kamu agar match dengan ${job.title} · ${job.company}. Hanya bullet yang plausibel — tidak ada fakta yang dikarang.`
              : "Pilih lowongan dulu untuk tailor CV."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4">
          {!cv && cvs !== undefined && (
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Buat CV dulu di CV Generator sebelum tailor.
            </div>
          )}

          {cv && !result && !generating && (
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={!job}
              className="w-full gap-2 bg-brand hover:bg-brand"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate Saran Tailor</span>
            </Button>
          )}

          {generating && (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <p className="text-center text-xs text-muted-foreground">
                AI menulis ulang ~10-30 detik…
              </p>
            </div>
          )}

          {result && (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  {totalChanges} bullet bisa diperbaiki ·{" "}
                  <span className="font-medium text-foreground">{accepted.size}</span> dipilih
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  className="gap-1.5"
                  disabled={generating}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
              </div>

              <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
                {result.experiences.map((exp) => {
                  const changedBullets = exp.changes.filter((c) => c.changed);
                  if (changedBullets.length === 0) return null;
                  return (
                    <section
                      key={exp.experienceId}
                      className="rounded-lg border border-border bg-card p-4"
                    >
                      <header className="mb-3">
                        <h4 className="text-sm font-semibold">
                          {exp.role}
                          <span className="font-normal text-muted-foreground"> @ {exp.company}</span>
                        </h4>
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          {changedBullets.length} saran
                        </Badge>
                      </header>
                      <ul className="space-y-3">
                        {changedBullets.map((c) => {
                          const key = `${exp.experienceId}::${c.index}`;
                          const checked = accepted.has(key);
                          return (
                            <li key={key} className="flex gap-3">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => toggleAccept(key)}
                                className="mt-1"
                                aria-label={`Apply rewrite ${c.index + 1}`}
                              />
                              <div className="min-w-0 flex-1 space-y-1.5 text-xs leading-relaxed">
                                <div className="rounded-md bg-rose-500/5 px-2.5 py-1.5 line-through decoration-rose-500/40">
                                  <span className="font-medium text-rose-700 dark:text-rose-300">Sebelum:</span>{" "}
                                  <span className="text-muted-foreground">{c.before || "—"}</span>
                                </div>
                                <div className="flex items-start gap-1 text-muted-foreground">
                                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
                                </div>
                                <div
                                  className={cn(
                                    "rounded-md px-2.5 py-1.5",
                                    checked
                                      ? "bg-emerald-500/10 text-foreground"
                                      : "bg-muted/40 text-muted-foreground",
                                  )}
                                >
                                  <span className="font-medium text-emerald-700 dark:text-emerald-300">
                                    Sesudah:
                                  </span>{" "}
                                  {c.after}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <ResponsiveDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setTimeout(reset, 300);
            }}
          >
            Tutup
          </Button>
          {result && accepted.size > 0 && (
            <Button
              type="button"
              onClick={handleApply}
              disabled={applying}
              className="gap-2 bg-brand hover:bg-brand"
            >
              {applying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menerapkan…</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Apply {accepted.size} Rewrite</span>
                </>
              )}
            </Button>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
