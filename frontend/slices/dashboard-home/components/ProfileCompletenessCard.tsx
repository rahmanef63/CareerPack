"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowRight, Check, CheckCircle2, Sparkles } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

interface ProfileCompletenessCardProps {
  onStartWizard?: () => void;
}

/**
 * Dashboard card — radial gauge + actionable "missing" checklist.
 * Drives users to fill profile gaps that unlock matcher accuracy +
 * personal branding. Hidden when user is at 100%.
 */
export function ProfileCompletenessCard({ onStartWizard }: ProfileCompletenessCardProps = {}) {
  const data = useQuery(api.profile.queries.getProfileCompleteness);

  if (data === undefined) {
    return <Skeleton className="h-44 w-full rounded-xl" />;
  }
  if (data === null) return null;
  if (data.score >= 100) return null;

  const { score, missing } = data;
  const top3 = missing.slice(0, 3);

  // Tone scales with progress — red until 30, amber 30-69, green 70+.
  // Semantic tokens, not palette literals: the gauge sat on emerald/amber/rose
  // that ignored every preset and dark mode. The number takes the `-text` tones
  // because the fill tones are unreadable as words on their own /10 tint —
  // --warning is 1.8:1 there, --success 2.28:1. The ring keeps the fill tone;
  // a stroke is non-text and only owes 3:1.
  const tone =
    score >= 70
      ? { ring: "stroke-success", text: "text-success-text", bg: "bg-success/10" }
      : score >= 30
        ? { ring: "stroke-warning", text: "text-warning-text", bg: "bg-warning/10" }
        : { ring: "stroke-destructive", text: "text-destructive", bg: "bg-destructive/10" };

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start gap-5">
        <Gauge score={score} ringClass={tone.ring} textClass={tone.text} />

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold">Lengkapi profil kamu</h3>
              <Badge className={cn("border-0 text-xs", tone.bg, tone.text)}>
                {score}% terisi
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Tiap field naik akurasi matcher + bobot personal branding kamu.
            </p>
          </div>

          {top3.length > 0 && (
            <ul className="space-y-1.5">
              {top3.map((m) => (
                <li
                  key={m.id}
                  className="flex items-start gap-2 rounded-md bg-muted/40 px-2.5 py-1.5 text-xs"
                >
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {m.label}{" "}
                      <span className="text-muted-foreground">+{m.points} poin</span>
                    </p>
                    <p className="text-muted-foreground">{m.hint}</p>
                  </div>
                  {m.href && (
                    <Button asChild size="sm" variant="ghost" className="h-7 shrink-0 px-2 text-xs">
                      {/* aria-label, not a bare arrow: three of these render per
                          card and axe reported all of them as unnamed links.
                          h-7 not h-6 — `--font-scale` 0.92 scales the rem base,
                          so h-6 renders 22px and misses the 24px target. */}
                      <Link href={m.href} aria-label={`Lengkapi ${m.label} di Pengaturan`}>
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {missing.length > 3 && (
            <p className="text-xs text-muted-foreground">
              + {missing.length - 3} item lain. Setiap item beri poin tambahan ke skor profil.
            </p>
          )}

          {onStartWizard && score < 70 && (
            <Button
              type="button"
              size="sm"
              onClick={onStartWizard}
              className="gap-2 bg-brand hover:bg-brand"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Setup cepat — 60 detik
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

interface GaugeProps {
  score: number;
  ringClass: string;
  textClass: string;
}

function Gauge({ score, ringClass, textClass }: GaugeProps) {
  const size = 96;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;

  return (
    <div className="relative grid h-24 w-24 shrink-0 place-items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className={cn("transition-[stroke-dasharray] duration-700 ease-out", ringClass)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        {score >= 100 ? (
          <CheckCircle2 className={cn("h-8 w-8", textClass)} />
        ) : (
          <span className={cn("text-xl font-bold tabular-nums", textClass)}>
            {score}
            <span className="text-xs">%</span>
          </span>
        )}
      </div>
      <Check className="sr-only" />
    </div>
  );
}
