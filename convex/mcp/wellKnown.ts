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

/**
 * OpenAI domain verification for a Plugins Directory submission.
 *
 * The challenge has to be served from the MCP host or a parent of it, and the
 * MCP host here is `*.convex.site` — whose parent belongs to Convex, not to
 * us. So it can only live on this router, next to `/mcp` itself.
 *
 * Returns the token and nothing else: not JSON, not a list, not a trailing
 * newline. OpenAI's checker rejects anything but the bare value, and 404s
 * while unset rather than serving an empty string, which would read as a
 * verified-but-wrong token.
 */
export const openaiAppsChallenge = httpAction(async () => {
  const token = (process.env.OPENAI_APPS_CHALLENGE ?? "").trim();
  if (!token) return new Response("Not found", { status: 404 });
  return new Response(token, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
});

/** RFC 8414 — authorization server metadata. */
export const authorizationServerMetadata = httpAction(async (_ctx, request) => {
  if (request.method === "OPTIONS") return preflight();
  return metadata({
    issuer: siteOrigin(),
    authorization_endpoint: `${appOrigin()}/oauth/authorize`,
    token_endpoint: `${appOrigin()}/api/oauth/token`,
    // RFC 7591. Served from SITE rather than the app, because a host that
    // cannot register has no way to obtain a client id at all: neither
    // ChatGPT's connection modal nor claude.ai's connector form offers a
    // field to type one into.
    registration_endpoint: `${siteOrigin()}/oauth/register`,
    response_types_supported: ["code"],
    // `client_credentials` is for software the user wrote themselves: no
    // browser, no consent screen, the id + secret pair minted in Settings
    // traded straight for a bearer. Only user-minted confidential clients can
    // use it — see clientCredentialsGrant.
    grant_types_supported: ["authorization_code", "client_credentials"],
    // S256 only, advertised as such: a client that reads this will not even
    // try `plain`, which the token endpoint would refuse anyway.
    code_challenge_methods_supported: ["S256"],
    // Public client, no secret. ChatGPT's "User-Defined OAuth Client" form
    // wants the Client Secret field left empty — this is the machine-readable
    // half of that instruction.
    // `none` for the public clients RFC 7591 registration mints, and
    // `client_secret_post` for the confidential ones a user creates by hand
    // when a host insists on an id + secret pair. Advertising only `none`
    // told a client the secret it was about to send would be ignored.
    // `client_secret_basic` is last because it is only accepted, not preferred:
    // the client_credentials path reads it so a library that sends Basic
    // without asking does not fail as an unexplained invalid_client.
    token_endpoint_auth_methods_supported: [
      "none",
      "client_secret_post",
      "client_secret_basic",
    ],
    scopes_supported: SCOPE_LIST,
  });
});
