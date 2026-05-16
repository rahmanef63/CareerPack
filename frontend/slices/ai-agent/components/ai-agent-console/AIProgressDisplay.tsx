"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Check, X, Minus } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { iconForStep } from "../../lib/stepIcons";
import type { AIProgress, AIStep, StepStatus } from "../../types/progress";

interface AIProgressDisplayProps {
  progress: AIProgress;
  defaultOpen?: boolean;
  /** "live" = still running (header reads "AI sedang berpikir...");
   *  "completed" = post-result (header shows step ratio + total time). */
  variant?: "live" | "completed";
}

const STATUS_STYLES: Record<
  StepStatus,
  { ring: string; text: string; label: string }
> = {
  pending: {
    ring: "bg-muted",
    text: "text-muted-foreground",
    label: "Menunggu",
  },
  running: {
    ring: "bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    label: "Berjalan",
  },
  completed: {
    ring: "bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    label: "Selesai",
  },
  skipped: {
    ring: "bg-muted",
    text: "text-muted-foreground/70",
    label: "Dilewati",
  },
  error: {
    ring: "bg-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    label: "Gagal",
  },
};

function StatusGlyph({ status }: { status: StepStatus }) {
  if (status === "running") return <Loader2 className="w-3 h-3 animate-spin" />;
  if (status === "completed") return <Check className="w-3 h-3" />;
  if (status === "error") return <X className="w-3 h-3" />;
  if (status === "skipped") return <Minus className="w-3 h-3" />;
  return <span className="w-1.5 h-1.5 rounded-full bg-current" />;
}

function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StepRow({ step, isLast }: { step: AIStep; isLast: boolean }) {
  const styles = STATUS_STYLES[step.status] ?? STATUS_STYLES.pending;
  const Icon = iconForStep(step.type);
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
            styles.ring,
            styles.text,
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>
      <div className="flex-1 min-w-0 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium">{step.label}</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px]",
              styles.text,
            )}
          >
            <StatusGlyph status={step.status} />
            {styles.label}
          </span>
          {step.durationMs !== undefined && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {fmtMs(step.durationMs)}
            </span>
          )}
        </div>
        {step.detail && (
          <p className="text-[11px] text-muted-foreground mt-0.5 break-words">
            {step.detail}
          </p>
        )}
        {step.error && (
          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 break-words">
            {step.error}
          </p>
        )}
      </div>
    </div>
  );
}

export function AIProgressDisplay({
  progress,
  defaultOpen = false,
  variant = "completed",
}: AIProgressDisplayProps) {
  const [open, setOpen] = useState(defaultOpen);
  const completed = progress.steps.filter(
    (s) => s.status === "completed" || s.status === "skipped",
  ).length;
  const total = Math.max(progress.steps.length, 1);
  const ratio = Math.min(100, Math.round((completed / total) * 100));
  const hasError = progress.steps.some((s) => s.status === "error");

  return (
    <div className="rounded-xl border border-border bg-muted/30 overflow-hidden w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium">
              {variant === "live"
                ? "AI sedang berpikir..."
                : `${completed}/${total} langkah`}
            </span>
            {progress.isComplete && (
              <span className="text-[10px] text-muted-foreground tabular-nums">
                · {fmtMs(progress.totalDurationMs)}
              </span>
            )}
            {hasError && (
              <span className="text-[10px] text-rose-600 dark:text-rose-400">
                · ada error
              </span>
            )}
          </div>
          <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500 bg-gradient-to-r",
                hasError
                  ? "from-rose-500 to-rose-600"
                  : "from-blue-500 to-emerald-500",
              )}
              style={{ width: `${ratio}%` }}
            />
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="px-3 pt-3 pb-1 border-t border-border">
          {progress.steps.map((step, i) => (
            <StepRow
              key={step.id}
              step={step}
              isLast={i === progress.steps.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
