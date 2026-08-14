import { httpRouter } from "convex/server";
import { handleResendWebhook } from "./admin/webhooks";
import { handleUnsubscribeGet, handleUnsubscribePost } from "./admin/unsubscribes";
import { handleRequestReset } from "./passwordReset";
import { handleCheckEmail, handleSignInAttempt } from "./authCheckEmail";
import { handleHealth } from "./health";
import { handleMcp } from "./mcp/http";
import { handleSignedFileRead } from "./mcp/fileRead";
import { handleRegister } from "./mcp/register";
import {
  authorizationServerMetadata,
  openaiAppsChallenge,
  protectedResourceMetadata,
} from "./mcp/wellKnown";

const http = httpRouter();

http.route({
  path: "/webhooks/resend",
  method: "POST",
  handler: handleResendWebhook,
});

http.route({
  path: "/api/unsubscribe",
  method: "GET",
  handler: handleUnsubscribeGet,
});

http.route({
  path: "/api/unsubscribe",
  method: "POST",
  handler: handleUnsubscribePost,
});

http.route({
  path: "/api/password-reset/request",
  method: "POST",
  handler: handleRequestReset,
});

// CORS preflight — browsers send OPTIONS for cross-origin requests with
// custom Content-Type (`application/json`). Same handler dispatches by
// `request.method`.
http.route({
  path: "/api/password-reset/request",
  method: "OPTIONS",
  handler: handleRequestReset,
});

http.route({
  path: "/api/auth/check-email",
  method: "POST",
  handler: handleCheckEmail,
});
http.route({
  path: "/api/auth/check-email",
  method: "OPTIONS",
  handler: handleCheckEmail,
});

http.route({
  path: "/api/auth/signin-attempt",
  method: "POST",
  handler: handleSignInAttempt,
});
http.route({
  path: "/api/auth/signin-attempt",
  method: "OPTIONS",
  handler: handleSignInAttempt,
});

http.route({
  path: "/api/health",
  method: "GET",
  handler: handleHealth,
});

// MCP server. Lives here and not on the Next.js app on purpose: these are
// the SITE-origin routes (`*.convex.site`), and both the endpoint and its
// discovery documents have to answer on the same host the MCP URL names —
// a client's first probe never reaches careerpack.org.
/**
 * Redeem a signed file link minted by the `files_read_url` MCP tool.
 *
 * Deliberately NOT authenticated: the token IS the credential, which is the
 * point — an AI host renders the image by fetching this URL directly, with no
 * session and no CareerPack cookie. What bounds it is the token itself: one
 * hour, HMAC-bound to the file id and owner, and ownership re-checked here
 * because a token outlives the row it points at.
 *
 * Redirects rather than proxying the bytes: the storage URL is short-lived on
 * Convex's side too, and streaming megabytes through a Convex action to save
 * one hop would be worse for both.
 */
http.route({ path: "/files/read", method: "GET", handler: handleSignedFileRead });

http.route({ path: "/mcp", method: "POST", handler: handleMcp });
http.route({ path: "/mcp", method: "GET", handler: handleMcp });
http.route({ path: "/mcp", method: "OPTIONS", handler: handleMcp });

// RFC 7591. Mounted on SITE beside /mcp because that is the origin a client
// reaches the discovery document from, and a registration endpoint on the app
// host would be a cross-origin hop the client has no reason to trust.
http.route({ path: "/oauth/register", method: "POST", handler: handleRegister });
http.route({ path: "/oauth/register", method: "OPTIONS", handler: handleRegister });

// Domain verification for the OpenAI Plugins Directory. Inert (404) until
// OPENAI_APPS_CHALLENGE is set on the deployment.
http.route({
  path: "/.well-known/openai-apps-challenge",
  method: "GET",
  handler: openaiAppsChallenge,
});

for (const method of ["GET", "OPTIONS"] as const) {
  http.route({
    path: "/.well-known/oauth-protected-resource",
    method,
    handler: protectedResourceMetadata,
  });
  // RFC 9728 §3.1 puts the resource's path after the well-known segment, so
  // a client resolving metadata for `https://…/mcp` asks for this one. Claude
  // probes it; ChatGPT probes the bare path. Serve both, same document.
  http.route({
    path: "/.well-known/oauth-protected-resource/mcp",
    method,
    handler: protectedResourceMetadata,
  });
  http.route({
    path: "/.well-known/oauth-authorization-server",
    method,
    handler: authorizationServerMetadata,
  });
}

// `/api/geo/country` used to live here and asked api.country.is to place the
// visitor's IP. It moved to `frontend/app/api/geo/route.ts`, which answers from
// the geoip-lite database already bundled with this app — same answer, no
// visitor address sent to a third party the privacy policy does not name. It
// could not stay on Convex: httpActions run in a V8 isolate with no
// filesystem, so geoip-lite's .dat files never load there.

export default http;
