import { internal } from "../../_generated/api";
import type { ToolDef } from "../types";

/**
 * MCP tools for the `roadmap` domain — the learning plan a user follows to
 * reach a target role. A user has at most ONE active roadmap, which is why
 * there is a `roadmap_get` and no list/id anywhere in this module.
 *
 * Read the contract in convex/mcp/tools/index.ts first. The short version:
 * `userId` arrives from the access token, never from `args`, and the
 * `internal.roadmap.*.mcp*` functions scope every read/write to it.
 */

function requireArg(args: Record<string, unknown>, key: string): string {
  const raw = args[key];
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error(`Parameter ${key} wajib diisi.`);
  }
  return raw;
}

/** Mirrors STATUS_WHITELIST in convex/roadmap/mutations.ts. Hyphenated, not
 *  underscored — a model that guesses "in_progress" gets rejected. */
const SKILL_STATUS_VALUES = ["not-started", "in-progress", "completed"];

export const roadmapTools: ToolDef[] = [
  {
    name: "roadmap_get",
    description:
      "Read the user's active learning roadmap: its career path, overall progress percentage, and every skill with its skill_id, level, status, estimated hours, prerequisites and learning resources. USE THIS FIRST for anything about learning progress — roadmap_set_skill_status and roadmap_toggle_resource both need a skill_id and this is the only place they come from. Returns null when the user has no roadmap yet; offer roadmap_list_templates then. A user has exactly one active roadmap, so there is no id to pass.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: {
      title: "Get roadmap",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId) =>
      await ctx.runQuery(internal.roadmap.queries.mcpGetRoadmap, { userId }),
  },

  {
    name: "roadmap_list_templates",
    description:
      "Browse the public roadmap catalog: slug, title, domain, description, tags, skill count and total estimated hours for each. Use it to answer 'what roadmaps are there' and ALWAYS before roadmap_start_from_template, because that tool takes a slug and an invented one is rejected. This lists what the app ships — it is not a web search, so if nothing matches say so rather than inventing a slug.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: {
      title: "List roadmap templates",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx) =>
      await ctx.runQuery(internal.roadmap.templates.mcpListTemplates, {}),
  },

  {
    name: "roadmap_start_from_template",
    description:
      "Start a roadmap from a catalog template — 'begin the React roadmap', 'set my plan to data-engineer'. slug must match roadmap_list_templates exactly (lowercase, hyphenated). This REPLACES any active roadmap and its progress is lost, so when roadmap_get shows an existing roadmap, tell the user what they are about to lose and get a yes first. The template stays bookmarked either way.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description:
            "Exact slug from roadmap_list_templates, e.g. 'frontend-react'.",
        },
      },
      required: ["slug"],
      additionalProperties: false,
    },
    annotations: {
      title: "Start roadmap from template",
      readOnlyHint: false,
      // Drops the existing roadmap's progress — that is unrecoverable, so
      // hosts must prompt even though re-running with the same slug is safe.
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.roadmap.mutations.mcpStartFromTemplate, {
        userId,
        slug: requireArg(args, "slug"),
      }),
  },

  {
    name: "roadmap_set_skill_status",
    description:
      "Move one skill on the active roadmap between not-started, in-progress and completed — the tool for 'I finished React', 'I started learning TypeScript'. Needs a skill_id from roadmap_get; that id is a slug-like template key, NOT a database id, and the status strings are hyphenated ('in-progress', never 'in_progress'). Setting 'completed' stamps the completion time and recomputes the roadmap's overall progress. Use roadmap_toggle_resource instead when the user finished one course or article rather than the whole skill.",
    inputSchema: {
      type: "object",
      properties: {
        skill_id: { type: "string", description: "skill_id from roadmap_get." },
        status: {
          type: "string",
          enum: SKILL_STATUS_VALUES,
          description: "New status for this skill.",
        },
      },
      required: ["skill_id", "status"],
      additionalProperties: false,
    },
    annotations: {
      title: "Set skill status",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.roadmap.mutations.mcpSetSkillStatus, {
        userId,
        skillId: requireArg(args, "skill_id"),
        status: requireArg(args, "status"),
      }),
  },

  {
    name: "roadmap_toggle_resource",
    description:
      "Tick one learning resource (a course, book, article or video) inside a skill as done or not done — 'I finished the Dicoding course', 'I read that article'. resource_title must match the resource's title from roadmap_get character for character; there is no fuzzy match and a near-miss is rejected. Note that titles are not unique within a skill, so two identically-titled resources flip together. This does not change the skill's own status — use roadmap_set_skill_status for that.",
    inputSchema: {
      type: "object",
      properties: {
        skill_id: { type: "string", description: "skill_id from roadmap_get." },
        resource_title: {
          type: "string",
          description: "Exact resource title as returned by roadmap_get.",
        },
        completed: {
          type: "boolean",
          description: "True when the user has finished this resource.",
        },
      },
      required: ["skill_id", "resource_title", "completed"],
      additionalProperties: false,
    },
    annotations: {
      title: "Toggle learning resource",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) => {
      const completed = args.completed;
      if (typeof completed !== "boolean") {
        throw new Error("Parameter completed wajib true atau false.");
      }
      return await ctx.runMutation(internal.roadmap.mutations.mcpToggleResource, {
        userId,
        skillId: requireArg(args, "skill_id"),
        resourceTitle: requireArg(args, "resource_title"),
        completed,
      });
    },
  },

  {
    name: "roadmap_reset",
    description:
      "Delete the active roadmap and all progress on it. There is no undo and no partial version — confirm with the user first. If they actually want a DIFFERENT roadmap, call roadmap_start_from_template instead; it replaces the old one in a single step. Bookmarked templates survive, so they can start over later.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: {
      title: "Reset roadmap",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId) =>
      await ctx.runMutation(internal.roadmap.mutations.mcpReset, { userId }),
  },
];
