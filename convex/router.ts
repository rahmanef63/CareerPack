import { httpRouter } from "convex/server";
import { handleResendWebhook } from "./admin/webhooks";
import { handleUnsubscribeGet, handleUnsubscribePost } from "./admin/unsubscribes";
import { handleRequestReset } from "./passwordReset";

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

export default http;
