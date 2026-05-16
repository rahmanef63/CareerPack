"use client";

import { useEffect, useState } from "react";
import { Check, CloudOff, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import type { SubmitOptions } from "../form/types";

export interface SaveActionsProps {
  saving: boolean;
  canEnable: boolean;
  submit: (opts?: SubmitOptions) => Promise<void>;
  /** Hide the "Opt-in per kolom" badge — useful for compact placements. */
  showBadge?: boolean;
  className?: string;
  /** Epoch-ms timestamp of the most recent save (manual or auto). */
  lastSavedAt?: number | null;
  /** Auto-save debounce window is open — show "Menyimpan…". */
  autoSavePending?: boolean;
}

function formatRelative(epoch: number, nowMs: number): string {
  const sec = Math.max(0, Math.round((nowMs - epoch) / 1000));
  if (sec < 5) return "baru saja";
  if (sec < 60) return `${sec} detik lalu`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.round(min / 60);
  return `${hr} jam lalu`;
}

function AutoSaveIndicator({
  lastSavedAt,
  autoSavePending,
  saving,
  canEnable,
}: {
  lastSavedAt: number | null | undefined;
  autoSavePending: boolean;
  saving: boolean;
  canEnable: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(t);
  }, []);

  if (!canEnable) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <CloudOff className="h-3 w-3" />
        Auto-save off — set slug dulu
      </span>
    );
  }
  if (saving) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Menyimpan…
      </span>
    );
  }
  if (autoSavePending) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Auto-save…
      </span>
    );
  }
  if (lastSavedAt) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
        <Check className="h-3 w-3" />
        Tersimpan otomatis · {formatRelative(lastSavedAt, now)}
      </span>
    );
  }
  return null;
}

/**
 * The "Simpan Draft" + "Simpan & Publikasikan" button row. Used at
 * the bottom of every settings card so the user can save from the
 * tab they're on without scrolling back to the page header.
 */
export function SaveActions({
  saving,
  canEnable,
  submit,
  showBadge = true,
  className,
  lastSavedAt,
  autoSavePending = false,
}: SaveActionsProps) {
  return (
    <div
      className={
        "flex flex-wrap items-center justify-between gap-3 pt-1" +
        (className ? ` ${className}` : "")
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        {showBadge && (
          <Badge
            variant="secondary"
            className="gap-1 bg-brand-muted text-brand-muted-foreground"
          >
            <ShieldCheck className="h-3 w-3" />
            Opt-in per kolom
          </Badge>
        )}
        <AutoSaveIndicator
          lastSavedAt={lastSavedAt}
          autoSavePending={autoSavePending}
          saving={saving}
          canEnable={canEnable}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => submit()}
          disabled={saving}
        >
          {saving ? "Menyimpan…" : "Simpan Draft"}
        </Button>
        <Button
          type="button"
          onClick={() => submit({ activate: true })}
          disabled={saving || !canEnable}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Simpan & Publikasikan
        </Button>
      </div>
    </div>
  );
}
