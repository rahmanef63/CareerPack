"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Activity, ChartLine, Lock, MessageCircle, Plus } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/shared/components/ui/responsive-dialog";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { notify } from "@/shared/lib/notify";
import { cn } from "@/shared/lib/utils";

const KIND_LABELS = {
  apply: "Lamar",
  callback: "Dapat callback",
  interview: "Wawancara",
  offer: "Tawaran kerja",
  accepted: "Diterima",
  rejected: "Ditolak",
} as const;

type OutcomeKind = keyof typeof KIND_LABELS;

const CONFIDENCE_TONE = {
  none: "bg-muted text-muted-foreground border-border",
  low: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/50",
  medium: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-300/50",
  high: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/50",
} as const;

interface OutcomeReporterProps {
  targetNodeSlug: string;
  targetNodeLabel: string;
  /** User's current role slug — drives the Phase 4.5 calibrator's
   *  edge attribution. Optional: standalone reports may not know it. */
  fromNodeSlug?: string;
}

/**
 * Inline outcome-feedback widget tied to a Career Graph target node.
 *
 * Surfaces the live cohort statistics (callback rate + sample size +
 * confidence band) AND a one-click reporter so the user can feed
 * their own outcomes back into the engine. The two halves compound:
 * showing the cohort stats motivates reporting; reporting refines
 * the stats.
 */
export function OutcomeReporter({
  targetNodeSlug,
  targetNodeLabel,
  fromNodeSlug,
}: OutcomeReporterProps) {
  // DP-protected aggregate (Phase 5). Counts are noised + cohort
  // suppressed below k-anonymity floor so individual users can't be
  // re-identified from the panel.
  const cohort = useQuery(api.engine.dp.queries.cohortStatsDP, {
    targetNodeSlug,
  });
  const recordOutcome = useMutation(api.engine.outcomes.mutations.record);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<OutcomeKind>("apply");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await recordOutcome({
        kind,
        targetNodeSlug,
        fromNodeSlug,
        notes: notes.trim() || undefined,
      });
      notify.success(`Tercatat: ${KIND_LABELS[kind]} untuk ${targetNodeLabel}`);
      setOpen(false);
      setTimeout(() => {
        setNotes("");
        setKind("apply");
      }, 300);
    } catch (err) {
      notify.fromError(err, "Gagal mencatat hasil");
    } finally {
      setSubmitting(false);
    }
  };

  const callbackPct =
    cohort?.callbackRate !== null && cohort?.callbackRate !== undefined
      ? Math.round(cohort.callbackRate * 100)
      : null;

  return (
    <div className="rounded-md border border-border bg-card p-3 text-xs">
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
        <ChartLine className="h-3.5 w-3.5 text-brand" />
        Cohort untuk{" "}
        <span className="font-semibold">{targetNodeLabel}</span>
        {cohort && (
          <>
            <Badge
              variant="outline"
              className="ml-auto gap-1 text-[10px]"
              title={`Differential Privacy: ε = ${cohort.epsilonTotal.toFixed(1)}`}
            >
              <Lock className="h-3 w-3" />
              DP ε={cohort.epsilonTotal.toFixed(1)}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "gap-1 text-[10px]",
                CONFIDENCE_TONE[cohort.sampleBand],
              )}
            >
              confidence: {cohort.sampleBand}
            </Badge>
          </>
        )}
      </div>

      {cohort ? (
        !cohort.released ? (
          <p className="rounded bg-muted/40 p-2 text-[11px] text-muted-foreground">
            Cohort masih di bawah ambang k-anonimitas (min{" "}
            <strong>{cohort.minN}</strong> lapor). Statistik di-suppress
            untuk lindungi privasi. Lapor hasil di bawah untuk membangun
            cohort.
          </p>
        ) : cohort.counts ? (
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <Stat label="Lamar" value={cohort.counts.apply} />
            <Stat
              label="Callback"
              value={
                callbackPct !== null
                  ? `${cohort.counts.callback} (${callbackPct}%)`
                  : cohort.counts.callback
              }
            />
            <Stat label="Offer" value={cohort.counts.offer} />
          </div>
        ) : null
      ) : (
        <p className="text-[11px] text-muted-foreground">Memuat cohort…</p>
      )}

      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 h-7 w-full gap-1.5 text-[11px]"
          >
            <Plus className="h-3 w-3" />
            Lapor hasil aplikasi
          </Button>
        </ResponsiveDialogTrigger>
        <ResponsiveDialogContent size="md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand" />
              Lapor hasil ke engine
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Data ini dipakai untuk kalibrasi prediksi P(callback) per
              cohort. Disimpan terikat akun kamu — agregat (jumlah +
              persen) terlihat publik, detail per-user privat.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="outcome-kind">Hasil</Label>
              <ResponsiveSelect
                value={kind}
                onValueChange={(v) => setKind(v as OutcomeKind)}
              >
                <ResponsiveSelectTrigger id="outcome-kind" />
                <ResponsiveSelectContent drawerTitle="Hasil aplikasi">
                  {(Object.keys(KIND_LABELS) as OutcomeKind[]).map((k) => (
                    <ResponsiveSelectItem key={k} value={k}>
                      {KIND_LABELS[k]}
                    </ResponsiveSelectItem>
                  ))}
                </ResponsiveSelectContent>
              </ResponsiveSelect>
            </div>
            <div className="space-y-1">
              <Label htmlFor="outcome-notes" className="flex items-center gap-1.5">
                <MessageCircle className="h-3 w-3" /> Catatan (opsional)
              </Label>
              <Textarea
                id="outcome-notes"
                placeholder="Mis. perusahaan, channel apply, alasan ditolak…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[60px] text-xs"
                maxLength={500}
              />
            </div>
          </div>
          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-brand hover:bg-brand"
            >
              {submitting ? "Mencatat…" : "Lapor"}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}

interface StatProps {
  label: string;
  value: number | string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded bg-muted/40 px-2 py-1 text-center">
      <div className="text-[9px] uppercase text-muted-foreground">{label}</div>
      <div className="text-[12px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}
