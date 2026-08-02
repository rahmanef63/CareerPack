"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export interface CareerNodeSummary {
  _id: string;
  slug: string;
  label: string;
  role: string;
  seniority: string;
  requiredSkills: string[];
  description?: string;
  salaryByeSector?: {
    fintech?: number;
    ecommerce?: number;
    saas?: number;
    enterprise?: number;
  };
}

export interface RankedPathDTO {
  nodeIds: string[];
  edgeIds: string[];
  cumulativeProbability: number;
  durationMonths: number;
  hops: number;
  acquiredSkills: string[];
  score: number;
  nodes: CareerNodeSummary[];
  /**
   * Subset of edgeIds whose probability was substituted from the
   * daily Bayesian calibrator (Phase 4.5). Empty when the path uses
   * only curated seed edges. Visible-loop signal that the engine is
   * learning from reported outcomes.
   */
  calibratedEdgeIds?: string[];
}

interface ReachResult {
  startNode: CareerNodeSummary | null;
  endNode: CareerNodeSummary | null;
  paths: RankedPathDTO[];
  targetSkillGap: string[];
}

/**
 * Career Time Machine hook. Loads the full node catalog up-front
 * (small, ~30 rows) so dropdowns hydrate without round-trip, then
 * runs reachability lazily once start + target are picked.
 */
export function useCareerReach(opts: {
  userSkills: ReadonlyArray<string>;
}) {
  const nodesRaw = useQuery(api.engine.graph.queries.listNodes, {});
  // Stabilise reference — `(nodesRaw ?? [])` returns a new [] each
  // render, which would invalidate downstream useMemo on every render.
  const nodes = useMemo(
    () => (nodesRaw ?? []) as CareerNodeSummary[],
    [nodesRaw],
  );

  const [startSlug, setStartSlug] = useState<string | null>(null);
  const [endSlug, setEndSlug] = useState<string | null>(null);
  const [budgetMonths, setBudgetMonths] = useState(36);

  const reach = useQuery(
    api.engine.graph.queries.reach,
    startSlug && endSlug
      ? {
          startSlug,
          endSlug,
          budgetMonths,
          userSkills: [...opts.userSkills],
        }
      : "skip",
  ) as ReachResult | undefined;

  // Group nodes by role for the dropdown — much friendlier than a
  // flat list of 30 entries.
  const groupedByRole = useMemo(() => {
    const m = new Map<string, CareerNodeSummary[]>();
    for (const n of nodes) {
      const arr = m.get(n.role) ?? [];
      arr.push(n);
      m.set(n.role, arr);
    }
    return Array.from(m.entries())
      .map(([role, list]) => ({
        role,
        nodes: list.sort((a, b) =>
          seniorityOrder(a.seniority) - seniorityOrder(b.seniority),
        ),
      }))
      .sort((a, b) => a.role.localeCompare(b.role));
  }, [nodes]);

  // Memoise the returned object so consumers can safely depend on its
  // identity in effects without re-running every render. Setters from
  // useState are already stable; nodes/groupedByRole are memoised above.
  return useMemo(
    () => ({
      nodes,
      groupedByRole,
      isLoadingNodes: nodesRaw === undefined,
      startSlug,
      endSlug,
      budgetMonths,
      setStartSlug,
      setEndSlug,
      setBudgetMonths,
      reach,
      isComputing: !!startSlug && !!endSlug && reach === undefined,
    }),
    [
      nodes,
      groupedByRole,
      nodesRaw,
      startSlug,
      endSlug,
      budgetMonths,
      reach,
    ],
  );
}

function seniorityOrder(s: string): number {
  switch (s) {
    case "intern":
      return 0;
    case "junior":
      return 1;
    case "mid":
      return 2;
    case "senior":
      return 3;
    case "lead":
      return 4;
    case "principal":
      return 5;
    default:
      return 99;
  }
}
