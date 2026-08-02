import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { optionalUser } from "../_shared/auth";

export const getUserRoadmap = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUser(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("skillRoadmaps")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

// ---------------------------------------------------------------------------
// MCP (convex/mcp/tools/roadmap.ts). `optionalUser` returns null in an MCP
// request — no @convex-dev/auth session — so the user id arrives as an
// explicit arg resolved from the bearer token and scopes the `by_user` read.
// ---------------------------------------------------------------------------

export const mcpGetRoadmap = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const roadmap = await ctx.db
      .query("skillRoadmaps")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!roadmap) return null;
    return {
      career_path: roadmap.careerPath,
      progress: roadmap.progress,
      skills: roadmap.skills.map((s) => ({
        // Template-scoped string key, not a Convex row id — this is what
        // roadmap_set_skill_status and roadmap_toggle_resource take.
        skill_id: s.id,
        name: s.name,
        category: s.category,
        level: s.level,
        status: s.status,
        estimated_hours: s.estimatedHours,
        prerequisites: s.prerequisites,
        resources: s.resources.map((r) => ({
          title: r.title,
          type: r.type,
          url: r.url,
          completed: r.completed,
        })),
      })),
    };
  },
});
