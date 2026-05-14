import { TECH_NODES, TECH_EDGES, type SeedNode, type SeedEdge } from "./tech";
import type { SeniorityLevel } from "./types";

export type { SeedNode, SeedEdge, SeniorityLevel };

/**
 * Concatenation of every domain's seed nodes / edges. Future
 * domains (business, creative, education) drop in here without
 * touching the loader in `engine/graph/mutations.ts`.
 */
export const CAREER_GRAPH_SEED: { nodes: SeedNode[]; edges: SeedEdge[] } = {
  nodes: [...TECH_NODES],
  edges: [...TECH_EDGES],
};
