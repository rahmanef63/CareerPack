import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { env } from "@/shared/lib/env";

/**
 * OAuth 2.1 token endpoint. Public by design — a public client has no
 * secret, and what proves the caller is the one that started the flow is
 * the PKCE verifier, checked server-side in `api.mcp.oauth.exchangeCode`.
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
  "Access-Control-Allow-Headers": "Content-Type",
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

export async function POST(request: Request): Promise<Response> {
  let params: Record<string, string>;
  try {
    params = await readParams(request);
  } catch {
    return oauthError("invalid_request", "Body tidak bisa dibaca.");
  }

  if (params.grant_type !== "authorization_code") {
    return oauthError(
      "unsupported_grant_type",
      "Hanya authorization_code yang didukung.",
    );
  }
  const code = params.code ?? "";
  const codeVerifier = params.code_verifier ?? "";
  const redirectUri = params.redirect_uri ?? "";
  const clientId = params.client_id ?? "";
  if (!code || !codeVerifier || !redirectUri || !clientId) {
    return oauthError(
      "invalid_request",
      "code, code_verifier, redirect_uri dan client_id wajib diisi.",
    );
  }

  // `client_secret_post` — the only confidential-client method this server
  // advertises. Forwarded when present and simply absent for a public client;
  // whether it is REQUIRED is decided in exchangeCode from the registered
  // client, never from what the caller chose to send.
  const clientSecret = params.client_secret?.trim() || undefined;

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
