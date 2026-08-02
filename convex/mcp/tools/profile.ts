import { internal } from "../../_generated/api";
import type { ToolDef } from "../types";

/**
 * MCP tools for the `profile` domain — who the user is and what they are
 * aiming at.
 *
 * Read the contract in convex/mcp/tools/index.ts first. The short version:
 * `userId` arrives from the access token, never from `args`, and the internal
 * functions re-check it against the row.
 *
 * The read side is convex/mcp/data/profile.ts; the write side is
 * `internal.profile.mutations._patchProfileFor`, which lives beside the
 * app's own patch so both share one set of field limits.
 *
 * Two things are deliberately not here. Email and phone are never returned —
 * a career assistant does not need them and everything a tool returns is
 * copied into a third party's transcript. And the public branding page has no
 * write tool: publishing a page under the user's name is a decision to make
 * on the page where they can see it, not one for a chat client to take.
 */

function optionalArg(
  args: Record<string, unknown>,
  key: string,
): string | undefined {
  const raw = args[key];
  return typeof raw === "string" ? raw : undefined;
}

function optionalStringArray(
  args: Record<string, unknown>,
  key: string,
): string[] | undefined {
  const raw = args[key];
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw) || raw.some((s) => typeof s !== "string")) {
    throw new Error(`Parameter ${key} harus berupa array teks.`);
  }
  return raw as string[];
}

export const profileTools: ToolDef[] = [
  {
    name: "profile_get",
    description:
      "Read the user's career profile: full name, location, the role they are targeting, experience level, bio, skills, interests, preferred industries, their LinkedIn and portfolio links, whether their public CareerPack page is live (and its URL), and whether they get the weekly job digest. USE THIS FIRST before giving any career advice, writing anything in their voice, or judging whether a job suits them — it is the cheapest way to stop guessing. Returns null if they have not completed onboarding.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: {
      title: "Get profile",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId) =>
      await ctx.runQuery(internal.mcp.data.profile.getProfile, { userId }),
  },

  {
    name: "profile_update",
    description:
      "Update the career profile. Send only the fields that change; anything omitted is left alone. Every field REPLACES the stored value rather than merging — to add one skill, read profile_get and send the whole list back with the new entry, or the others are lost. target_role and skills are what the job matcher scores against, so keeping them current is what makes its recommendations useful. Write bio in the user's own language (usually Indonesian). Fails if the user has not completed onboarding yet — send them to the app for that.",
    inputSchema: {
      type: "object",
      properties: {
        full_name: { type: "string", description: "Max 120 characters." },
        location: {
          type: "string",
          description: "City and country, e.g. 'Jakarta, Indonesia'. Max 120 characters.",
        },
        target_role: {
          type: "string",
          description:
            "The position they are looking for, e.g. 'Backend Engineer'. Max 120 characters.",
        },
        experience_level: {
          type: "string",
          description:
            "One of junior, mid-level, senior, lead — the matcher compares this against a listing's seniority.",
        },
        bio: {
          type: "string",
          description:
            "One or two sentences about them. Max 600 characters. Send an empty string to clear it.",
        },
        skills: {
          type: "array",
          items: { type: "string" },
          description:
            "COMPLETE replacement list, up to 50 entries of 60 characters. Short technical terms ('React', 'SQL'), not sentences.",
        },
        interests: {
          type: "array",
          items: { type: "string" },
          description: "COMPLETE replacement list, up to 50 entries of 60 characters.",
        },
      },
      additionalProperties: false,
    },
    annotations: {
      title: "Update profile",
      readOnlyHint: false,
      // Overwrites fields the user can see and re-edit in Settings.
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.profile.mutations._patchProfileFor, {
        userId,
        fullName: optionalArg(args, "full_name"),
        location: optionalArg(args, "location"),
        targetRole: optionalArg(args, "target_role"),
        experienceLevel: optionalArg(args, "experience_level"),
        bio: optionalArg(args, "bio"),
        skills: optionalStringArray(args, "skills"),
        interests: optionalStringArray(args, "interests"),
      }),
  },
];
