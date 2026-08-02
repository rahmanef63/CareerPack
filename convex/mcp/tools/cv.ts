import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { ToolDef } from "../types";

/**
 * MCP tools for the `cv` domain — the worked example for the other 13
 * modules. Read the contract in convex/mcp/tools/index.ts first; the short
 * version is that `userId` arrives from the access token, never from `args`,
 * and every internal function re-checks it against the document.
 */

function requireId(args: Record<string, unknown>, key: string): string {
  const raw = args[key];
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error(`Parameter ${key} wajib diisi.`);
  }
  return raw;
}

function optionalArg(
  args: Record<string, unknown>,
  key: string,
): string | undefined {
  const raw = args[key];
  return typeof raw === "string" && raw.length > 0 ? raw : undefined;
}

/**
 * `cv_id` is optional on the write tools: every one of them falls back to the
 * user's default CV, which is what a person means by "my CV" when they only
 * have one. Stated in each description so the model does not invent an id.
 */
const CV_ID_OPTIONAL = {
  type: "string",
  description: "Id from cv_list. Omit to use the user's default CV.",
} as const;

export const cvTools: ToolDef[] = [
  {
    name: "cv_list",
    description:
      "List every CV the signed-in user owns, with its id, title, template and whether it is the default. USE THIS FIRST whenever the user talks about 'my CV' without naming one — every other cv_* tool needs a cv_id and this is where ids come from. Returns all CVs; there is no pagination because a user keeps only a handful.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: {
      title: "List CVs",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId) =>
      await ctx.runQuery(internal.mcp.data.cv.listCVs, { userId }),
  },

  {
    name: "cv_get",
    description:
      "Read one CV in full: personal info, experience, education, skills, certifications, languages and projects. Use it before answering questions about the user's background or rewriting any part of a CV, so the answer is grounded in what is actually stored. Needs a cv_id from cv_list. Returns null if no CV with that id belongs to the user.",
    inputSchema: {
      type: "object",
      properties: {
        cv_id: {
          type: "string",
          description: "Id from cv_list.",
        },
      },
      required: ["cv_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Get CV",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runQuery(internal.mcp.data.cv.getCV, {
        userId,
        cvId: requireId(args, "cv_id") as Id<"cvs">,
      }),
  },

  {
    name: "cv_set_summary",
    description:
      "Replace the professional summary (the paragraph at the top) of one CV. This OVERWRITES the existing summary, so read it with cv_get first and show the user the new text before calling. Write in the language the CV itself uses — these CVs are usually Indonesian. Max 2000 characters. Do not use this to edit experience, skills or education.",
    inputSchema: {
      type: "object",
      properties: {
        cv_id: { type: "string", description: "Id from cv_list." },
        summary: {
          type: "string",
          description: "New summary paragraph, max 2000 characters.",
        },
      },
      required: ["cv_id", "summary"],
      additionalProperties: false,
    },
    annotations: {
      title: "Set CV summary",
      readOnlyHint: false,
      // Overwrites one field of a document the user can see and re-edit —
      // recoverable, so hosts should not treat it like a delete. Idempotent
      // because the same call twice leaves the same text.
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) => {
      const summary = args.summary;
      if (typeof summary !== "string") {
        throw new Error("Parameter summary wajib diisi.");
      }
      return await ctx.runMutation(internal.mcp.data.cv.setSummary, {
        userId,
        cvId: requireId(args, "cv_id") as Id<"cvs">,
        summary,
      });
    },
  },

  {
    name: "cv_create",
    description:
      "Create a new, empty CV. It is prefilled from the user's profile (name, email, phone, location, bio) and nothing else — call cv_add_experience, cv_add_skills and cv_set_summary afterwards to fill it in. template must be 'classic' (photo sidebar, serif, suits Indonesian corporates and BUMN), 'modern' (bold sans header, suits startups and product roles) or 'minimal' (one column, no colour, the safest choice for ATS screening and overseas applications); ask which they want rather than defaulting silently. Give the title a purpose — 'CV Frontend Engineer 2026' beats 'CV'. Use this only when the user wants a SEPARATE CV; to change an existing one, edit it.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "How the user will recognise this CV in their list.",
        },
        template: {
          type: "string",
          enum: ["classic", "modern", "minimal"],
          description: "Layout. See the tool description for which fits when.",
        },
      },
      required: ["title", "template"],
      additionalProperties: false,
    },
    annotations: {
      title: "Create CV",
      readOnlyHint: false,
      destructiveHint: false,
      // Two calls leave two near-identical CVs for the user to clean up.
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.cv.mutations.mcpCreate, {
        userId,
        title: requireId(args, "title"),
        template: requireId(args, "template"),
      }),
  },

  {
    name: "cv_add_experience",
    description:
      "Append one job to a CV's work history. Dates are 'YYYY-MM' ('2024-01'), not full dates. For the user's current job, set current true and leave end_date out. achievements are the bullet points under the role — concrete and measurable ('cut checkout load time 40%'), one per array entry, kept separate from description, which is the one-line summary of the role. This APPENDS; it cannot edit or remove an existing entry, so read cv_get first and tell the user if the role is already there. Omit cv_id to target their default CV.",
    inputSchema: {
      type: "object",
      properties: {
        cv_id: CV_ID_OPTIONAL,
        company: { type: "string", description: "Employer name." },
        position: { type: "string", description: "Job title held." },
        start_date: { type: "string", description: "YYYY-MM, e.g. '2024-01'." },
        end_date: {
          type: "string",
          description: "YYYY-MM. Omit when this is the current job.",
        },
        current: {
          type: "boolean",
          description:
            "True when the user still works here. Inferred from a missing end_date.",
        },
        description: {
          type: "string",
          description: "One or two lines on what the role involved.",
        },
        achievements: {
          type: "array",
          items: { type: "string" },
          description: "Bullet points, one accomplishment each.",
        },
      },
      required: ["company", "position", "start_date"],
      additionalProperties: false,
    },
    annotations: {
      title: "Add CV experience",
      readOnlyHint: false,
      destructiveHint: false,
      // Appends: a retry duplicates the job on the CV.
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) => {
      const current = args.current;
      if (current !== undefined && typeof current !== "boolean") {
        throw new Error("Parameter current harus true atau false.");
      }
      const achievements = args.achievements;
      if (
        achievements !== undefined &&
        (!Array.isArray(achievements) ||
          achievements.some((a) => typeof a !== "string"))
      ) {
        throw new Error("Parameter achievements harus berupa daftar teks.");
      }
      return await ctx.runMutation(internal.cv.mutations.mcpAppendExperience, {
        userId,
        cvId: optionalArg(args, "cv_id") as Id<"cvs"> | undefined,
        company: requireId(args, "company"),
        position: requireId(args, "position"),
        startDate: requireId(args, "start_date"),
        endDate: optionalArg(args, "end_date"),
        current,
        description: optionalArg(args, "description"),
        achievements: achievements as string[] | undefined,
      });
    },
  },

  {
    name: "cv_add_skills",
    description:
      "Append skills to a CV. Pass short names the way a recruiter scans them — 'React', 'TypeScript', 'Figma' — not sentences. Skills already on the CV are skipped case-insensitively, so it is safe to send a list that overlaps what is there. category groups them on the rendered CV: 'technical', 'soft', 'tools' or 'general' (the default). proficiency is 1-5 and applies to every skill in the call, so split the call when levels differ. Omit cv_id to target the user's default CV.",
    inputSchema: {
      type: "object",
      properties: {
        cv_id: CV_ID_OPTIONAL,
        skills: {
          type: "array",
          items: { type: "string" },
          description: "Short skill names, e.g. ['React', 'TypeScript'].",
        },
        category: {
          type: "string",
          enum: ["technical", "soft", "tools", "general"],
          description: "Grouping on the CV. Defaults to 'general'.",
        },
        proficiency: {
          type: "number",
          description: "1-5, applied to every skill in this call. Defaults to 3.",
        },
      },
      required: ["skills"],
      additionalProperties: false,
    },
    annotations: {
      title: "Add CV skills",
      readOnlyHint: false,
      destructiveHint: false,
      // Duplicates are skipped, so re-sending the same list is a no-op.
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) => {
      const skills = args.skills;
      if (!Array.isArray(skills) || skills.some((s) => typeof s !== "string")) {
        throw new Error("Parameter skills harus berupa daftar teks.");
      }
      const proficiency = args.proficiency;
      if (proficiency !== undefined && typeof proficiency !== "number") {
        throw new Error("Parameter proficiency harus berupa angka 1-5.");
      }
      return await ctx.runMutation(internal.cv.mutations.mcpAppendSkills, {
        userId,
        cvId: optionalArg(args, "cv_id") as Id<"cvs"> | undefined,
        skills: skills as string[],
        category: optionalArg(args, "category"),
        proficiency,
      });
    },
  },

  {
    name: "cv_delete",
    description:
      "Permanently delete one CV and its ATS scan history. There is no undo and no draft left behind, so confirm with the user first and never delete one just because they asked for a new one. Job applications that referenced it survive but lose the link. Needs a cv_id from cv_list — this one does NOT fall back to the default CV.",
    inputSchema: {
      type: "object",
      properties: {
        cv_id: { type: "string", description: "Id from cv_list." },
      },
      required: ["cv_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Delete CV",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runMutation(internal.cv.mutations.mcpDelete, {
        userId,
        cvId: requireId(args, "cv_id") as Id<"cvs">,
      }),
  },
];
