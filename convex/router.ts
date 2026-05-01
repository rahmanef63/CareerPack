import { httpRouter } from "convex/server";
import { handleResendWebhook } from "./admin/webhooks";

const http = httpRouter();

http.route({
  path: "/webhooks/resend",
  method: "POST",
  handler: handleResendWebhook,
});

export default http;
