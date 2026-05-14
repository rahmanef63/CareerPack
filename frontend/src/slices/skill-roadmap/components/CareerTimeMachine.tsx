"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  Compass,
  Clock,
  Sparkles,
  TrendingUp,
  Target,
  AlertCircle,
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Slider } from "@/shared/components/ui/slider";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import { useCareerReach, type RankedPathDTO } from "../hooks/useCareerReach";
import { OutcomeReporter } from "./OutcomeReporter";
import { QuestPanel } from "./QuestPanel";

const PROB_TONE = {
  high: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/50",
  med: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/50",
  low: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300/50",
} as const;

function probTone(p: number): keyof typeof PROB_TONE {
  if (p >= 0.25) return "high";
  if (p >= 0.1) return "med";
  return "low";
}

function formatIDR(amount: number | undefined): string | null {
  if (amount === undefined) return null;
  if (amount >= 1_000_000) return `Rp${(amount / 1_000_000).toFixed(1)}jt`;
  return `Rp${amount.toLocaleString("id-ID")}`;
}

/**
 * Career Time Machine — pick a current state + target + month budget,
 * see the top-K probabilistic paths from the ID labor-market graph
 * with skill-gap callout against the user's Truth Ledger atoms.
 */
export function CareerTimeMachine() {
  // Pull the user's "skill" atoms across all CVs so the engine can
  // calculate skill-gap. We don't pick a CV — atoms are the union of
  // skills the user has attested across their portfolio.
  const cvsRaw = useQuery(api.cv.queries.getUserCVs);
  const cvIds = (cvsRaw ?? []).map((c) => c._id);
  const firstCvId = cvIds[0] ?? null;
  const atomsRaw = useQuery(
    api.engine.atoms.queries.listByCv,
    firstCvId ? { cvId: firstCvId } : "skip",
  ) as Array<{ type: string; claim: string }> | undefined;

  const userSkills = useMemo(
    () =>
      (atomsRaw ?? [])
        .filter((a) => a.type === "skill")
        .map((a) => a.claim),
    [atomsRaw],
  );

  const r = useCareerReach({ userSkills });

  return (
    <div className="space-y-4">
      {/* Phase 3 — Plan Compiler. Sits at top so users hit the
          intent-compile flow before the reachability dropdowns. */}
      <QuestPanel targetNodeSlug={r.endSlug ?? undefined} />

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Compass className="h-4 w-4 text-brand" />
            Career Time Machine
            <Badge variant="outline" className="ml-1 text-[10px]">
              graph engine
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Pilih posisi sekarang + tujuan + budget waktu. Engine cari jalur
            paling mungkin di pasar tenaga kerja ID, hitung probabilitas
            kumulatif, dan tunjukkan skill yang harus kamu tutup dari
            Truth Ledger.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <NodeSelect
              label="Posisi sekarang"
              groupedByRole={r.groupedByRole}
              value={r.startSlug}
              onChange={r.setStartSlug}
              placeholder="Pilih posisi awal"
            />
            <NodeSelect
              label="Posisi tujuan"
              groupedByRole={r.groupedByRole}
              value={r.endSlug}
              onChange={r.setEndSlug}
              placeholder="Pilih posisi tujuan"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="budget-slider" className="font-medium">
                Budget waktu
              </label>
              <span className="tabular-nums text-muted-foreground">
                {r.budgetMonths} bulan ({(r.budgetMonths / 12).toFixed(1)} thn)
              </span>
            </div>
            <Slider
              id="budget-slider"
              value={[r.budgetMonths]}
              min={6}
              max={72}
              step={6}
              onValueChange={(v) => r.setBudgetMonths(v[0] ?? 36)}
            />
          </div>

          {r.isLoadingNodes && (
            <p className="text-center text-xs text-muted-foreground">
              Memuat graph karier…
            </p>
          )}
          {!r.isLoadingNodes && r.nodes.length === 0 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-300/50 bg-amber-500/5 p-3 text-xs">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                Graph karier belum di-seed. Admin perlu jalankan{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  engine.graph.mutations.seedDefaults
                </code>{" "}
                sekali untuk populate node + edge dari katalog ID tech.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {r.isComputing && (
        <Card className="border-border">
          <CardContent className="space-y-2 pt-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </CardContent>
        </Card>
      )}

      {r.reach && r.reach.startNode && r.reach.endNode && (
        <>
          <ReachSummary
            start={r.reach.startNode.label}
            end={r.reach.endNode.label}
            pathCount={r.reach.paths.length}
            targetSkillGap={r.reach.targetSkillGap}
            userSkillCount={userSkills.length}
          />

          {/* Phase 4 — cohort stats + reporter for the target node.
              Engine refines its predictions from real user telemetry. */}
          <OutcomeReporter
            targetNodeSlug={r.reach.endNode.slug}
            targetNodeLabel={r.reach.endNode.label}
          />

          {r.reach.paths.length === 0 ? (
            <Card className="border-dashed border-amber-300/50 bg-amber-500/5">
              <CardContent className="space-y-2 pt-4 text-center text-sm">
                <AlertCircle className="mx-auto h-5 w-5 text-amber-600 dark:text-amber-400" />
                <p className="font-medium text-foreground">
                  Tidak ada jalur yang muat di budget {r.budgetMonths} bulan
                </p>
                <p className="text-xs text-muted-foreground">
                  Coba naikkan budget, atau pilih target yang lebih dekat
                  dengan posisi sekarang.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {r.reach.paths.map((p, idx) => (
                <PathRow key={p.edgeIds.join("|")} path={p} rank={idx + 1} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface NodeSelectProps {
  label: string;
  groupedByRole: Array<{
    role: string;
    nodes: Array<{ slug: string; label: string }>;
  }>;
  value: string | null;
  onChange: (slug: string) => void;
  placeholder: string;
}

function NodeSelect({
  label,
  groupedByRole,
  value,
  onChange,
  placeholder,
}: NodeSelectProps) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium">{label}</span>
      <ResponsiveSelect
        value={value ?? undefined}
        onValueChange={onChange}
      >
        <ResponsiveSelectTrigger placeholder={placeholder} />
        <ResponsiveSelectContent drawerTitle={label}>
          {groupedByRole.map((group) =>
            group.nodes.map((n) => (
              <ResponsiveSelectItem key={n.slug} value={n.slug}>
                {n.label}
              </ResponsiveSelectItem>
            )),
          )}
        </ResponsiveSelectContent>
      </ResponsiveSelect>
    </div>
  );
}

interface ReachSummaryProps {
  start: string;
  end: string;
  pathCount: number;
  targetSkillGap: string[];
  userSkillCount: number;
}

function ReachSummary({
  start,
  end,
  pathCount,
  targetSkillGap,
  userSkillCount,
}: ReachSummaryProps) {
  return (
    <Card className="border-border">
      <CardContent className="space-y-2 pt-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{start}</span>
          <ArrowRight className="h-3.5 w-3.5 text-brand" />
          <span className="font-medium">{end}</span>
          <Badge variant="outline" className="ml-auto text-[10px]">
            {pathCount} jalur
          </Badge>
        </div>
        {userSkillCount === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-muted/40 p-2 text-[11px] text-muted-foreground">
            Truth Ledger kosong — skill-gap tidak bisa dihitung. Seed
            Ledger dari CV (lewat Resume Tailor) untuk insight personal.
          </p>
        ) : targetSkillGap.length === 0 ? (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
            <Target className="h-3.5 w-3.5" />
            Tidak ada skill-gap — kamu sudah punya semua skill yang
            dibutuhkan untuk target ini.
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-medium">
              <Target className="h-3.5 w-3.5 text-amber-600" />
              Skill-gap ke target ({targetSkillGap.length} skill):
            </div>
            <div className="flex flex-wrap gap-1">
              {targetSkillGap.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="border-amber-300/50 bg-amber-500/5 text-[10px] text-amber-700 dark:text-amber-400"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PathRowProps {
  path: RankedPathDTO;
  rank: number;
}

function PathRow({ path, rank }: PathRowProps) {
  const probPct = Math.round(path.cumulativeProbability * 100);
  const tone = probTone(path.cumulativeProbability);
  return (
    <Card className={cn("border-l-4", PROB_TONE[tone])}>
      <CardContent className="space-y-2 pt-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              #{rank}
            </Badge>
            <span className="flex items-center gap-1 font-medium">
              <TrendingUp className="h-3 w-3" />
              {probPct}%
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {path.durationMonths}mo
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{path.hops} hop</span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            score {path.score.toFixed(3)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {path.nodes.map((n, i) => {
            const median = pickMedianSalary(n.salaryByeSector);
            return (
              <span key={n._id} className="flex items-center gap-1">
                <Badge
                  variant="outline"
                  className="bg-card text-[10px]"
                  title={median ? `Median ${formatIDR(median)}/bln` : undefined}
                >
                  {n.label}
                </Badge>
                {i < path.nodes.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                )}
              </span>
            );
          })}
        </div>

        {path.acquiredSkills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            <Sparkles className="h-3 w-3 text-brand" />
            <span className="text-[10px] text-muted-foreground">
              Skill diperoleh:
            </span>
            {path.acquiredSkills.map((s) => (
              <Badge
                key={s}
                variant="outline"
                className="border-brand/30 bg-brand/5 text-[10px] text-brand"
              >
                {s}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function pickMedianSalary(
  bySector?: { fintech?: number; ecommerce?: number; saas?: number; enterprise?: number },
): number | undefined {
  if (!bySector) return undefined;
  const vals = [
    bySector.fintech,
    bySector.ecommerce,
    bySector.saas,
    bySector.enterprise,
  ].filter((v): v is number => typeof v === "number");
  if (vals.length === 0) return undefined;
  vals.sort((a, b) => a - b);
  return vals[Math.floor(vals.length / 2)];
}
