import type { ActionCtx } from "../_generated/server";
import {
  RPC_ERROR,
  SERVER_INFO,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type McpAuth,
  negotiateProtocolVersion,
  satisfiesScope,
} from "./types";
import { SERVER_INSTRUCTIONS } from "./instructions";
import { TOOL_BY_NAME, toolDescriptors } from "./tools";

/**
 * JSON-RPC dispatch for the MCP endpoint.
 *
 * Takes an already-authenticated request: the bearer was resolved once in
 * the httpAction (convex/mcp/auth.ts) because `getAuthUserId(ctx)` is null
 * for an MCP call — there is no @convex-dev/auth session cookie behind one.
 */

function ok(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function fail(
  id: string | number | null,
  code: number,
  message: string,
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

/**
 * A tool failure is NOT a JSON-RPC error. ChatGPT swallows protocol-level
 * errors and shows the user nothing — the run just stops with no
 * explanation. Wrapped as a successful result carrying `isError`, the model
 * reads the text, tells the user what went wrong, and can retry.
 */
function toolError(id: string | number | null, message: string): JsonRpcResponse {
  return ok(id, {
    content: [{ type: "text", text: message }],
    isError: true,
  });
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * The text block is what every current client reads and it is deliberately
 * unchanged. `structuredContent` (added in protocol 2025-06-18) carries the
 * SAME object reference, so the two cannot drift apart.
 *
 * Emitted only for a plain object, because that revision defines
 * structuredContent as a JSON object. Seven read tools return a bare `null`
 * when the record does not exist — for four of them (`profile_get`,
 * `roadmap_get`, `documents_list`, `financial_plan_get`) null is the day-one
 * state of every new user. Those calls simply carry no structuredContent,
 * which is legal precisely because no tool here declares an `outputSchema`.
 * See `convex/mcp/contract.test.ts` for why declaring one would be a downgrade.
 */
function toolOk(id: string | number | null, payload: unknown): JsonRpcResponse {
  return ok(id, {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    ...(isPlainObject(payload) ? { structuredContent: payload } : {}),
    isError: false,
  });
}

export function isNotification(req: JsonRpcRequest): boolean {
  return req.id === undefined || req.id === null;
}

/**
 * Returns null for notifications — the caller answers 202 with no body.
 * Anything else is a single JSON-RPC response object.
 */
export async function dispatchJsonRpc(
  ctx: ActionCtx,
  auth: McpAuth,
  req: JsonRpcRequest,
): Promise<JsonRpcResponse | null> {
  const method = typeof req.method === "string" ? req.method : "";

  // Notifications carry no id and MUST NOT be answered. `notifications/*`
  // (initialized, cancelled, progress) are the ones clients actually send.
  if (isNotification(req) || method.startsWith("notifications/")) return null;

  const id = req.id ?? null;

  switch (method) {
    case "initialize":
      return ok(id, {
        protocolVersion: negotiateProtocolVersion(
          (req.params as { protocolVersion?: unknown } | undefined)?.protocolVersion,
        ),
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        // The host puts this in front of the model before the first tool
        // call. It is the only channel that can describe the SERVER rather
        // than one tool — see convex/mcp/instructions.ts.
        instructions: SERVER_INSTRUCTIONS,
      });

    case "ping":
      return ok(id, {});

    case "tools/list":
      return ok(id, { tools: toolDescriptors() });

    case "tools/call": {
      const params = (req.params ?? {}) as {
        name?: unknown;
        arguments?: unknown;
      };
      const name = typeof params.name === "string" ? params.name : "";
      const tool = TOOL_BY_NAME.get(name);
      if (!tool) {
        return toolError(id, `Tool tidak dikenal: ${name || "(kosong)"}`);
      }

      // The env escape hatch authenticates a developer, not a person. Every
      // tool reads or writes somebody's rows, so with no user bound there is
      // nothing it may legitimately touch.
      if (!auth.userId) {
        return toolError(
          id,
          "Token MCP_API_KEY tidak terikat ke pengguna. Sambungkan lewat OAuth untuk memakai tool.",
        );
      }

      // Authorization is checked HERE, per call — not once when the connection
      // was authenticated. Until 2026-08-14 the scopes on the token row were
      // published in discovery and never read, so a token granted only
      // `mcp.read` could still call `portfolio_delete`.
      if (!satisfiesScope(auth.scopes, tool.scope)) {
        return {
          jsonrpc: "2.0" as const,
          id,
          error: {
            code: RPC_ERROR.INSUFFICIENT_SCOPE,
            message: `Token ini tidak memiliki izin ${tool.scope} yang dibutuhkan oleh ${tool.name}.`,
            data: { required_scope: tool.scope, granted_scopes: auth.scopes },
          },
        };
      }

      const raw =
        params.arguments && typeof params.arguments === "object"
          ? { ...(params.arguments as Record<string, unknown>) }
          : {};
      // Identity comes from the token row and nowhere else. Stripping these
      // keys means a handler that spreads `...args` into an internal call
      // still cannot be talked into acting as another account.
      delete raw.userId;
      delete raw.user_id;

      try {
        return toolOk(id, await tool.handler(ctx, auth.userId, raw));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Terjadi kesalahan.";
        // Convex prefixes uncaught errors with a request id and its own
        // wrapper; the model only needs the sentence a human wrote.
        const clean =
          /Uncaught (?:Convex)?Error:\s*([^\n]+)/.exec(message)?.[1] ??
          message.replace(/^\[Request ID:[^\]]+\]\s*/, "");
        return toolError(id, clean.trim() || "Terjadi kesalahan.");
      }
    }

    default:
      // A genuinely unknown METHOD is a protocol error and belongs in the
      // error object — unlike a failing tool, the client (not the model)
      // is the one that has to deal with it.
      return fail(id, RPC_ERROR.METHOD_NOT_FOUND, `Method not found: ${method}`);
  }
}
