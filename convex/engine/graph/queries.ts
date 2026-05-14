import { v } from "convex/values";
import { query } from "../../_generated/server";
import { optionalUser } from "../../_shared/auth";
import { findPaths, skillGap, type GraphEdge, type GraphNode } from "./lib";
import type { Doc, Id } from "../../_generated/dataModel";

const MAX_NODES = 500;
const MAX_EDGES = 2_000;

/**
 * Lists all career nodes — the universe of selectable "current" /
 * "target" states for the Career Time Machine. Public (no auth)
 * so the dropdown can hydrate on first render of the page.
 */
export const listNodes = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("careerNodes")
      .take(MAX_NODES);
    return rows.sort((a, b) => a.label.localeCompare(b.label));
  },
});

/** Single-node lookup by stable slug. */
export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, { slug }) => {
    const row = await ctx.db
      .query("careerNodes")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    return row;
  },
});

/**
 * Reachability — given a (start, end, budgetMonths) tuple, returns
 * the top ranked paths from the BFS algorithm plus the user's
 * skill-gap against the target node and along-path nodes.
 *
 * `userSkills` is passed by the client (typically derived from
 * `engine.atoms.queries.listByCv` filtered to `type === "skill"`)
 * so this query stays read-only without joining tables.
 */
export const reach = query({
  args: {
    startSlug: v.string(),
    endSlug: v.string(),
    budgetMonths: v.number(),
    userSkills: v.optional(v.array(v.string())),
    topK: v.optional(v.number()),
  },
  returns: v.object({
    startNode: v.union(v.null(), v.any()),
    endNode: v.union(v.null(), v.any()),
    paths: v.array(v.any()),
    targetSkillGap: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    // Auth optional — anonymous browsing OK for the time machine.
    await optionalUser(ctx);

    const startNode = await ctx.db
      .query("careerNodes")
      .withIndex("by_slug", (q) => q.eq("slug", args.startSlug))
      .first();
    const endNode = await ctx.db
      .query("careerNodes")
      .withIndex("by_slug", (q) => q.eq("slug", args.endSlug))
      .first();

    if (!startNode || !endNode) {
      return {
        startNode,
        endNode,
        paths: [],
        targetSkillGap: [],
      };
    }

    const allNodes = await ctx.db.query("careerNodes").take(MAX_NODES);
    const allEdges = await ctx.db.query("careerEdges").take(MAX_EDGES);

    const nodeData: GraphNode[] = allNodes.map((n) => ({
      _id: n._id,
      slug: n.slug,
      label: n.label,
      requiredSkills: n.requiredSkills,
    }));
    const edgeData: GraphEdge[] = allEdges.map((e: Doc<"careerEdges">) => ({
      _id: e._id,
      fromNodeId: e.fromNodeId,
      toNodeId: e.toNodeId,
      probability: e.probability,
      durationMonthsMedian: e.durationMonthsMedian,
      acquiredSkills: e.acquiredSkills,
      sampleSize: e.sampleSize,
    }));

    const paths = findPaths({
      nodes: nodeData,
      edges: edgeData,
      startId: startNode._id as Id<"careerNodes">,
      endId: endNode._id as Id<"careerNodes">,
      budgetMonths: args.budgetMonths,
      topK: args.topK ?? 8,
    });

    // Resolve path nodes for the client so the UI can render labels
    // without a second round-trip.
    const nodeById = new Map<string, Doc<"careerNodes">>(
      allNodes.map((n) => [String(n._id), n]),
    );

    const resolved = paths.map((p) => ({
      ...p,
      nodes: p.nodeIds.map((id) => nodeById.get(String(id))).filter(Boolean),
    }));

    const targetSkillGap = skillGap(
      endNode.requiredSkills,
      args.userSkills ?? [],
    );

    return {
      startNode,
      endNode,
      paths: resolved,
      targetSkillGap,
    };
  },
});
