import { describe, it, expect } from "vitest";
import { dispatchJsonRpc } from "./jsonrpc";
import { MCP_PROTOCOL_VERSION, type McpAuth } from "./types";
import { TOOLS } from "./tools";
import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

const USER = "user_from_token" as Id<"users">;
const OAUTH: McpAuth = { userId: USER, kind: "oauth" };
const ENV_KEY: McpAuth = { userId: null, kind: "env" };

/**
 * Echoes back whatever the tool forwarded, so a test can assert on the args
 * a handler builds. Nothing here reaches the database — these cases are
 * about the protocol shape and the identity plumbing, both of which are
 * decided before any query runs.
 */
const echoCtx = {
  runQuery: async (_ref: unknown, args: unknown) => args,
  runMutation: async (_ref: unknown, args: unknown) => args,
} as unknown as ActionCtx;

const NO_CTX = null as unknown as ActionCtx;

function parseToolPayload(result: unknown) {
  const r = result as { content: { text: string }[]; isError: boolean };
  return { isError: r.isError, payload: JSON.parse(r.content[0].text) };
}

describe("dispatchJsonRpc", () => {
  it("answers initialize with the negotiated version and tool capability", async () => {
    const res = await dispatchJsonRpc(NO_CTX, OAUTH, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
    });
    expect(res).toEqual({
      jsonrpc: "2.0",
      id: 1,
      result: {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "careerpack", version: "1.0.0" },
      },
    });
  });

  it("returns null for notifications so the route can answer 202", async () => {
    // Both shapes a client sends: no id at all, and the notifications/* family.
    expect(
      await dispatchJsonRpc(NO_CTX, OAUTH, { jsonrpc: "2.0", method: "ping" }),
    ).toBeNull();
    expect(
      await dispatchJsonRpc(NO_CTX, OAUTH, {
        jsonrpc: "2.0",
        id: null,
        method: "ping",
      }),
    ).toBeNull();
    expect(
      await dispatchJsonRpc(NO_CTX, OAUTH, {
        jsonrpc: "2.0",
        id: 7,
        method: "notifications/initialized",
      }),
    ).toBeNull();
  });

  it("answers ping with an empty result", async () => {
    const res = await dispatchJsonRpc(NO_CTX, OAUTH, { id: 2, method: "ping" });
    expect(res?.result).toEqual({});
  });

  it("lists tools that are all snake_case and fully annotated", async () => {
    const res = await dispatchJsonRpc(NO_CTX, OAUTH, {
      id: 3,
      method: "tools/list",
    });
    const { tools } = res?.result as { tools: Record<string, unknown>[] };
    expect(tools.length).toBe(TOOLS.length);
    expect(tools.length).toBeGreaterThan(0);
    for (const tool of tools) {
      expect(tool.name).toMatch(/^[a-z][a-z0-9_]*$/);
      // Hosts decide whether to prompt the human from these four. A missing
      // hint silently defaults to the most cautious or the most permissive
      // behaviour depending on the client — neither is what we chose.
      const ann = tool.annotations as Record<string, unknown>;
      for (const hint of [
        "readOnlyHint",
        "destructiveHint",
        "idempotentHint",
        "openWorldHint",
      ]) {
        expect(typeof ann[hint], `${tool.name as string}.${hint}`).toBe(
          "boolean",
        );
      }
      expect((tool.inputSchema as { type: string }).type).toBe("object");
      expect(typeof tool.description).toBe("string");
    }
  });

  it("reports an unknown tool inside result.isError, never as a JSON-RPC error", async () => {
    const res = await dispatchJsonRpc(NO_CTX, OAUTH, {
      id: 4,
      method: "tools/call",
      params: { name: "nope_does_not_exist", arguments: {} },
    });
    // ChatGPT hides protocol errors from the user entirely — a tool failure
    // has to come back as a successful result the model can read aloud.
    expect(res?.error).toBeUndefined();
    expect((res?.result as { isError: boolean }).isError).toBe(true);
  });

  it("refuses tools/call for the MCP_API_KEY escape hatch, which is bound to no user", async () => {
    const res = await dispatchJsonRpc(echoCtx, ENV_KEY, {
      id: 5,
      method: "tools/call",
      params: { name: "cv_list", arguments: {} },
    });
    const { isError } = res?.result as { isError: boolean };
    expect(isError).toBe(true);
    expect(res?.error).toBeUndefined();
  });

  it("takes userId from the token and ignores one supplied by the caller", async () => {
    const res = await dispatchJsonRpc(echoCtx, OAUTH, {
      id: 6,
      method: "tools/call",
      params: {
        name: "cv_get",
        arguments: {
          cv_id: "cv_abc",
          // A client trying to read somebody else's row by naming them.
          userId: "user_victim",
          user_id: "user_victim",
        },
      },
    });
    const { isError, payload } = parseToolPayload(res?.result);
    expect(isError).toBe(false);
    expect(payload).toEqual({ userId: USER, cvId: "cv_abc" });
  });

  it("turns a handler throw into readable isError text", async () => {
    const res = await dispatchJsonRpc(echoCtx, OAUTH, {
      id: 7,
      method: "tools/call",
      // cv_id missing — the handler throws before touching any data.
      params: { name: "cv_get", arguments: {} },
    });
    const r = res?.result as { isError: boolean; content: { text: string }[] };
    expect(res?.error).toBeUndefined();
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("cv_id");
  });

  it("keeps a genuinely unknown method as a protocol error", async () => {
    const res = await dispatchJsonRpc(NO_CTX, OAUTH, {
      id: 8,
      method: "resources/list",
    });
    expect(res?.error?.code).toBe(-32601);
  });
});
