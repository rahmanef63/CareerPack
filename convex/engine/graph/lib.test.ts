import { describe, it, expect } from "vitest";
import {
  applyCalibratedProbabilities,
  edgeKey,
  findPaths,
  MIN_CALIBRATION_N,
  skillGap,
  type CalibratedStat,
  type GraphEdge,
  type GraphNode,
} from "./lib";
import type { Id } from "../../_generated/dataModel";

// Test fixture: tiny 5-node, 6-edge DAG.
//
//   junior ──(0.7, 18m)──> mid ──(0.55, 24m)──> senior ──(0.30, 30m)──> lead
//                     └──(0.40, 12m)──> fullstack-mid
//                     └────(0.20, 24m)──── senior      (shortcut, low P)
function n(slug: string, label: string, skills: string[] = []): GraphNode {
  return { _id: slug as unknown as Id<"careerNodes">, slug, label, requiredSkills: skills };
}
function e(
  from: string,
  to: string,
  probability: number,
  durationMonthsMedian: number,
  acquiredSkills: string[] = [],
  sampleSize = 50,
): GraphEdge {
  return {
    _id: `${from}->${to}` as unknown as Id<"careerEdges">,
    fromNodeId: from as unknown as Id<"careerNodes">,
    toNodeId: to as unknown as Id<"careerNodes">,
    probability,
    durationMonthsMedian,
    acquiredSkills,
    sampleSize,
  };
}

const NODES: GraphNode[] = [
  n("junior", "Junior"),
  n("mid", "Mid"),
  n("senior", "Senior", ["System Design", "Mentoring"]),
  n("lead", "Lead", ["Leadership"]),
  n("fullstack-mid", "Full-stack Mid"),
];

const EDGES: GraphEdge[] = [
  e("junior", "mid", 0.7, 18, ["TypeScript"]),
  e("mid", "senior", 0.55, 24, ["System Design"]),
  e("senior", "lead", 0.3, 30, ["Leadership"]),
  e("mid", "fullstack-mid", 0.4, 12),
  e("junior", "senior", 0.2, 24, ["System Design"]), // shortcut
];

describe("findPaths", () => {
  it("returns the empty array when no path fits the budget", () => {
    const paths = findPaths({
      nodes: NODES,
      edges: EDGES,
      startId: "junior" as unknown as Id<"careerNodes">,
      endId: "lead" as unknown as Id<"careerNodes">,
      budgetMonths: 30, // can't reach lead in 30m (needs 18+24+30=72m or 24+30=54m)
    });
    expect(paths).toEqual([]);
  });

  it("returns ranked paths when reachable", () => {
    const paths = findPaths({
      nodes: NODES,
      edges: EDGES,
      startId: "junior" as unknown as Id<"careerNodes">,
      endId: "senior" as unknown as Id<"careerNodes">,
      budgetMonths: 60,
    });
    expect(paths.length).toBeGreaterThanOrEqual(1);
    // Higher cumulative probability path ranks first.
    expect(paths[0].cumulativeProbability).toBeGreaterThan(0);
    expect(paths[0].score).toBeGreaterThan(0);
  });

  it("prefers the high-probability multi-hop path over the low-prob shortcut", () => {
    const paths = findPaths({
      nodes: NODES,
      edges: EDGES,
      startId: "junior" as unknown as Id<"careerNodes">,
      endId: "senior" as unknown as Id<"careerNodes">,
      budgetMonths: 60,
    });
    // 2-hop path (P=0.385) outscores 1-hop shortcut (P=0.2) on probability,
    // even though hops are longer.
    const first = paths[0];
    expect(first.hops).toBe(2);
    expect(first.cumulativeProbability).toBeCloseTo(0.385, 3);
  });

  it("excludes cycles", () => {
    const cyclicEdges = [
      ...EDGES,
      e("senior", "mid", 0.1, 6), // backwards edge
    ];
    const paths = findPaths({
      nodes: NODES,
      edges: cyclicEdges,
      startId: "junior" as unknown as Id<"careerNodes">,
      endId: "senior" as unknown as Id<"careerNodes">,
      budgetMonths: 60,
    });
    for (const p of paths) {
      const uniq = new Set(p.nodeIds);
      expect(uniq.size).toBe(p.nodeIds.length);
    }
  });

  it("returns a zero-length path when start === end", () => {
    const paths = findPaths({
      nodes: NODES,
      edges: EDGES,
      startId: "senior" as unknown as Id<"careerNodes">,
      endId: "senior" as unknown as Id<"careerNodes">,
      budgetMonths: 12,
    });
    expect(paths).toHaveLength(1);
    expect(paths[0].hops).toBe(0);
    expect(paths[0].cumulativeProbability).toBe(1);
  });

  it("accumulates acquired skills across the path", () => {
    const paths = findPaths({
      nodes: NODES,
      edges: EDGES,
      startId: "junior" as unknown as Id<"careerNodes">,
      endId: "senior" as unknown as Id<"careerNodes">,
      budgetMonths: 60,
    });
    const top = paths[0];
    expect(top.acquiredSkills).toContain("TypeScript");
    expect(top.acquiredSkills).toContain("System Design");
  });
});

