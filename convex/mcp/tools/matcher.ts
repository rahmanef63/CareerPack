import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { ToolDef } from "../types";

/**
 * MCP tools for the `matcher` domain — the public job feed, the user's own
 * saved listings, and ATS scans of a CV against a job description.
 *
 * Read the contract in convex/mcp/tools/index.ts first. The short version:
 * `userId` arrives from the access token, never from `args`. `jobListings`
 * is the one public table here, so reads of it are not ownership-scoped;
 * `atsScans` is private and every row is re-checked.
 *
 * `matcher_scan_ats` is the only tool in this repo that spends money. It runs
 * the app's AI pipeline (requireQuota -> sanitizeAIInput -> wrapUserInput ->
 * proxy) against a shared, funded gateway key, so a connected MCP client is
 * drawing on the same 10/min + 100/day the user gets in the browser and on
 * the 300/hour ceiling every user shares. Hence openWorldHint on that one
 * tool, and hence the quota sentence being unwrapped below instead of
 * reaching the model as a JSON blob.
 *
 * There is deliberately no AI job-description parser (the app's
 * `matcher.external.parseJobFromText`). The caller here is a model that has
 * already read the posting; making it call ours to re-read the same text
 * would burn quota to do worse. `matcher_add_job` takes the fields directly.
 */

