import { httpRouter } from "convex/server";
import { handleResendWebhook } from "./admin/webhooks";
import { handleUnsubscribeGet, handleUnsubscribePost } from "./admin/unsubscribes";

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

export default http;
