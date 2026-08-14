import { scopeForTool, type ResolvedTool, type ToolDef } from "../types";

import { cvTools } from "./cv";
import { applicationsTools } from "./applications";
import { documentsTools } from "./documents";
import { roadmapTools } from "./roadmap";
import { calendarTools } from "./calendar";
import { contactsTools } from "./contacts";
import { portfolioTools } from "./portfolio";
import { portfolioMediaTools } from "./portfolioMedia";
import { mockInterviewTools } from "./mockInterview";
import { financialTools } from "./financial";
import { goalsTools } from "./goals";
import { profileTools } from "./profile";
import { matcherTools } from "./matcher";
import { filesTools } from "./files";
import { notificationsTools } from "./notifications";

/**
 * The MCP tool catalog. One module per backend domain; this file only
 * concatenates them, so filling in a domain never touches the index and two
 * people can work on two domains at once.
 *
 * ============================ THE CONTRACT ============================
 *
 * ToolDef (convex/mcp/types.ts):
 *
 *   name         snake_case, domain-prefixed: `cv_list`, `applications_create`.
 *                Narrow names beat mega-tools — a host can "always allow"
 *                `cv_list` without also allowing a delete.
 *   description  MODEL-facing prompt context, English, and the LLM reads it
 *                on every call to PICK a tool. Include one WHEN-TO-USE
 *                sentence, one WHEN-NOT-TO-USE sentence whenever a sibling
 *                tool is ambiguous, plus the rules the model cannot guess:
 *                enum values, defaults, date format, what a flag flips.
 *   inputSchema  JSON Schema object. Every property the handler reads must
 *                appear here or the model will never send it.
 *   annotations  readOnlyHint / destructiveHint / idempotentHint /
 *                openWorldHint — all four, always. Hosts skip the
 *                confirmation prompt on readOnly and force one on
 *                destructive; a wrong hint is either nagging or data loss.
 *   handler      async (ctx, userId, args) => JSON-serialisable value.
 *
 * OWNERSHIP — this is what stops token A from reading user B's data:
 *
 *   1. `userId` is handed to the handler by the dispatcher and comes from
 *      the `oauthAccessTokens` row the bearer resolved to. It is never read
 *      from `args`; the dispatcher deletes `userId`/`user_id` off client
 *      input before the handler sees it.
 *   2. `getAuthUserId(ctx)` returns null inside an MCP request and
 *      `requireUser(ctx)` throws — there is no @convex-dev/auth session. So
 *      a handler MUST NOT call the app's public queries/mutations. It calls
 *      an internalQuery/internalMutation in convex/mcp/data/<domain>.ts that
 *      takes `userId: v.id("users")` as an explicit arg.
 *   3. Every one of those internal functions re-checks ownership on every
 *      document it touches — reads return null, writes throw the app's
 *      Indonesian "… tidak ditemukan" (never "forbidden", which would
 *      confirm the id exists):
 *
 *          const doc = await ctx.db.get(args.cvId);
 *          if (!doc || doc.userId !== args.userId) return null;
 *
 *      Lists go through the `by_user` index. Never `.collect()` the whole
 *      table and `.filter()` — one forgotten filter leaks everyone.
 *
 * OTHER RULES
 *
 *   - Static top-level imports only. `internalMutation` rejects dynamic
 *     `await import(...)` with "dynamic module import unsupported", and only
 *     at the first real call — deploy and typecheck both stay green.
 *   - Write tools wrap their mutation with `enforceRateLimit(ctx, userId,
 *     MCP_WRITE_LIMIT)` and `MCP_WRITE_DAILY_LIMIT` (convex/mcp/data/limits.ts).
 *   - A tool that fans out to the LLM keeps the app's pipeline intact:
 *     requireQuota -> sanitizeAIInput -> wrapUserInput -> proxy.
 *   - Handler throws are caught by the dispatcher and returned as
 *     `isError: true` text, so throwing a plain Indonesian sentence is the
 *     right way to report a failure.
 *   - Never return storage ids, tokens, or raw email/IP in tool output —
 *     it all lands in a third party's transcript.
 *   - If a list can exceed a few hundred rows, paginate, and keep the names
 *     identical across inputSchema, handler args and internal query args
 *     (`cursor`, `limit`), and the response keys identical to what the
 *     handler returns (`{ items, nextCursor, total }`). A rename in one of
 *     the three is invisible to TypeScript and surfaces to the user as a
 *     vague "validation error" from the model.
 *
 * Worked example: convex/mcp/tools/cv.ts + convex/mcp/data/cv.ts.
 * ======================================================================
 */
export const TOOLS: ToolDef[] = [
  ...cvTools,
  ...applicationsTools,
  ...documentsTools,
  ...roadmapTools,
  ...calendarTools,
  ...contactsTools,
  ...portfolioTools,
  ...portfolioMediaTools,
  ...mockInterviewTools,
  ...financialTools,
  ...goalsTools,
  ...profileTools,
  ...matcherTools,
  ...filesTools,
  ...notificationsTools,
];

/**
 * Every tool with its required scope resolved. Derived from
 * `annotations.readOnlyHint` rather than written per tool, so the scope and
 * the annotation can never disagree — they assert the same fact, and asserting
 * it twice is how they drift.
 */
export const RESOLVED_TOOLS: readonly ResolvedTool[] = TOOLS.map((t) => ({
  ...t,
  scope: scopeForTool(t),
}));

export const TOOL_BY_NAME: ReadonlyMap<string, ResolvedTool> = new Map(
  RESOLVED_TOOLS.map((t) => [t.name, t]),
);

/**
 * The exact `tools/list` payload — the whole model-facing contract, in one
 * place so the dispatcher and the snapshot test cannot describe different
 * things. A test that rebuilt this mapping itself would keep passing while
 * the wire format drifted underneath it.
 */
export const toolDescriptors = (): Array<Record<string, unknown>> =>
  RESOLVED_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
    annotations: t.annotations,
    ...(t.meta ? { _meta: t.meta } : {}),
  }));

// Two domains picking the same name (`documents_list`) would silently
// shadow one another in the Map, and the losing tool would be listed to the
// model but dispatch to the winner. Fail at module load instead.
if (TOOL_BY_NAME.size !== RESOLVED_TOOLS.length) {
  const seen = new Set<string>();
  const dupes = TOOLS.map((t) => t.name).filter((n) => !seen.add(n));
  throw new Error(`Duplicate MCP tool name(s): ${dupes.join(", ")}`);
}
