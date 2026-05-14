import type { Id } from "../../_generated/dataModel";

/**
 * Career-graph BFS — pure, side-effect-free, unit-testable. Queries
 * load node/edge sets and hand them off here; the lib returns
 * top-K ranked paths from start → end constrained by hop budget,
 * month budget, and a probability floor.
 *
 * Avoids any external graph library — the entire algorithm runs on
 * plain arrays + Map, suitable for execution inside a Convex query
 * isolate without dependency creep.
 */

export interface GraphNode {
  _id: Id<"careerNodes">;
  slug: string;
  label: string;
  requiredSkills: string[];
}

export interface GraphEdge {
  _id: Id<"careerEdges">;
  fromNodeId: Id<"careerNodes">;
  toNodeId: Id<"careerNodes">;
  probability: number;
  durationMonthsMedian: number;
  acquiredSkills: string[];
  sampleSize: number;
}

export interface RankedPath {
  nodeIds: Id<"careerNodes">[];
  edgeIds: Id<"careerEdges">[];
  cumulativeProbability: number;
  durationMonths: number;
  hops: number;
  acquiredSkills: string[];
  /** Composite ranking score — higher is better. */
  score: number;
}

export interface FindPathsOpts {
  nodes: GraphNode[];
  edges: GraphEdge[];
  startId: Id<"careerNodes">;
  endId: Id<"careerNodes">;
  budgetMonths: number;
  maxHops?: number;
  minProbability?: number;
  topK?: number;
}

const DEFAULT_MAX_HOPS = 5;
const DEFAULT_MIN_PROB = 0.01;
const DEFAULT_TOP_K = 8;
const MAX_FRONTIER = 5_000;

/**
 * Returns up to `topK` paths sorted by composite score (descending).
 * Returns empty array when no path satisfies all constraints.
 */
export function findPaths(opts: FindPathsOpts): RankedPath[] {
  const {
    edges,
    startId,
    endId,
    budgetMonths,
    maxHops = DEFAULT_MAX_HOPS,
    minProbability = DEFAULT_MIN_PROB,
    topK = DEFAULT_TOP_K,
  } = opts;

  if (startId === endId) {
    return [
      {
        nodeIds: [startId],
        edgeIds: [],
        cumulativeProbability: 1,
        durationMonths: 0,
        hops: 0,
        acquiredSkills: [],
        score: Number.POSITIVE_INFINITY,
      },
    ];
  }

  const adjacency = buildAdjacency(edges);

  interface Frontier {
    nodeId: Id<"careerNodes">;
    nodeIds: Id<"careerNodes">[];
    edgeIds: Id<"careerEdges">[];
    probability: number;
    duration: number;
    acquired: Set<string>;
  }

  const initial: Frontier = {
    nodeId: startId,
    nodeIds: [startId],
    edgeIds: [],
    probability: 1,
    duration: 0,
    acquired: new Set(),
  };

  let frontier: Frontier[] = [initial];
  const completed: RankedPath[] = [];

  for (let hop = 0; hop < maxHops; hop++) {
    const next: Frontier[] = [];
    for (const f of frontier) {
      const outgoing = adjacency.get(f.nodeId);
      if (!outgoing) continue;
      for (const edge of outgoing) {
        // Avoid cycles — career graphs are nominally DAG-ish, but
        // defend.
        if (f.nodeIds.includes(edge.toNodeId)) continue;

        const newProb = f.probability * edge.probability;
        if (newProb < minProbability) continue;

        const newDuration = f.duration + edge.durationMonthsMedian;
        if (newDuration > budgetMonths) continue;

        const newAcquired = new Set(f.acquired);
        for (const s of edge.acquiredSkills) newAcquired.add(s);

        const expanded: Frontier = {
          nodeId: edge.toNodeId,
          nodeIds: [...f.nodeIds, edge.toNodeId],
          edgeIds: [...f.edgeIds, edge._id],
          probability: newProb,
          duration: newDuration,
          acquired: newAcquired,
        };

        if (edge.toNodeId === endId) {
          completed.push({
            nodeIds: expanded.nodeIds,
            edgeIds: expanded.edgeIds,
            cumulativeProbability: newProb,
            durationMonths: newDuration,
            hops: hop + 1,
            acquiredSkills: Array.from(newAcquired),
            score: scorePath(newProb, newDuration, budgetMonths, hop + 1),
          });
        } else {
          next.push(expanded);
        }
      }
    }
    if (next.length === 0) break;
    // Cap the frontier to keep worst-case bounded — drop the
    // lowest-probability frontiers first.
    if (next.length > MAX_FRONTIER) {
      next.sort((a, b) => b.probability - a.probability);
      frontier = next.slice(0, MAX_FRONTIER);
    } else {
      frontier = next;
    }
  }

  completed.sort((a, b) => b.score - a.score);
  return completed.slice(0, topK);
}

function buildAdjacency(
  edges: GraphEdge[],
): Map<Id<"careerNodes">, GraphEdge[]> {
  const m = new Map<Id<"careerNodes">, GraphEdge[]>();
  for (const e of edges) {
    let list = m.get(e.fromNodeId);
    if (!list) {
      list = [];
      m.set(e.fromNodeId, list);
    }
    list.push(e);
  }
  return m;
}

/**
 * Composite path score. Multiplicative composition penalises long
 * paths (probabilities compound below 1.0); duration-utilisation
 * term rewards leaving buffer below the budget; sqrt-hop term
 * mildly favours shorter routes when probability is similar.
 */
function scorePath(
  probability: number,
  duration: number,
  budgetMonths: number,
  hops: number,
): number {
  const slack = Math.max(0, 1 - duration / Math.max(1, budgetMonths));
  return probability * (0.5 + 0.5 * slack) * (1 / Math.sqrt(hops));
}

/**
 * Compute the skill-gap a user must close to satisfy `targetNode`'s
 * `requiredSkills`. Uses simple case-insensitive token match against
 * the user's current skill set (typically derived from their Truth
 * Ledger `type === "skill"` atoms).
 */
export function skillGap(
  targetSkills: ReadonlyArray<string>,
  userSkills: ReadonlyArray<string>,
): string[] {
  const userSet = new Set(userSkills.map((s) => s.trim().toLowerCase()));
  const missing: string[] = [];
  for (const skill of targetSkills) {
    if (!userSet.has(skill.trim().toLowerCase())) missing.push(skill);
  }
  return missing;
}
