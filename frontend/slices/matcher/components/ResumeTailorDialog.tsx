"use client";

import { useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
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
import { makeIdempotencyKey } from "@/shared/lib/idempotencyKey";
import { useTruthLedger } from "@/shared/hooks/useTruthLedger";

import type { JobListing } from "../types";

interface ResumeTailorDialogProps {
  job: JobListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LedgerRewrite {
  atomId: Id<"truthAtoms">;
  type: string;
  sourceRef?: string;
  original: string;
  rewritten: string;
  accepted: boolean;
  violations: string[];
  changed: boolean;
}

interface LedgerRewriteResult {
  jobMeta: string;
  rewrites: LedgerRewrite[];
  atomCount: number;
  changedCount: number;
  acceptedCount: number;
}

const EXP_ACHIEVEMENT_RE = /^experience:([^:]+):achievement:(\d+)$/;

interface ParsedExperienceRef {
  kind: "experience-achievement";
  expId: string;
  idx: number;
}

function parseExpAchievementRef(ref: string | undefined): ParsedExperienceRef | null {
  if (!ref) return null;
  const m = EXP_ACHIEVEMENT_RE.exec(ref);
  if (!m) return null;
  return { kind: "experience-achievement", expId: m[1], idx: Number(m[2]) };
}

export function ResumeTailorDialog({ job, open, onOpenChange }: ResumeTailorDialogProps) {
  const cvs = useQuery(api.cv.queries.getUserCVs);
  const rewriteAction = useAction(api.cv.actions.rewriteFromLedger);
  const updateCV = useMutation(api.cv.mutations.updateCV);

  const cv = cvs && cvs.length > 0 ? cvs[0] : null;
  const ledger = useTruthLedger(cv?._id ?? null);

  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<LedgerRewriteResult | null>(null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  const reset = () => {
    setResult(null);
    setAccepted(new Set());
    setGenerating(false);
    setApplying(false);
  };

  const handleSeed = async () => {
    if (!cv) return;
    setSeeding(true);
    try {
      const r = await ledger.seed();
      notify.success(
        r.inserted > 0
          ? `Fakta CV tersimpan: ${r.inserted} baru, ${r.skipped} sudah ada`
          : "Semua fakta CV sudah tersimpan",
      );
    } catch (err) {
      notify.fromError(err, "Gagal menyimpan fakta CV");
    } finally {
      setSeeding(false);
    }
  };

  const handleGenerate = async () => {
    if (!job || !cv) return;
    setGenerating(true);
    setResult(null);
    setAccepted(new Set());
    try {
      const res = (await rewriteAction({
        cvId: cv._id as Id<"cvs">,
        jobListingId: job._id,
        idempotencyKey: makeIdempotencyKey("ledger-rewrite", [
          job._id,
          cv._id,
        ]),
      })) as LedgerRewriteResult;
      setResult(res);

      // Auto-select all changed AND accepted (validator-passed) rewrites.
      const init = new Set<string>();
      for (const r of res.rewrites) {
        if (r.changed && r.accepted) init.add(r.atomId);
      }
      setAccepted(init);
      notify.success(
        `${res.acceptedCount}/${res.changedCount} saran lolos validator — periksa lalu terapkan`,
      );
    } catch (err) {
      notify.fromError(err, "Gagal generate saran");
    } finally {
      setGenerating(false);
    }
  };

  const toggleAccept = (atomId: string) => {
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(atomId)) next.delete(atomId);
      else next.add(atomId);
      return next;
    });
  };

  const handleApply = async () => {
    if (!cv || !result) return;
    setApplying(true);
    try {
      // Group rewrites by experience id → achievement index → new text.
      const expPatches = new Map<string, Map<number, { newText: string; atomId: Id<"truthAtoms"> }>>();
      const orphanAccepted: LedgerRewrite[] = [];

      for (const r of result.rewrites) {
        if (!accepted.has(r.atomId)) continue;
        if (!r.changed) continue;
        const parsed = parseExpAchievementRef(r.sourceRef);
        if (parsed) {
          if (!expPatches.has(parsed.expId)) expPatches.set(parsed.expId, new Map());
          expPatches.get(parsed.expId)!.set(parsed.idx, {
            newText: r.rewritten,
            atomId: r.atomId,
          });
        } else {
          orphanAccepted.push(r);
        }
      }

      const nextExperience = cv.experience.map((exp) => {
        const patches = expPatches.get(exp.id);
        if (!patches) return exp;
        const newAchievements = exp.achievements.map((orig, idx) => {
          const patch = patches.get(idx);
          return patch ? patch.newText : orig;
        });
        return { ...exp, achievements: newAchievements };
      });

      await updateCV({
        cvId: cv._id as Id<"cvs">,
        updates: { experience: nextExperience },
      });

      // Supersede the atoms whose text we just rewrote — keeps the
      // ledger in sync with the CV body. Best-effort; CV save is the
      // load-bearing write.
      for (const [, patches] of expPatches) {
        for (const [, { atomId, newText }] of patches) {
          await ledger.supersede(atomId, newText).catch(() => {});
        }
      }

      notify.success("CV diperbarui — fakta CV ikut disesuaikan");
      if (orphanAccepted.length > 0) {
        notify.info(
          `${orphanAccepted.length} saran di luar pengalaman kerja belum diterapkan (skill / sertifikasi)`,
        );
      }
      onOpenChange(false);
      setTimeout(reset, 300);
    } catch (err) {
      notify.fromError(err, "Gagal menerapkan perubahan");
    } finally {
      setApplying(false);
    }
  };

  const stats = useMemo(() => {
    if (!result) return null;
    const changed = result.rewrites.filter((r) => r.changed);
    const acceptedByValidator = changed.filter((r) => r.accepted);
    const rejectedByValidator = changed.filter((r) => !r.accepted);
    return {
      atomCount: result.atomCount,
      changed: changed.length,
      acceptedByValidator: acceptedByValidator.length,
      rejectedByValidator: rejectedByValidator.length,
      selected: accepted.size,
    };
  }, [result, accepted.size]);

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
            <Badge variant="outline" className="ml-1 gap-1 text-[10px]">
              <ShieldCheck className="h-3 w-3" /> Anti-halusinasi
            </Badge>
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {job
              ? `AI menulis ulang fakta dari CV kamu agar cocok dengan ${job.title} · ${job.company}. Validator menolak halusinasi (angka / fakta yang dikarang) sebelum sampai ke kamu.`
              : "Pilih lowongan dulu untuk menyesuaikan CV."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4">
          {!cv && cvs !== undefined && (
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Buat CV dulu di CV Generator sebelum pakai Resume Tailor.
            </div>
          )}

          {cv && ledger.isEmpty && !result && (
            <div className="space-y-3 rounded-lg border border-dashed border-warning/50 bg-warning/10 p-4">
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-text" />
                <div>
                  <p className="font-medium text-foreground">Fakta CV kamu belum tersimpan</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Simpan dulu fakta dari CV kamu — tiap poin jadi fakta
                    terpisah yang boleh ditulis ulang AI <strong>tanpa
                    halusinasi</strong>. Sekali klik. Aman, tidak ada yang
                    ditimpa atau dihapus.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleSeed}
                disabled={seeding}
                className="w-full gap-2"
                variant="outline"
              >
                {seeding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Simpan Fakta dari CV
              </Button>
            </div>
          )}

          {cv && !ledger.isEmpty && !result && !generating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  {ledger.atoms.length} fakta CV tersimpan
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSeed}
                  disabled={seeding}
                  className="h-6 gap-1 px-2 text-[10px]"
                >
                  <RefreshCw className="h-3 w-3" />
                  Perbarui
                </Button>
              </div>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={!job}
                className="w-full gap-2 bg-brand hover:bg-brand"
              >
                <Sparkles className="h-4 w-4" />
                <span>Generate Saran dari Fakta CV</span>
              </Button>
            </div>
          )}

          {generating && (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <p className="text-center text-xs text-muted-foreground">
                AI menulis ulang + validator memeriksa ~10-30 detik…
              </p>
            </div>
          )}

          {result && stats && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-2.5 text-[11px]">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                  <span>{stats.atomCount} fakta</span>
                  <span>·</span>
                  <span className="text-success-text">
                    {stats.acceptedByValidator} lolos validator
                  </span>
                  {stats.rejectedByValidator > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-destructive">
                        {stats.rejectedByValidator} ditolak (halusinasi)
                      </span>
                    </>
                  )}
                  <span>·</span>
                  <span className="font-medium text-foreground">
                    {stats.selected} dipilih
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  className="h-7 gap-1.5"
                  disabled={generating}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Generate Ulang
                </Button>
              </div>

              <div className="max-h-[55dvh] space-y-2.5 overflow-y-auto pr-1">
                {result.rewrites
                  .filter((r) => r.changed)
                  .map((r) => {
                    const checked = accepted.has(r.atomId);
                    const blocked = !r.accepted;
                    return (
                      <RewriteRow
                        key={r.atomId}
                        rewrite={r}
                        checked={checked && !blocked}
                        blocked={blocked}
                        onToggle={() => !blocked && toggleAccept(r.atomId)}
                      />
                    );
                  })}
                {result.rewrites.filter((r) => r.changed).length === 0 && (
                  <p className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    Tidak ada poin yang perlu AI ubah — fakta CV kamu sudah
                    cukup cocok dengan lowongan ini.
                  </p>
                )}
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
                  <span>Terapkan {accepted.size} Perubahan</span>
                </>
              )}
            </Button>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

