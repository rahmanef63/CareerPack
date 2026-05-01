import { httpAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

/**
 * Resend webhook receiver.
 *
 * Resend signs payloads with Svix (`svix-id`, `svix-timestamp`,
 * `svix-signature` headers). We verify if `RESEND_WEBHOOK_SECRET` is
 * configured; otherwise we still accept + persist the event with
 * `verified: false` so traffic isn't dropped while the secret is being
 * rolled out. Treat unverified rows as advisory.
 *
 * Setup (once, after deploy):
 *   1. Resend dashboard → Webhooks → Add → URL `https://api.careerpack.org/webhooks/resend`
 *   2. Copy the Signing Secret (starts with `whsec_`)
 *   3. `convex env set RESEND_WEBHOOK_SECRET <secret>` (or via admin REST)
 *   4. Verify: `convex/admin/queries.ts#listEmailEvents` shows incoming rows
 */
export const handleResendWebhook = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("method_not_allowed", { status: 405 });
  }

  const body = await request.text();
  const headers = request.headers;

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return new Response("invalid_json", { status: 400 });
  }

  const verified = await verifySvixSignature(body, headers);

  if (!parsed || typeof parsed !== "object") {
    return new Response("missing_payload", { status: 400 });
  }
  const ev = parsed as Record<string, unknown>;
  const type = typeof ev.type === "string" ? ev.type : "unknown";
  const eventId = headers.get("svix-id") ?? `${type}-${Date.now()}`;
  const data = (ev.data ?? {}) as Record<string, unknown>;
  const to = extractFirstRecipient(data);
  const emailId = typeof data.email_id === "string" ? data.email_id : undefined;
  const subject = typeof data.subject === "string" ? data.subject : undefined;
  const reason = extractReason(data);

  await ctx.runMutation(internal.admin.webhooks._recordEmailEvent, {
    eventId,
    type,
    to,
    emailId,
    subject,
    reason,
    verified,
    raw: body.slice(0, 4000),
  });

  return new Response(JSON.stringify({ ok: true, verified }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

/**
 * Internal — only the httpAction above writes via this. Idempotent on
 * `eventId` so Resend retries don't duplicate rows.
 */
export const _recordEmailEvent = internalMutation({
  args: {
    eventId: v.string(),
    type: v.string(),
    to: v.string(),
    emailId: v.optional(v.string()),
    subject: v.optional(v.string()),
    reason: v.optional(v.string()),
    verified: v.boolean(),
    raw: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailEvents")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();
    if (existing) return { duplicate: true };
    await ctx.db.insert("emailEvents", {
      eventId: args.eventId,
      type: args.type,
      to: args.to,
      emailId: args.emailId,
      subject: args.subject,
      reason: args.reason,
      verified: args.verified,
      raw: args.raw,
      createdAt: Date.now(),
    });
    return { duplicate: false };
  },
});

function extractFirstRecipient(data: Record<string, unknown>): string {
  const to = data.to;
  if (Array.isArray(to) && typeof to[0] === "string") return to[0];
  if (typeof to === "string") return to;
  return "";
}

function extractReason(data: Record<string, unknown>): string | undefined {
  // Resend nests reason differently per event type.
  const bounce = data.bounce;
  if (bounce && typeof bounce === "object") {
    const r = (bounce as Record<string, unknown>).message;
    if (typeof r === "string") return r;
  }
  if (typeof data.reason === "string") return data.reason;
  return undefined;
}

/**
 * Svix signature verification.
 *
 * Per https://docs.svix.com/receiving/verifying-payloads/how-manual,
 * sign content is `${id}.${timestamp}.${body}`, HMAC-SHA256 with the
 * secret bytes (`whsec_<base64>`), compared base64 against the comma-
 * separated `svix-signature` header (each entry prefixed `v1,`).
 *
 * Tolerates 5-minute timestamp drift.
 */
async function verifySvixSignature(body: string, headers: Headers): Promise<boolean> {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return false;

  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatureHeader = headers.get("svix-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  // Replay window — 5 minutes.
  const tsNum = Number(timestamp);
  if (!Number.isFinite(tsNum)) return false;
  const drift = Math.abs(Date.now() / 1000 - tsNum);
  if (drift > 5 * 60) return false;

  const secretB64 = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  const secretBytes = base64ToBytes(secretB64);
  if (!secretBytes) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const data = enc.encode(`${id}.${timestamp}.${body}`);
  const sigBuf = await crypto.subtle.sign("HMAC", key, data);
  const expected = bytesToBase64(new Uint8Array(sigBuf));

  // Header value is space-separated `v1,<sig> v1,<sig2>`. Constant-time
  // compare each candidate against expected.
  const candidates = signatureHeader.split(" ").map((s) => s.trim()).filter(Boolean);
  for (const cand of candidates) {
    const [scheme, sig] = cand.split(",");
    if (scheme !== "v1" || !sig) continue;
    if (timingSafeEqual(sig, expected)) return true;
  }
  return false;
}

function base64ToBytes(s: string): Uint8Array | null {
  try {
    // eslint-disable-next-line no-restricted-globals
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  // eslint-disable-next-line no-restricted-globals
  return btoa(bin);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
