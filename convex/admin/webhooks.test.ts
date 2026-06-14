import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { acceptUnverifiedEvents, verifySvixSignature } from "./webhooks";

// `import.meta.glob` is a Vite/Vitest feature; the convex tsconfig only pulls
// in @types/node, so augment ImportMeta locally (mirrors guards.integration.test.ts).
declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<Record<string, unknown>>>;
  }
}

// convex-test needs the full function module graph incl. `_generated`; drop
// type-only `.d.ts` and the test/config files. From a co-located test inside
// `convex/admin/`, `import.meta.glob("../**")` excludes this very directory,
// so the parent glob alone misses `admin/*`. We additionally glob the current
// dir (`./**`) and re-root those keys to `../admin/...` so convex-test (which
// derives its module root from the `_generated` path → prefix `../`) resolves
// `admin/<file>` correctly.
const parentModules = import.meta.glob("../**/*.{ts,js}");
const adminModules = Object.fromEntries(
  Object.entries(import.meta.glob("./**/*.{ts,js}")).map(([path, loader]) => [
    path.replace(/^\.\//, "../admin/"),
    loader,
  ]),
);
const modules = Object.fromEntries(
  Object.entries({ ...parentModules, ...adminModules }).filter(
    ([path]) => !path.endsWith(".d.ts") && !/\.(test|spec|config)\./.test(path),
  ),
);

const SECRET = "whsec_dGhpc2lzYXRlc3RzZWNyZXRrZXkxMjM0NTY3OA==";

function setup() {
  return convexTest(schema, modules);
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return Buffer.from(bin, "binary").toString("base64");
}

function base64ToBytes(s: string): Uint8Array {
  const bin = Buffer.from(s, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Produce a genuine Svix `v1,<sig>` signature the same way the receiver does.
async function signSvix(secret: string, id: string, timestamp: string, body: string) {
  const secretB64 = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  const key = await crypto.subtle.importKey(
    "raw",
    base64ToBytes(secretB64) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${body}`),
  );
  return `v1,${bytesToBase64(new Uint8Array(sig))}`;
}

function signedHeaders(sig: string, id: string, timestamp: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "svix-id": id,
    "svix-timestamp": timestamp,
    "svix-signature": sig,
  };
}

const BODY = JSON.stringify({
  type: "email.delivered",
  data: { email_id: "abc", to: ["user@example.com"], subject: "Hi" },
});

async function countEvents(t: ReturnType<typeof setup>): Promise<number> {
  return t.run(async (ctx) => (await ctx.db.query("emailEvents").collect()).length);
}

describe("acceptUnverifiedEvents — opt-in grace flag", () => {
  const original = process.env.RESEND_WEBHOOK_ACCEPT_UNVERIFIED;
  afterEach(() => {
    if (original === undefined) delete process.env.RESEND_WEBHOOK_ACCEPT_UNVERIFIED;
    else process.env.RESEND_WEBHOOK_ACCEPT_UNVERIFIED = original;
  });

  it("defaults to false when the flag is unset", () => {
    delete process.env.RESEND_WEBHOOK_ACCEPT_UNVERIFIED;
    expect(acceptUnverifiedEvents()).toBe(false);
  });

  it("is true only for explicit '1' or 'true'", () => {
    process.env.RESEND_WEBHOOK_ACCEPT_UNVERIFIED = "1";
    expect(acceptUnverifiedEvents()).toBe(true);
    process.env.RESEND_WEBHOOK_ACCEPT_UNVERIFIED = "true";
    expect(acceptUnverifiedEvents()).toBe(true);
    process.env.RESEND_WEBHOOK_ACCEPT_UNVERIFIED = "0";
    expect(acceptUnverifiedEvents()).toBe(false);
    process.env.RESEND_WEBHOOK_ACCEPT_UNVERIFIED = "yes";
    expect(acceptUnverifiedEvents()).toBe(false);
  });
});

describe("verifySvixSignature", () => {
  const originalSecret = process.env.RESEND_WEBHOOK_SECRET;
  afterEach(() => {
    if (originalSecret === undefined) delete process.env.RESEND_WEBHOOK_SECRET;
    else process.env.RESEND_WEBHOOK_SECRET = originalSecret;
  });

  function h(entries: Record<string, string>): Headers {
    const headers = new Headers();
    for (const [k, v] of Object.entries(entries)) headers.set(k, v);
    return headers;
  }

  it("returns false when no secret is configured (unsigned path)", async () => {
    delete process.env.RESEND_WEBHOOK_SECRET;
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = await signSvix(SECRET, "evt_1", ts, BODY);
    expect(await verifySvixSignature(BODY, h(signedHeaders(sig, "evt_1", ts)))).toBe(false);
  });

  it("returns true for a valid signature", async () => {
    process.env.RESEND_WEBHOOK_SECRET = SECRET;
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = await signSvix(SECRET, "evt_1", ts, BODY);
    expect(await verifySvixSignature(BODY, h(signedHeaders(sig, "evt_1", ts)))).toBe(true);
  });

  it("returns false for a tampered body", async () => {
    process.env.RESEND_WEBHOOK_SECRET = SECRET;
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = await signSvix(SECRET, "evt_1", ts, BODY);
    expect(
      await verifySvixSignature(BODY + "tamper", h(signedHeaders(sig, "evt_1", ts))),
    ).toBe(false);
  });
});

describe("handleResendWebhook — persistence gating", () => {
  const originalSecret = process.env.RESEND_WEBHOOK_SECRET;
  const originalFlag = process.env.RESEND_WEBHOOK_ACCEPT_UNVERIFIED;

  beforeEach(() => {
    delete process.env.RESEND_WEBHOOK_SECRET;
    delete process.env.RESEND_WEBHOOK_ACCEPT_UNVERIFIED;
  });
  afterEach(() => {
    if (originalSecret === undefined) delete process.env.RESEND_WEBHOOK_SECRET;
    else process.env.RESEND_WEBHOOK_SECRET = originalSecret;
    if (originalFlag === undefined) delete process.env.RESEND_WEBHOOK_ACCEPT_UNVERIFIED;
    else process.env.RESEND_WEBHOOK_ACCEPT_UNVERIFIED = originalFlag;
  });

  it("rejects with 401 and writes NOTHING when no secret is configured", async () => {
    const t = setup();
    const ts = String(Math.floor(Date.now() / 1000));
    const res = await t.fetch("/webhooks/resend", {
      method: "POST",
      headers: signedHeaders("v1,bogus", "evt_unsigned", ts),
      body: BODY,
    });
    expect(res.status).toBe(401);
    expect(await countEvents(t)).toBe(0);
  });

  it("rejects with 401 and writes NOTHING when the signature fails", async () => {
    process.env.RESEND_WEBHOOK_SECRET = SECRET;
    const t = setup();
    const ts = String(Math.floor(Date.now() / 1000));
    const res = await t.fetch("/webhooks/resend", {
      method: "POST",
      headers: signedHeaders("v1,deadbeef", "evt_forged", ts),
      body: BODY,
    });
    expect(res.status).toBe(401);
    expect(await countEvents(t)).toBe(0);
  });

  it("persists exactly ONE verified row for a valid signature", async () => {
    process.env.RESEND_WEBHOOK_SECRET = SECRET;
    const t = setup();
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = await signSvix(SECRET, "evt_ok", ts, BODY);
    const res = await t.fetch("/webhooks/resend", {
      method: "POST",
      headers: signedHeaders(sig, "evt_ok", ts),
      body: BODY,
    });
    expect(res.status).toBe(200);
    expect(await countEvents(t)).toBe(1);
    const row = await t.run((ctx) => ctx.db.query("emailEvents").first());
    expect(row?.verified).toBe(true);
    expect(row?.eventId).toBe("evt_ok");
  });

  it("stays idempotent on svix-id (a retry writes no second row)", async () => {
    process.env.RESEND_WEBHOOK_SECRET = SECRET;
    const t = setup();
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = await signSvix(SECRET, "evt_dup", ts, BODY);
    const init = { method: "POST", headers: signedHeaders(sig, "evt_dup", ts), body: BODY };
    await t.fetch("/webhooks/resend", init);
    await t.fetch("/webhooks/resend", init);
    expect(await countEvents(t)).toBe(1);
  });

  it("with the grace flag set, an unsigned event persists ONE advisory row", async () => {
    process.env.RESEND_WEBHOOK_ACCEPT_UNVERIFIED = "1";
    const t = setup();
    const ts = String(Math.floor(Date.now() / 1000));
    const res = await t.fetch("/webhooks/resend", {
      method: "POST",
      headers: signedHeaders("v1,bogus", "evt_grace", ts),
      body: BODY,
    });
    expect(res.status).toBe(200);
    expect(await countEvents(t)).toBe(1);
    const row = await t.run((ctx) => ctx.db.query("emailEvents").first());
    expect(row?.verified).toBe(false);
  });
});
