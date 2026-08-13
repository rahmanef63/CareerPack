"use client";

import {
  Crown, Flame, Footprints, FlameKindling, Sparkles, Star,
  Swords, Target, Trophy, Zap, ShieldCheck, type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import type { GamificationStats } from "../hooks/useRoadmapGamification";

const ACHIEVEMENT_ICON: Record<string, LucideIcon> = {
  Footprints, Flame, Target, Swords, Crown, Trophy,
  Star, Sparkles, Zap, FlameKindling, ShieldCheck,
};

/**
 * Tier tones ride semantic tokens, not raw amber/slate/yellow/fuchsia.
 * The palette classes were pinned to one light-mode ramp: `text-slate-400`
 * on `bg-slate-400/10` and `text-yellow-500` on `bg-yellow-500/10` both
 * measured under 2:1 on a light card, and none of them tracked the active
 * theme preset. Each `-text` token is the prose sibling of its fill and is
 * held to AA in BOTH palettes.
 */
const TIER_RING: Record<string, string> = {
  bronze:    "ring-warning/40 bg-warning/10 text-warning-text",
  silver:    "ring-info/40 bg-info/10 text-info-text",
  gold:      "ring-success/40 bg-success/10 text-success-text",
  legendary: "ring-brand/50 bg-brand/10 text-brand animate-pulse",
};

interface GamificationPanelProps {
  stats: GamificationStats;
  domainLabel?: string;
}

/**
 * RPG-style HUD: level + XP bar, class title with theme, streak, stat
 * pips, and an achievements ribbon. Locked achievements are rendered
 * faded so the user sees what's coming next.
 */
export function GamificationPanel({ stats, domainLabel }: GamificationPanelProps) {
  const { level, xp, pctToNext, xpFloor, xpCeil, completed, total, streak, className, theme, achievements } = stats;
  const xpInLevel = xp - xpFloor;
  const xpForLevel = Math.max(1, xpCeil - xpFloor);

  return (
    <Card className={cn("border-border overflow-hidden relative", theme.glow)}>
      {/* Decorative gradient stripe */}
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", theme.primary)} aria-hidden />

      <CardContent className="pt-6 space-y-5">
        {/* Header row — class + level + streak */}
        <div className="flex flex-wrap items-center gap-4">
          <div className={cn(
            "flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br text-white shrink-0 shadow-lg",
            theme.primary,
          )}>
            <span className="text-2xl font-extrabold leading-none drop-shadow">{level}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-xs font-bold uppercase tracking-wider", theme.accentText)}>
                Level {level} · {className}
              </span>
              {domainLabel && (
                <Badge variant="outline" className="uppercase">
                  {theme.name}
                </Badge>
              )}
            </div>
            {/* Not a heading: this is a live stat, and marking it up as one
                put an <h3> between the page <h1> and the card headings. */}
            <p className="text-lg font-bold text-foreground mt-0.5 tabular-nums">
              {xpInLevel.toLocaleString()} / {xpForLevel.toLocaleString()} XP
            </p>
            {/* Animated XP bar */}
            <div
              className="relative mt-2 h-2.5 rounded-full bg-muted overflow-hidden"
              role="progressbar"
              aria-label="Progres XP ke level berikutnya"
              aria-valuenow={pctToNext}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={cn("absolute inset-y-0 left-0 bg-gradient-to-r transition-all duration-700 ease-out", theme.primary)}
                style={{ width: `${pctToNext}%` }}
              />
              {/* Shimmer overlay — uses global @keyframes shimmer in App.css */}
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2.4s infinite linear",
                }}
              />
            </div>
          </div>

          {/* Streak — feature flame if active */}
          <div className={cn(
            "flex flex-col items-center justify-center px-4 py-2 rounded-xl border-2",
            streak > 0
              ? "border-warning/50 bg-warning/10"
              : "border-border bg-muted/40",
          )}>
            <Flame className={cn("w-6 h-6", streak > 0 ? "text-warning" : "text-muted-foreground")} aria-hidden />
            <span className={cn("text-lg font-bold leading-none mt-1 tabular-nums", streak > 0 ? "text-warning-text" : "text-muted-foreground")}>
              {streak}
            </span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Streak</span>
          </div>
        </div>

        {/* Stat pips */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <StatPip icon={Trophy} label="Selesai" value={`${completed}/${total}`} accent={theme.accentText} />
          <StatPip icon={Sparkles} label="Total XP" value={xp.toLocaleString()} accent={theme.accentText} />
          {/* Was "Domain": every skill in a roadmap is seeded with the same
              category (the careerPath slug), so the distinct-domain count
              could only ever read 0 or 1. Streak is a real number. */}
          <StatPip icon={Star} label="Runtutan" value={`${stats.streak} hari`} accent={theme.accentText} />
        </div>

        {/* Achievements ribbon */}
        {achievements.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Pencapaian
            </div>
            <ul className="flex flex-wrap gap-2">
              {achievements.map((a) => {
                const Icon = ACHIEVEMENT_ICON[a.icon] ?? Trophy;
                return (
                  <li
                    key={a.id}
                    title={`${a.title} — ${a.description}`}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ring-1",
                      TIER_RING[a.tier],
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden />
                    <span className="text-xs font-semibold leading-none">{a.title}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatPipProps {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: string;
}

function StatPip({ icon: Icon, label, value, accent }: StatPipProps) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border">
      <Icon className={cn("w-4 h-4 shrink-0", accent)} aria-hidden />
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-muted-foreground leading-tight">{label}</div>
        <div className="text-sm font-bold text-foreground leading-tight tabular-nums">{value}</div>
      </div>
    </div>
  );
}
