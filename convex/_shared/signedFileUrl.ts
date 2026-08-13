import { requireEnv } from "./env";

/**
 * Short-lived, ownership-bound read links for Content Library files.
 *
 * Why this exists rather than handing out `ctx.storage.getUrl()` directly:
 * a Convex storage URL does not expire and is a bearer credential — anyone
 * holding the string can fetch the bytes, forever, with no session. The MCP
 * tools hand their return value to a third-party AI host, where it lands in a
 * transcript that may be logged, replayed, or shown to someone else. That is
 * exactly why `convex/mcp/tools/files.ts` refused to return one at all.
 *
 * The compromise the owner chose is a one-hour window. This module is what
 * makes that a fact rather than a promise: the token carries its own expiry
 * and the file id, both covered by an HMAC, so a leaked link stops working on
 * its own and cannot be edited to point at a different file.
 *
 * Not a JWT: no library, no algorithm negotiation, nothing to downgrade. Just
 * `payload.signature`, both base64url, verified with a constant-time compare.
 */

/** Deliberately separate from AI_CRED_SECRET and the auth keys — a signing key
 *  should authorise one thing, so rotating it breaks one thing. */
const SECRET_ENV = "FILE_URL_SECRET";

export const FILE_URL_TTL_SECONDS = 60 * 60;

interface Payload {
  /** `files` row id. Bound into the signature so a token cannot be retargeted. */
  f: string;
  /** Owner at mint time. Re-checked on redeem — a token outlives a transfer. */
  u: string;
  /** Unix seconds. */
  exp: number;
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(text: string): Uint8Array {
  const pad = text.length % 4 === 0 ? "" : "=".repeat(4 - (text.length % 4));
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(requireEnv(SECRET_ENV)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function sign(body: string): Promise<string> {
  const sig = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(),
    new TextEncoder().encode(body),
  );
  return b64url(new Uint8Array(sig));
}

/** Length-independent compare. `crypto.subtle.verify` would do, but this keeps
 *  the encode/decode symmetric with `sign` above and avoids a second import. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function mintFileToken(args: {
  fileId: string;
  userId: string;
  ttlSeconds?: number;
}): Promise<{ token: string; expiresAt: number }> {
  const exp = Math.floor(Date.now() / 1000) + (args.ttlSeconds ?? FILE_URL_TTL_SECONDS);
  const payload: Payload = { f: args.fileId, u: args.userId, exp };
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  return { token: `${body}.${await sign(body)}`, expiresAt: exp * 1000 };
}

/**
 * Returns the payload, or null for anything wrong — bad shape, bad signature,
 * expired. One null for every failure on purpose: the caller answers 404
 * either way, so a probe cannot tell "wrong signature" from "not yet expired".
 */
export async function verifyFileToken(token: string): Promise<Payload | null> {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let expected: string;
  try {
    expected = await sign(body);
  } catch {
    // Secret missing. Refuse rather than fall through to an unsigned path.
    return null;
  }
  if (!timingSafeEqual(sig, expected)) return null;

  let payload: Payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as Payload;
  } catch {
    return null;
  }
  if (typeof payload?.f !== "string" || typeof payload?.u !== "string") return null;
  if (typeof payload?.exp !== "number") return null;
  if (payload.exp * 1000 <= Date.now()) return null;

  return payload;
}
