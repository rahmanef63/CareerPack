import type { ActionCtx } from "../_generated/server";
import {
  MCP_PROTOCOL_VERSION,
  RPC_ERROR,
  SERVER_INFO,
  type JsonRpcRequest,
  type JsonRpcResponse,
  type McpAuth,
} from "./types";
import { TOOLS, TOOL_BY_NAME } from "./tools";

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

function toolOk(id: string | number | null, payload: unknown): JsonRpcResponse {
  return ok(id, {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
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
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      });

    case "ping":
      return ok(id, {});

    case "tools/list":
      return ok(id, {
        tools: TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
          annotations: t.annotations,
        })),
      });

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