describe("applyCalibratedProbabilities", () => {
  const slugByNodeId = new Map<string, string>([
    ["junior", "junior"],
    ["mid", "mid"],
    ["senior", "senior"],
  ]);

  it("substitutes probability when posteriorN >= floor", () => {
    const stats = new Map<string, CalibratedStat>([
      [edgeKey("junior", "mid"), { posteriorProb: 0.42, posteriorN: 20 }],
    ]);
    const result = applyCalibratedProbabilities(
      [e("junior", "mid", 0.7, 18)],
      stats,
      slugByNodeId,
    );
    expect(result[0].probability).toBeCloseTo(0.42);
    expect(result[0].calibrated).toBe(true);
  });

  it("keeps curated probability when posteriorN below floor", () => {
    const stats = new Map<string, CalibratedStat>([
      [
        edgeKey("junior", "mid"),
        { posteriorProb: 0.42, posteriorN: MIN_CALIBRATION_N - 1 },
      ],
    ]);
    const result = applyCalibratedProbabilities(
      [e("junior", "mid", 0.7, 18)],
      stats,
      slugByNodeId,
    );
    expect(result[0].probability).toBeCloseTo(0.7);
    expect(result[0].calibrated).toBeUndefined();
  });

  it("keeps curated probability when no posterior exists", () => {
    const result = applyCalibratedProbabilities(
      [e("junior", "mid", 0.7, 18)],
      new Map(),
      slugByNodeId,
    );
    expect(result[0].probability).toBeCloseTo(0.7);
    expect(result[0].calibrated).toBeUndefined();
  });

  it("returns a new array — input untouched", () => {
    const input = [e("junior", "mid", 0.7, 18)];
    const stats = new Map<string, CalibratedStat>([
      [edgeKey("junior", "mid"), { posteriorProb: 0.42, posteriorN: 20 }],
    ]);
    const result = applyCalibratedProbabilities(input, stats, slugByNodeId);
    expect(input[0].probability).toBeCloseTo(0.7);
    expect(input[0].calibrated).toBeUndefined();
    expect(result).not.toBe(input);
  });

  it("skips when slug map lacks an endpoint", () => {
    const stats = new Map<string, CalibratedStat>([
      [edgeKey("junior", "mid"), { posteriorProb: 0.42, posteriorN: 20 }],
    ]);
    const partialSlugMap = new Map<string, string>([["junior", "junior"]]);
    const result = applyCalibratedProbabilities(
      [e("junior", "mid", 0.7, 18)],
      stats,
      partialSlugMap,
    );
    expect(result[0].probability).toBeCloseTo(0.7);
    expect(result[0].calibrated).toBeUndefined();
  });
});

describe("skillGap", () => {
  it("returns skills missing from the user set", () => {
    const gap = skillGap(
      ["System Design", "Leadership", "Go"],
      ["go", "TypeScript"],
    );
    expect(gap).toEqual(["System Design", "Leadership"]);
  });

  it("is case-insensitive", () => {
    const gap = skillGap(["TypeScript"], ["typescript"]);
    expect(gap).toEqual([]);
  });

  it("returns the full target set when user has nothing", () => {
    expect(skillGap(["A", "B"], [])).toEqual(["A", "B"]);
  });
});
