import { httpAction } from "../_generated/server";
import { MCP_SCOPES } from "./types";

/**
 * OAuth discovery documents, served from the SITE origin.
 *
 * This is the pitfall that reads as "MCP server does not implement OAuth":
 * the client's very first probe goes to the host of the MCP URL, not to the
 * host of the web app. Mirroring these documents only at careerpack.org
 * looks correct in a browser and still fails at connect time — the probe
 * never touches that host.
 *
 * On Convex the two origins are different services: `*.convex.cloud` is
 * queries and mutations over WebSocket, `*.convex.site` is where httpRouter
 * mounts. Both `/mcp` and everything under `/.well-known/` live on SITE.
 */

const SCOPE_LIST = MCP_SCOPES.split(" ");

/** Injected by Convex — no env var to forget, and always the right host. */
export function siteOrigin(): string {
  return (process.env.CONVEX_SITE_URL ?? "").replace(/\/$/, "");
}

/** Where the human-facing consent + token endpoints live (Next.js app). */
function appOrigin(): string {
  return (process.env.APP_URL ?? "https://careerpack.local").replace(/\/$/, "");
}

export function mcpResourceUrl(): string {
  return `${siteOrigin()}/mcp`;
}

function metadata(body: unknown): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // Public, unauthenticated documents — every MCP client fetches them
      // before it has any credential, including from a browser.
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function preflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

/** RFC 9728 — protected resource metadata. */
export const protectedResourceMetadata = httpAction(async (_ctx, request) => {
  if (request.method === "OPTIONS") return preflight();
  return metadata({
    resource: mcpResourceUrl(),
    // The authorization server IS this origin: the metadata below is served
    // here, so RFC 8414's "issuer must match where the document was found"
    // holds. The endpoints it points at happen to run on the web app.
    authorization_servers: [siteOrigin()],
    scopes_supported: SCOPE_LIST,
    bearer_methods_supported: ["header"],
  });
});

/** RFC 8414 — authorization server metadata. */
export const authorizationServerMetadata = httpAction(async (_ctx, request) => {
  if (request.method === "OPTIONS") return preflight();
  return metadata({
    issuer: siteOrigin(),
    authorization_endpoint: `${appOrigin()}/oauth/authorize`,
    token_endpoint: `${appOrigin()}/api/oauth/token`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    // S256 only, advertised as such: a client that reads this will not even
    // try `plain`, which the token endpoint would refuse anyway.
    code_challenge_methods_supported: ["S256"],
    // Public client, no secret. ChatGPT's "User-Defined OAuth Client" form
    // wants the Client Secret field left empty — this is the machine-readable
    // half of that instruction.
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: SCOPE_LIST,
  });
});