interface RewriteRowProps {
  rewrite: LedgerRewrite;
  checked: boolean;
  blocked: boolean;
  onToggle: () => void;
}

function RewriteRow({ rewrite, checked, blocked, onToggle }: RewriteRowProps) {
  return (
    <li
      className={cn(
        "list-none rounded-lg border p-3",
        blocked
          ? "border-destructive/40 bg-destructive/5"
          : "border-border bg-card",
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={checked}
          onCheckedChange={onToggle}
          disabled={blocked}
          className="mt-1"
          aria-label="Terapkan perubahan ini"
        />
        <div className="min-w-0 flex-1 space-y-1.5 text-xs leading-relaxed">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[9px]">
              {rewrite.type}
            </Badge>
            {blocked ? (
              <Badge variant="destructive" className="gap-1 text-[9px]">
                <AlertTriangle className="h-3 w-3" />
                Ditolak validator
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1 border-success/50 text-[9px] text-success-text"
              >
                <ShieldCheck className="h-3 w-3" />
                Lolos validator
              </Badge>
            )}
          </div>
          <div className="rounded-md bg-destructive/5 px-2.5 py-1.5 line-through decoration-destructive/40">
            <span className="font-medium text-destructive">
              Sebelum:
            </span>{" "}
            <span className="text-muted-foreground">{rewrite.original}</span>
          </div>
          <div className="flex items-start gap-1 text-muted-foreground">
            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
          </div>
          <div
            className={cn(
              "rounded-md px-2.5 py-1.5",
              blocked
                ? "bg-muted/40 text-muted-foreground"
                : checked
                  ? "bg-success/10 text-foreground"
                  : "bg-muted/40 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "font-medium",
                blocked
                  ? "text-destructive"
                  : "text-success-text",
              )}
            >
              Sesudah:
            </span>{" "}
            {rewrite.rewritten}
          </div>
          {blocked && rewrite.violations.length > 0 && (
            <ul className="space-y-0.5 rounded-md bg-destructive/5 px-2.5 py-1.5 text-[10px] text-destructive">
              {rewrite.violations.map((v, i) => (
                <li key={i}>· {v}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}
