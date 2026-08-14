import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Wire types for the MCP server. No Convex functions here — this module is
 * imported by the dispatcher, every tool module, and the unit test.
 */

/**
 * Protocol revisions this server actually implements, oldest first.
 *
 * Until 2026-08-14 a single constant `"2024-11-05"` was echoed back
 * unconditionally, whatever the client asked for. That is a legal counter-offer
 * under the handshake rules, but it meant the server described itself as older
 * than it behaves and could never use anything added later.
 *
 * `2025-06-18` is the ceiling on purpose:
 *   - it is the revision that introduced `structuredContent`, which `toolOk`
 *     now emits, so advertising less would be describing a different server;
 *   - it removed JSON-RPC batching. We still ACCEPT batches (convex/mcp/http.ts)
 *     because being lenient about input costs nothing and older clients send them;
 *   - it requires clients to send `MCP-Protocol-Version` on later requests. We
 *     do not enforce that — rejecting a request over a missing header would
 *     break working clients to prove a point.
 *
 * NOT implemented: `2025-11-25` and `2026-07-28`. The latter is the CURRENT
 * published revision and is a stateless rewrite — no `initialize` handshake, no
 * `Mcp-Session-Id`, per-request `_meta` protocol version, a mandatory
 * `server/discover` RPC and required `Mcp-Method`/`Mcp-Name` headers. That is a
 * transport rewrite, not a version bump, and no host we serve negotiates it yet.
 */
export const MCP_PROTOCOL_VERSIONS = ["2024-11-05", "2025-03-26", "2025-06-18"] as const;

/** What we offer when the client asks for something we do not implement. */
export const MCP_PROTOCOL_VERSION = "2025-06-18";

/**
 * Handshake rule for every revision up to 2025-11-25: answer with the client's
 * version when we support it, otherwise with our latest and let the client
 * decide whether it can live with that.
 */
export const negotiateProtocolVersion = (requested: unknown): string =>
  typeof requested === "string" &&
  (MCP_PROTOCOL_VERSIONS as readonly string[]).includes(requested)
    ? requested
    : MCP_PROTOCOL_VERSION;

export const SERVER_INFO = { name: "careerpack", version: "1.0.0" } as const;

export const MCP_SCOPES = "mcp.read mcp.write";

/**
 * The two scopes a token can carry. Advertised in the discovery documents and
 * — since 2026-08-14 — actually ENFORCED per tool call. Before that they were
 * published and ignored, so a token minted for reading could call
 * `portfolio_delete`.
 */
export const SCOPE = { READ: "mcp.read", WRITE: "mcp.write" } as const;
export type McpScope = (typeof SCOPE)[keyof typeof SCOPE];

/** Split a stored `scope` column into the set the dispatcher compares against. */
export const parseScopes = (raw: string | undefined | null): McpScope[] =>
  (raw ?? "").split(/\s+/).filter((s): s is McpScope => s === SCOPE.READ || s === SCOPE.WRITE);

/**
 * A write implies the ability to read, which is how every OAuth deployment
 * behaves in practice — a client granted `mcp.write` that then cannot list is
 * simply broken. Read does NOT imply write.
 */
export const satisfiesScope = (held: readonly McpScope[], needed: McpScope): boolean =>
  held.includes(needed) || (needed === SCOPE.READ && held.includes(SCOPE.WRITE));

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
  /** Implementation-defined range. The HTTP layer turns this one into a 403
   *  with an RFC 6750 challenge; every other code stays a 200 JSON-RPC error. */
  INSUFFICIENT_SCOPE: -32003,
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
  /**
   * OVERRIDE ONLY. Leave it unset: `tools/index.ts` derives the scope from
   * `annotations.readOnlyHint`, so it can never disagree with the annotation
   * that already states the same fact. Set it only for a tool whose annotation
   * and required authority genuinely differ.
   */
  scope?: McpScope;
  /** Model-facing prompt context, English. See tools/index.ts header. */
  description: string;
  inputSchema: ToolInputSchema;
  annotations: ToolAnnotations;
  /**
   * Host-specific hints merged into the descriptor's `_meta`. Currently only
   * `openai/fileParams`, which is what makes ChatGPT offer a file for a field
   * instead of asking the model to type a URL. Inert to every other host, so
   * one tool still serves them all.
   */
  meta?: Record<string, unknown>;
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
  /** Granted scopes from the token row. The env key carries none: it cannot
   *  reach a tool at all, so giving it authority would only be misleading. */
  scopes: McpScope[];
}

/** A tool after the registry has resolved its scope. This is what the
 *  dispatcher sees, and the only shape where `scope` is guaranteed. */
export type ResolvedTool = ToolDef & { scope: McpScope };

/** readOnlyHint is already the declaration of whether a tool changes state, so
 *  the scope follows from it rather than being asserted twice. */
export const scopeForTool = (t: ToolDef): McpScope =>
  t.scope ?? (t.annotations.readOnlyHint === true ? SCOPE.READ : SCOPE.WRITE);