function requireArg(args: Record<string, unknown>, key: string): string {
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

function optionalNumber(
  args: Record<string, unknown>,
  key: string,
): number | undefined {
  const raw = args[key];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
}

/**
 * Quota and gateway failures are thrown as `ConvexError({ message })` so the
 * web app's toast can read `data.message` un-redacted. Across a tool call all
 * the dispatcher sees is `err.message`, which for a ConvexError is the JSON
 * of that object — the user would be shown `{"message":"Rate limit …"}`.
 * Re-throwing the sentence keeps the isError text something a model can read
 * aloud, including the "try again in N minutes" that makes it actionable.
 */
function sentence(err: unknown, fallback: string): string {
  const data = (err as { data?: unknown })?.data;
  if (data && typeof data === "object") {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  if (typeof data === "string" && data.length > 0) return data;
  return err instanceof Error && err.message ? err.message : fallback;
}

const WORK_MODES = ["remote", "hybrid", "onsite"];
const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "internship"];
const SENIORITIES = ["junior", "mid-level", "senior", "lead"];
/** Mirrors the categories the feed importer assigns; the pill on a job card
 *  renders from this, so a value outside the set shows up as no pill. */
const CATEGORIES = [
  "engineering",
  "design",
  "support",
  "product",
  "marketing",
  "data",
];

export const matcherTools: ToolDef[] = [
  {
    name: "matcher_list_jobs",
    description:
      "Browse job listings: title, company, location, work mode, seniority, salary range, required skills and a 300-character description preview. The feed is shared by every CareerPack user (imported from RemoteOK and WeWorkRemotely, plus listings people paste in) — set mine=true to see only the ones THIS user saved. Use it to answer 'what is out there' and to get the job_id matcher_scan_ats needs. The preview is truncated; the ATS scan reads the full text server-side, so there is no need to fetch more.",
    inputSchema: {
      type: "object",
      properties: {
        mine: {
          type: "boolean",
          description:
            "true returns only listings this user added. Default false (the shared feed).",
        },
        work_mode: {
          type: "string",
          enum: WORK_MODES,
          description: "Filter by work mode. Omit for all.",
        },
        limit: {
          type: "number",
          description: "How many listings to return. Default 15, max 50.",
        },
      },
      additionalProperties: false,
    },
    annotations: {
      title: "List job listings",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runQuery(internal.mcp.data.matcher.listJobs, {
        userId,
        mine: args.mine === true,
        workMode: optionalArg(args, "work_mode"),
        limit: optionalNumber(args, "limit"),
      }),
  },

  {
    name: "matcher_add_job",
    description:
      "Save a job the user found elsewhere, so it can be scanned against their CV and kept alongside the rest. YOU do the parsing: read the posting the user pasted and fill these fields in — there is no AI parser behind this tool and none is needed. Keep `description` as the substantive requirements text, at least 40 characters, because that is what the ATS scan scores against; a one-line summary produces a meaningless score. The listing is marked as the user's own and appears under mine=true.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Position title. Max 200 characters." },
        company: { type: "string", description: "Company name. Max 200 characters." },
        location: {
          type: "string",
          description: "City/country, or 'Remote'. Max 120 characters.",
        },
        work_mode: { type: "string", enum: WORK_MODES, description: "Work mode." },
        employment_type: {
          type: "string",
          enum: EMPLOYMENT_TYPES,
          description: "Contract shape.",
        },
        seniority: {
          type: "string",
          enum: SENIORITIES,
          description: "Level, inferred from the title and required experience.",
        },
        description: {
          type: "string",
          description:
            "The requirements and responsibilities, 40-8000 characters. This is what the ATS scan reads — keep the real wording.",
        },
        required_skills: {
          type: "array",
          items: { type: "string" },
          description:
            "5-15 short technical terms as written in the posting ('React', 'Node.js', 'SQL'), up to 30.",
        },
        category: {
          type: "string",
          enum: CATEGORIES,
          description: "Functional area, for the badge on the job card.",
        },
        salary_min: { type: "number", description: "Lower bound, raw number." },
        salary_max: { type: "number", description: "Upper bound, raw number." },
        currency: {
          type: "string",
          description: "Currency of the salary range, e.g. IDR or USD.",
        },
        apply_url: {
          type: "string",
          description: "Link to apply. Must start with http:// or https://.",
        },
      },
      required: [
        "title",
        "company",
        "location",
        "work_mode",
        "employment_type",
        "seniority",
        "description",
        "required_skills",
      ],
      additionalProperties: false,
    },
    annotations: {
      title: "Save job listing",
      readOnlyHint: false,
      destructiveHint: false,
      // Two calls save the same job twice; nothing de-duplicates pastes.
      idempotentHint: false,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) => {
      const skills = args.required_skills;
      if (!Array.isArray(skills) || skills.some((s) => typeof s !== "string")) {
        throw new Error("Parameter required_skills harus berupa array teks.");
      }
      return await ctx.runMutation(internal.mcp.data.matcher.addJob, {
        userId,
        title: requireArg(args, "title"),
        company: requireArg(args, "company"),
        location: requireArg(args, "location"),
        workMode: requireArg(args, "work_mode"),
        employmentType: requireArg(args, "employment_type"),
        seniority: requireArg(args, "seniority"),
        description: requireArg(args, "description"),
        requiredSkills: skills as string[],
        category: optionalArg(args, "category"),
        salaryMin: optionalNumber(args, "salary_min"),
        salaryMax: optionalNumber(args, "salary_max"),
        currency: optionalArg(args, "currency"),
        applyUrl: optionalArg(args, "apply_url"),
      });
    },
  },

  {
    name: "matcher_scan_ats",
    description:
      "Score one of the user's CVs against one job description the way an applicant tracking system would, and save the result. Give it a cv_id (from cv_list) plus EITHER a job_id from matcher_list_jobs OR the description text in jd_text — not both; job_id is preferred because the stored listing is the full posting. Returns the score and grade; call matcher_get_scan afterwards for the keyword-by-keyword breakdown. THIS ONE COSTS: it runs a server-side AI call against a shared budget, so use it when the user asks how well they match a specific job, not to survey a list of them. If it comes back saying the limit is reached, tell the user what it said — the wait is real and retrying immediately just fails again.",
    inputSchema: {
      type: "object",
      properties: {
        cv_id: { type: "string", description: "Id from cv_list." },
        job_id: {
          type: "string",
          description: "Id from matcher_list_jobs. Preferred over jd_text.",
        },
        jd_text: {
          type: "string",
          description:
            "Raw job description, at least 40 characters. Use only when the job is not in the feed.",
        },
        job_title: {
          type: "string",
          description:
            "Title to file the scan under. Used only with jd_text; ignored when job_id is given.",
        },
        job_company: {
          type: "string",
          description: "Company to file the scan under. Used only with jd_text.",
        },
      },
      required: ["cv_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Run ATS scan",
      readOnlyHint: false,
      destructiveHint: false,
      // Each call writes a new scan row AND spends a slice of the shared AI
      // quota, so a host must not silently retry it.
      idempotentHint: false,
      // Reaches a third-party LLM gateway: latency, cost and failure modes
      // that are not this database's.
      openWorldHint: true,
    },
    handler: async (ctx, userId, args) => {
      const jobId = optionalArg(args, "job_id");
      const jdText = optionalArg(args, "jd_text");
      if (!jobId && !jdText) {
        throw new Error("Isi salah satu: job_id atau jd_text.");
      }
      try {
        const result = await ctx.runAction(
          internal.matcher.actions._scanCVForUser,
          {
            userId,
            cvId: requireArg(args, "cv_id") as Id<"cvs">,
            jobListingId: jobId as Id<"jobListings"> | undefined,
            jdText,
            jobTitle: optionalArg(args, "job_title"),
            jobCompany: optionalArg(args, "job_company"),
          },
        );
        return {
          scan_id: result.scanId,
          score: result.score,
          grade: result.grade,
        };
      } catch (err) {
        throw new Error(sentence(err, "Scan ATS gagal. Coba lagi sebentar lagi."));
      }
    },
  },

  {
    name: "matcher_list_scans",
    description:
      "List past ATS scans, newest first: which CV was scanned against which job, the score and grade, and when. Use it for 'what did I score' or to track whether CV edits are helping, and to get the scan_id for matcher_get_scan. Reading history is free — prefer it over re-running matcher_scan_ats on a job that was already scanned.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "How many scans to return. Default 10, max 50.",
        },
      },
      additionalProperties: false,
    },
    annotations: {
      title: "List ATS scans",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runQuery(internal.mcp.data.matcher.listScans, {
        userId,
        limit: optionalNumber(args, "limit"),
      }),
  },

  {
    name: "matcher_get_scan",
    description:
      "Read one ATS scan in full — scan_id comes from matcher_list_scans, or from what matcher_scan_ats just returned: the five sub-scores (keyword coverage, hard skills, experience fit, section completeness, parseability), which keywords were matched and which are missing, formatting problems, and the recommendations. This is what turns a bare number into advice — use it whenever the user asks why a score is what it is or how to raise it. Costs nothing; the AI work was done when the scan ran. Returns null if no scan with that id belongs to the user.",
    inputSchema: {
      type: "object",
      properties: {
        scan_id: { type: "string", description: "Id from matcher_list_scans." },
      },
      required: ["scan_id"],
      additionalProperties: false,
    },
    annotations: {
      title: "Get ATS scan",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    handler: async (ctx, userId, args) =>
      await ctx.runQuery(internal.mcp.data.matcher.getScan, {
        userId,
        scanId: requireArg(args, "scan_id") as Id<"atsScans">,
      }),
  },
];
