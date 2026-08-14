import { httpAction } from "../_generated/server";
import { extractBearer, resolveBearer } from "./auth";
import { dispatchJsonRpc } from "./jsonrpc";
import { RPC_ERROR, type JsonRpcRequest } from "./types";
import { siteOrigin } from "./wellKnown";

/**
 * `POST /mcp` — the MCP endpoint, on the SITE origin.
 *
 * Deliberately NOT guarded by `rejectIfBadOrigin`: that gate exists for
 * browser-driven httpActions, and an MCP caller is a server (ChatGPT's
 * backend, mcp-remote, Cursor) that sends no Origin header at all. Applying
 * it here would 403 every real request. The bearer token is the gate.
 */

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

const JSON_HEADERS = { "Content-Type": "application/json", ...CORS };

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: {
      ...JSON_HEADERS,
      // RFC 9728 §5.1: this header is how a client that got a 401 learns
      // where to start the OAuth flow. Without `resource_metadata` the
      // client has no way to discover the authorization server and simply
      // reports the connection as broken.
      "WWW-Authenticate": `Bearer realm="careerpack", resource_metadata="${siteOrigin()}/.well-known/oauth-protected-resource"`,
    },
  });
}

export const handleMcp = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== "POST") {
    // GET on an MCP endpoint means "open an SSE stream". We answer over
    // plain POST only, and 405 tells a streaming-capable client to fall
    // back instead of hanging on a connection that will never speak.
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...JSON_HEADERS, Allow: "POST, OPTIONS" },
    });
  }

  const token = extractBearer(request);
  if (!token) return unauthorized();
  const auth = await resolveBearer(ctx, token);
  if (!auth) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: RPC_ERROR.PARSE, message: "Parse error" },
      }),
      { status: 400, headers: JSON_HEADERS },
    );
  }

  // Batch: an array of requests, answered with an array of only the
  // non-notification responses. An all-notification batch gets 202.
  if (Array.isArray(body)) {
    const answers = [];
    for (const item of body) {
      const answer = await dispatchJsonRpc(ctx, auth, item as JsonRpcRequest);
      if (answer) answers.push(answer);
    }
    if (answers.length === 0) return new Response(null, { status: 202, headers: CORS });
    return new Response(JSON.stringify(answers), {
      status: 200,
      headers: JSON_HEADERS,
    });
  }

  if (!body || typeof body !== "object") {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: RPC_ERROR.INVALID_REQUEST, message: "Invalid request" },
      }),
      { status: 400, headers: JSON_HEADERS },
    );
  }

  const response = await dispatchJsonRpc(ctx, auth, body as JsonRpcRequest);
  // Notification: the spec forbids a response body, and a client that gets
  // one on `notifications/initialized` logs a protocol violation.
  if (!response) return new Response(null, { status: 202, headers: CORS });

  // An authorization failure gets the real challenge, not a 200 whose body
  // happens to say "no". RFC 6750 §3.1: insufficient_scope is a 403 carrying
  // the scope the request would have needed, which is what lets a client
  // re-authorize for more instead of silently retrying forever.
  // Batches stay 200 — one 403 cannot describe a mixed array, and the
  // per-entry JSON-RPC errors already carry the same detail.
  if (response.error?.code === RPC_ERROR.INSUFFICIENT_SCOPE) {
    const required = (response.error.data as { required_scope?: string } | undefined)?.required_scope;
    return new Response(JSON.stringify(response), {
      status: 403,
      headers: {
        ...JSON_HEADERS,
        "WWW-Authenticate":
          `Bearer realm="careerpack", error="insufficient_scope"` +
          (required ? `, scope="${required}"` : "") +
          `, resource_metadata="${siteOrigin()}/.well-known/oauth-protected-resource"`,
      },
    });
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: JSON_HEADERS,
  });
});
