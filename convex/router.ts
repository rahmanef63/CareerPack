import { httpRouter } from "convex/server";
import { handleResendWebhook } from "./admin/webhooks";
import { handleUnsubscribeGet, handleUnsubscribePost } from "./admin/unsubscribes";
import { handleRequestReset } from "./passwordReset";
import { handleCheckEmail } from "./authCheckEmail";
import { handleHealth } from "./health";

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
  path: "/api/health",
  method: "GET",
  handler: handleHealth,
});

export default http;
