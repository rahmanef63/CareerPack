"use client";

import { AlertCircle, CheckCircle2, ClipboardCopy } from "lucide-react";
import { notify } from "@/shared/lib/notify";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import type { QuickFillResult } from "../../../../../../convex/onboarding/types";

interface Props {
  result: QuickFillResult;
  onDone: () => void;
  onRunAgain: () => void;
}

export function ResultPanel({ result, onDone, onRunAgain }: Props) {
  const rows = [
    { label: "Profil", ok: result.profile, count: result.profile ? 1 : 0, skipped: 0 },
    { label: "CV", ok: result.cv, count: result.cv ? 1 : 0, skipped: 0 },
    {
      label: "Portofolio",
      ok: result.portfolio.added > 0,
      count: result.portfolio.added,
      skipped: result.portfolio.skipped,
    },
    {
      label: "Goals",
      ok: result.goals.added > 0,
      count: result.goals.added,
      skipped: result.goals.skipped,
    },
    {
      label: "Lamaran",
      ok: result.applications.added > 0,
      count: result.applications.added,
      skipped: result.applications.skipped,
    },
    {
      label: "Kontak",
      ok: result.contacts.added > 0,
      count: result.contacts.added,
      skipped: result.contacts.skipped,
    },
  ];
  const totalAdded = rows.reduce((s, r) => s + r.count, 0);
  const totalSkipped = rows.reduce((s, r) => s + r.skipped, 0);
  const allFailed = totalAdded === 0;
  const partialFail = !allFailed && (totalSkipped > 0 || rows.some((r) => !r.ok));

  const handleCopyDebug = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      notify.success("Debug log disalin — paste di chat support");
    } catch {
      notify.warning("Gagal menyalin");
    }
  };

  return (
    <div className="space-y-4 mt-2">
      {allFailed ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-semibold">Tidak ada item yang berhasil masuk</p>
          </div>
          <p className="mt-1 text-xs text-destructive/90">
            Lihat catatan di bawah untuk alasan tiap section dilewati.
          </p>
        </div>
      ) : partialFail ? (
        <div className="rounded-xl border border-amber-500/50 bg-amber-50 p-4 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-semibold">
              Sebagian masuk — {totalAdded} berhasil, {totalSkipped} dilewati
            </p>
          </div>
          <p className="mt-1 text-xs text-amber-700/90 dark:text-amber-300/90">
            Section yang gagal ditandai merah. Lihat catatan di bawah.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 p-4 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-semibold">Import selesai — {totalAdded} item masuk</p>
          </div>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-50 p-3 dark:bg-amber-950/30">
          <p className="mb-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
            Catatan dari server
          </p>
          <ul className="ml-4 list-disc space-y-1 text-xs text-amber-900 dark:text-amber-200">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <ul className="space-y-2 rounded-xl border border-border bg-card p-3">
        {rows.map((r) => (
          <li
            key={r.label}
            className={cn(
              "flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-sm",
              r.count === 0 && "bg-destructive/5",
            )}
          >
            {r.ok ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : r.count === 0 ? (
              <AlertCircle className="h-4 w-4 text-destructive" />
            ) : (
              <span className="block h-2 w-2 rounded-full bg-muted-foreground/40" />
            )}
            <span className="font-medium min-w-[6rem]">{r.label}</span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                r.count === 0 && "border-destructive/40 text-destructive",
              )}
            >
              + {r.count}
            </Badge>
            {r.skipped > 0 && (
              <Badge
                variant="outline"
                className="border-amber-500/40 text-[10px] text-amber-600"
              >
                {r.skipped} dilewati
              </Badge>
            )}
            {r.count === 0 && (
              <span className="text-[11px] font-medium text-destructive">
                tidak masuk
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleCopyDebug}>
          <ClipboardCopy className="mr-1.5 h-3.5 w-3.5" /> Salin Debug
        </Button>
        <Button type="button" variant="outline" onClick={onRunAgain}>
          Import lagi
        </Button>
        <Button type="button" onClick={onDone}>
          Selesai
        </Button>
      </div>
    </div>
  );
}
