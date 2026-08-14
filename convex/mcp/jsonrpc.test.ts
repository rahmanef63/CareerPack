import { describe, it, expect } from "vitest";
import { dispatchJsonRpc } from "./jsonrpc";
import {
  MCP_PROTOCOL_VERSION,
  MCP_PROTOCOL_VERSIONS,
  SCOPE,
  type McpAuth,
} from "./types";
import { TOOLS } from "./tools";
import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

const USER = "user_from_token" as Id<"users">;
// Full authority: these cases assert protocol shape, not the scope gate.
const OAUTH: McpAuth = { userId: USER, kind: "oauth", scopes: [SCOPE.READ, SCOPE.WRITE] };
const ENV_KEY: McpAuth = { userId: null, kind: "env", scopes: [] };

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
  it("answers initialize with our latest version and tool capability", async () => {
    const res = await dispatchJsonRpc(NO_CTX, OAUTH, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
    });
    expect(res).toEqual({
      jsonrpc: "2.0",
      id: 1,
      result: {
        // A literal, not MCP_PROTOCOL_VERSION. Asserting the constant against
        // itself is a tautology that passes through any version change — which
        // is exactly the change most likely to break a host.
        protocolVersion: "2025-06-18",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "careerpack", version: "1.0.0" },
      },
    });
  });

  it("defaults to the newest revision it implements", () => {
    // Adding a revision to the list and forgetting to move the default is the
    // easy mistake: everything still passes, and the server quietly keeps
    // counter-offering an older version than it speaks.
    expect(MCP_PROTOCOL_VERSION).toBe(
      MCP_PROTOCOL_VERSIONS[MCP_PROTOCOL_VERSIONS.length - 1],
    );
  });

  it("echoes back any protocol revision it actually implements", async () => {
    // The handshake rule for every revision up to 2025-11-25: if we support
    // what was asked for, we MUST answer with that same version.
    for (const asked of ["2024-11-05", "2025-03-26", "2025-06-18"]) {
      const res = await dispatchJsonRpc(NO_CTX, OAUTH, {
        id: 1,
        method: "initialize",
        params: { protocolVersion: asked },
      });
      expect((res?.result as { protocolVersion: string }).protocolVersion, asked).toBe(asked);
    }
  });

  it("counter-offers its latest when asked for a revision it does not implement", async () => {
    // 2026-07-28 is the current published revision and a stateless rewrite we
    // do not speak; garbage should land the same way, not crash.
    for (const asked of ["2026-07-28", "1999-01-01", 42, null]) {
      const res = await dispatchJsonRpc(NO_CTX, OAUTH, {
        id: 1,
        method: "initialize",
        params: { protocolVersion: asked } as Record<string, unknown>,
      });
      expect((res?.result as { protocolVersion: string }).protocolVersion, String(asked)).toBe(
        "2025-06-18",
      );
    }
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

  it("mirrors the tool payload into structuredContent without touching the text", async () => {
    const res = await dispatchJsonRpc(echoCtx, OAUTH, {
      id: 9,
      method: "tools/call",
      params: { name: "cv_get", arguments: { cv_id: "cv_abc" } },
    });
    const r = res?.result as {
      content: { text: string }[];
      structuredContent?: unknown;
      isError: boolean;
    };
    // Same data, two encodings. Old clients read the text, newer ones read the
    // object, and neither may disagree with the other.
    expect(r.structuredContent).toEqual({ userId: USER, cvId: "cv_abc" });
    expect(JSON.parse(r.content[0].text)).toEqual(r.structuredContent);
  });

  it("omits structuredContent when a read tool legitimately returns null", async () => {
    // Protocol 2025-06-18 defines structuredContent as a JSON object, so `null`
    // has no representation. Seven read tools answer null for a missing record,
    // and for four of them that is the day-one state of a new account — so this
    // branch is common, not exotic. Omission is only legal because no tool here
    // declares an outputSchema.
    const nullCtx = {
      runQuery: async () => null,
      runMutation: async () => null,
    } as unknown as ActionCtx;
    const res = await dispatchJsonRpc(nullCtx, OAUTH, {
      id: 10,
      method: "tools/call",
      params: { name: "cv_get", arguments: { cv_id: "cv_missing" } },
    });
    const r = res?.result as { content: { text: string }[]; structuredContent?: unknown };
    expect("structuredContent" in r).toBe(false);
    expect(r.content[0].text).toBe("null");
  });

  it("keeps a genuinely unknown method as a protocol error", async () => {
    const res = await dispatchJsonRpc(NO_CTX, OAUTH, {
      id: 8,
      method: "resources/list",
    });
    expect(res?.error?.code).toBe(-32601);
  });
});
