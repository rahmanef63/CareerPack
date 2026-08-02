import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Wire types for the MCP server. No Convex functions here — this module is
 * imported by the dispatcher, every tool module, and the unit test.
 */

// The version ChatGPT, Claude and Cursor all still negotiate. Bumping it is
// not a cosmetic change: later revisions move error and content shapes.
export const MCP_PROTOCOL_VERSION = "2024-11-05";

export const SERVER_INFO = { name: "careerpack", version: "1.0.0" } as const;

export const MCP_SCOPES = "mcp.read mcp.write";

export interface JsonRpcRequest {
  jsonrpc?: string;
  /** Absent or null = notification: the client wants no reply at all. */
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export const RPC_ERROR = {
  PARSE: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL: -32603,
} as const;

/**
 * Hints MCP hosts act on when deciding whether to ask the human first.
 * `readOnlyHint` usually skips the confirmation dialog outright;
 * `destructiveHint` always forces one. Getting these wrong is a UX bug in
 * one direction and a data-loss bug in the other, so set all four.
 */
export interface ToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface ToolInputSchema {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ToolDef {
  /** snake_case, domain-prefixed. */
  name: string;
  /** Model-facing prompt context, English. See tools/index.ts header. */
  description: string;
  inputSchema: ToolInputSchema;
  annotations: ToolAnnotations;
  /**
   * `userId` is supplied by the dispatcher from the access-token row and is
   * the only source of identity a handler may use — `args` never carries it.
   */
  handler: (
    ctx: ActionCtx,
    userId: Id<"users">,
    args: Record<string, unknown>,
  ) => Promise<unknown>;
}

/** Result of resolving the request's bearer token. */
export interface McpAuth {
  /**
   * Null for the `MCP_API_KEY` escape hatch: that key authenticates a
   * developer probing the protocol, not a person, so it can list tools but
   * can never reach anyone's data.
   */
  userId: Id<"users"> | null;
  kind: "env" | "oauth";
}
