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
// Public SEO catalog — powers /roadmap and /roadmap/[slug], which are crawled
// by Google with no session at all. Deliberately UNAUTHENTICATED: no
// `requireUser`, no `optionalUser`. There is nothing user-scoped to gate here,
// and calling `optionalUser` would only add a no-op await.
//
// `isPublic` is the ONLY visibility boundary. It is the author's consent flag
// (community templates are published through `publishMyRoadmap` and can be
// unpublished by an admin), so a false row must not surface in the list, in
// the detail page, or in `generateStaticParams`. Both handlers below filter on
// it — do not "optimise" the check away by trusting the index.
//
// Kept separate from `templates.ts:listPublicTemplates` / `getTemplateBySlug`
// on purpose: those two shape the payload for the logged-in browser UI and
// `getTemplateBySlug` intentionally ALSO serves non-public rows to their author
// and to admins. That extra reach is exactly what a public page must not have.
// ---------------------------------------------------------------------------

/**
 * Index payload for /roadmap. Projected down to card fields — `nodes[]` is
 * ~10k words across the catalog and must never ship with a list query.
 */
export const listPublicRoadmaps = query({
  args: {},
  handler: async (ctx) => {
    // `by_order` returns ascending by the indexed field, which is the
    // curated catalog order the dashboard browser already uses.
    const all = await ctx.db
      .query("roadmapTemplates")
      .withIndex("by_order")
      .collect();
    return all
      .filter((t) => t.isPublic)
      .map((t) => ({
        slug: t.slug,
        title: t.title,
        description: t.description,
        domain: t.domain,
        icon: t.icon,
        color: t.color,
        tags: t.tags,
        nodeCount: t.nodes.length,
        totalHours: t.nodes.reduce((sum, n) => sum + n.estimatedHours, 0),
      }));
  },
});

/**
 * Full roadmap for /roadmap/[slug]. Returns null for both "no such slug" and
 * "slug exists but is not public" so the page cannot be used to probe for
 * unpublished community templates — same reasoning as `requireOwnedDoc`
 * throwing "not found" instead of "forbidden".
 */
export const getPublicRoadmap = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const tpl = await ctx.db
      .query("roadmapTemplates")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!tpl || !tpl.isPublic) return null;
    // Projected, not returned raw. The sibling `listPublicRoadmaps` already
    // does this; returning `tpl` whole handed every anonymous caller the
    // author's Convex user id (`authorId`) alongside the content. `authorName`
    // stays because the page renders a byline, but the id is an internal
    // handle that lets a caller correlate rows across tables.
    const { authorId: _authorId, ...publicFields } = tpl;
    return publicFields;
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
