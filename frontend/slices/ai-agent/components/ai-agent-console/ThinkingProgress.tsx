"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { AIProgressDisplay } from "./AIProgressDisplay";
import type { AIProgress, AIStep } from "../../types/progress";

/**
 * Synthesized live-progress placeholder shown while the chat action
 * is in flight. We don't actually receive step events from the backend
 * (Convex actions return a single payload), so this is a best-effort
 * UX simulation — steps light up on a fixed schedule that roughly
 * matches typical timings observed in production.
 *
 * On result arrival the parent unmounts this and renders the real
 * `AIProgressDisplay` from the assistant message — so the user sees
 * actual durations after the fact, but lives through a believable
 * "agent is working" moment during the wait.
 *
 * Tradeoff vs Option B (Convex reactive table per-run): no backend
 * change, no schema, no cleanup cron. Honest enough — if a step
 * actually takes 5s the simulation will look fast/wrong, but in
 * practice steps are dominated by the inference call and that's the
 * one we keep "running" longest.
 */

/** Approximate ms each step holds "running" before advancing. The
 *  inference step is intentionally long — it's the dominant wait —
 *  and stays "running" until the parent swaps in real progress. */
const STEP_TIMINGS_MS = [350, 250, 600, 99_999, 0] as const;

const STEP_TEMPLATES: Array<Pick<AIStep, "type" | "label">> = [
  { type: "resolve_config", label: "Resolve konfigurasi AI" },
  { type: "resolve_skill", label: "Cek skill slash command" },
  { type: "load_context", label: "Muat profil user" },
  { type: "inference", label: "Generate respons" },
  { type: "finalize", label: "Finalisasi balasan" },
];

export function ThinkingProgress() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let i = 0;
    const advance = () => {
      if (cancelled) return;
      i++;
      if (i >= STEP_TEMPLATES.length - 1) return; // hold on inference
      setActiveIdx(i);
      window.setTimeout(advance, STEP_TIMINGS_MS[i] ?? 500);
    };
    const t = window.setTimeout(advance, STEP_TIMINGS_MS[0]);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  const progress: AIProgress = {
    steps: STEP_TEMPLATES.map((tmpl, i) => ({
      id: `live-${i}`,
      type: tmpl.type,
      status: i < activeIdx ? "completed" : i === activeIdx ? "running" : "pending",
      label: tmpl.label,
    })),
    totalDurationMs: 0,
    isComplete: false,
  };

  return (
    <div className="flex gap-2">
      <Avatar className="w-7 h-7 flex-shrink-0">
        <AvatarFallback className="bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground">
          <Sparkles className="w-3 h-3" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2 min-w-0 flex-1 max-w-[85%]">
        <AIProgressDisplay
          progress={progress}
          defaultOpen={true}
          variant="live"
        />
      </div>
    </div>
  );
}
