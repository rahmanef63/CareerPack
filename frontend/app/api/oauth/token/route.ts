import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { env } from "@/shared/lib/env";

/**
 * OAuth 2.1 token endpoint. Two grants:
 *
 *   authorization_code — a host connecting on a human's behalf. Public by
 *     design: a public client has no secret, and what proves the caller is
 *     the one that started the flow is the PKCE verifier, checked in
 *     `api.mcp.oauth.exchangeCode`.
 *   client_credentials — software the user wrote, with no human to consent.
 *     The id + secret pair IS the proof; see `clientCredentialsGrant`.
 *
 * Lives on the web app rather than the Convex SITE origin because that is
 * the URL a user pastes into ChatGPT's connector form ("Token URL"), next
 * to the Auth URL that has to be on this host anyway to render the consent
 * page.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  // Authorization is listed because client_credentials accepts HTTP Basic;
  // without it a browser preflight for that shape fails as a CORS error, which
  // reads like a server outage rather than a header the endpoint refuses.
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// RFC 6749 §5.1 — a token response must never be cached. Anything between
// the client and here (proxy, CDN, service worker) would otherwise be able
// to replay a live credential.
const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  Pragma: "no-cache",
  ...CORS,
};

function oauthError(
  error: string,
  description: string,
  status = 400,
): Response {
  return new Response(
    JSON.stringify({ error, error_description: description }),
    { status, headers: JSON_HEADERS },
  );
}

/**
 * Real clients disagree about the body format: the RFC says
 * form-urlencoded, ChatGPT sends form-urlencoded, and several MCP bridges
 * send JSON. Accepting only one of the two fails half of them with an
 * error that reads like a credential problem.
 */
async function readParams(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") ?? "";
  const raw = await request.text();
  if (contentType.includes("application/json")) {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).map(([k, v]) => [k, String(v ?? "")]),
    );
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS });
}

/**
 * RFC 6749 §4.4 — the headless half. No browser, no consent screen: software
 * the user wrote proves itself with the id + secret pair minted in Settings
 * and gets a bearer for that user's own data.
 *
 * `client_secret_post` is what the discovery document advertises, but a good
 * number of OAuth libraries send `Authorization: Basic` without asking, and
 * that mismatch fails as an indistinguishable `invalid_client`. Reading both
 * costs six lines and removes the most likely integration dead end.
 */
function basicAuth(request: Request): { id: string; secret: string } | null {
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("basic ")) return null;
  let decoded: string;
  try {
    decoded = Buffer.from(header.slice(6).trim(), "base64").toString("utf8");
  } catch {
    return null;
  }
  const sep = decoded.indexOf(":");
  if (sep < 1) return null;
  // Both halves are form-encoded per RFC 6749 §2.3.1.
  return {
    id: decodeURIComponent(decoded.slice(0, sep)),
    secret: decodeURIComponent(decoded.slice(sep + 1)),
  };
}

async function clientCredentials(
  params: Record<string, string>,
  request: Request,
): Promise<Response> {
  const basic = basicAuth(request);
  const clientId = params.client_id?.trim() || basic?.id || "";
  const clientSecret = params.client_secret?.trim() || basic?.secret || "";
  if (!clientId || !clientSecret) {
    return oauthError(
      "invalid_request",
      "client_id dan client_secret wajib diisi.",
    );
  }

  const client = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
  const result = await client.mutation(api.mcp.oauth.clientCredentialsGrant, {
    clientId,
    clientSecret,
    ...(params.scope?.trim() ? { scope: params.scope.trim() } : {}),
  });

  if (!result.ok) {
    // 401 for a credential the server rejected — RFC 6749 §5.2 says
    // invalid_client SHOULD be 401, and a client library that retries on 400
    // will hammer a wrong secret forever.
    const status = result.error === "invalid_client" ? 401 : 400;
    return oauthError(result.error, result.errorDescription, status);
  }

  return new Response(
    JSON.stringify({
      access_token: result.accessToken,
      token_type: "Bearer",
      expires_in: result.expiresIn,
      scope: result.scope,
    }),
    { status: 200, headers: JSON_HEADERS },
  );
}

export async function POST(request: Request): Promise<Response> {
  let params: Record<string, string>;
  try {
    params = await readParams(request);
  } catch {
    return oauthError("invalid_request", "Body tidak bisa dibaca.");
  }

  if (params.grant_type === "client_credentials") {
    return clientCredentials(params, request);
  }

  if (params.grant_type !== "authorization_code") {
    return oauthError(
      "unsupported_grant_type",
      "Hanya authorization_code dan client_credentials yang didukung.",
    );
  }
  const basic = basicAuth(request);
  const code = params.code ?? "";
  const codeVerifier = params.code_verifier ?? "";
  const redirectUri = params.redirect_uri ?? "";
  const clientId = params.client_id?.trim() || basic?.id || "";
  if (!code || !codeVerifier || !redirectUri || !clientId) {
    return oauthError(
      "invalid_request",
      "code, code_verifier, redirect_uri dan client_id wajib diisi.",
    );
  }

  // `client_secret_post`, or HTTP Basic — both are advertised, so both are
  // read here rather than only on the client_credentials path. Forwarded when
  // present and simply absent for a public client; whether it is REQUIRED is
  // decided in exchangeCode from the registered client, never from what the
  // caller chose to send.
  const clientSecret = params.client_secret?.trim() || basic?.secret || undefined;

  const client = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
  const result = await client.mutation(api.mcp.oauth.exchangeCode, {
    code,
    codeVerifier,
    redirectUri,
    clientId,
    ...(clientSecret ? { clientSecret } : {}),
  });

  if (!result.ok) {
    return oauthError(result.error, result.errorDescription);
  }

  return new Response(
    JSON.stringify({
      access_token: result.accessToken,
      token_type: "Bearer",
      expires_in: result.expiresIn,
      scope: result.scope,
    }),
    { status: 200, headers: JSON_HEADERS },
  );
}
