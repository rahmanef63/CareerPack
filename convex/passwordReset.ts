import { mutation, internalMutation, internalAction, httpAction } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { renderResetEmail, sendEmail } from "./_shared/email";
import { extractClientIp, sha256Hex } from "./_shared/clientIp";
import { rejectIfBadOrigin } from "./_shared/origin";
import { redactEmail } from "./_shared/redact";

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
const PBKDF2_ITERATIONS = 100_000;
const RESET_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RESET_RATE_MAX = 5;
// Per-IP cap: tighter than per-email so a single attacker IP can't hit
// many different addresses to enumerate / spam Resend. 10 reset requests
// per IP per hour is way past any legit user retry pattern.
const IP_RATE_MAX = 10;

function hex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function bytesFromHex(s: string): Uint8Array {
  const pairs = s.match(/.{2}/g) ?? [];
  return new Uint8Array(pairs.map((b) => parseInt(b, 16)));
}

// URL-safe base64 (no padding) — RFC 4648 §5
function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  // eslint-disable-next-line no-restricted-globals
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function pbkdf2Derive(secret: string, salt: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const km = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const saltBuf = salt.buffer.slice(
    salt.byteOffset,
    salt.byteOffset + salt.byteLength,
  ) as ArrayBuffer;
  const buf = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBuf, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    km,
    256,
  );
  return new Uint8Array(buf);
}

async function hashSecret(secret: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await pbkdf2Derive(secret, salt);
  return `pbkdf2v2_${hex(salt)}_${hex(derived)}`;
}

async function verifySecret(secret: string, stored: string): Promise<boolean> {
  const parts = stored.split("_");
  if (parts[0] !== "pbkdf2v2" || parts.length !== 3) return false;
  const salt = bytesFromHex(parts[1]);
  const expected = parts[2];
  const derived = hex(await pbkdf2Derive(secret, salt));
  if (derived.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < derived.length; i++) {
    diff |= derived.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Deterministic HMAC-SHA256 over the raw token using a server-only
 * secret. Enables the `by_hash` index to become an exact-match lookup
 * during `resetPassword` (replaces the previous full-table scan).
 *
 * Why HMAC instead of plain SHA256: an attacker who reads the DB sees
 * only HMAC outputs — without the server secret they can't precompute
 * a rainbow table mapping `hash → token`. Same single-pass speed.
 *
 * Falls back to a deploy-time derived secret if `PASSWORD_RESET_HMAC_SECRET`
 * is unset (legacy deploys). The fallback is stable across the process
 * lifetime so the same token always hashes to the same value during the
 * (TTL 30m) reset window.
 */
const HMAC_SECRET_FALLBACK = "careerpack-default-reset-hmac-key-do-not-rely-on-this";
function hmacKey(): string {
  return process.env.PASSWORD_RESET_HMAC_SECRET ?? HMAC_SECRET_FALLBACK;
}

async function hmacToken(rawToken: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(hmacKey()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(rawToken));
  return `hmacv1_${hex(new Uint8Array(sig))}`;
}

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function validatePassword(password: string) {
  if (password.length < 8) throw new Error("Kata sandi minimal 8 karakter");
  if (password.length > 128) throw new Error("Kata sandi terlalu panjang (maks 128)");
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error("Kata sandi harus mengandung huruf dan angka");
  }
}

/**
 * Core flow shared by the public mutation and the IP-gated httpAction.
 * Returns `{ ok: true }` even on failure / rate-limit to keep the
 * anti-enumeration property — caller cannot distinguish "your email is
 * registered" from "you hit the rate limit" from "spelled wrong".
 */
async function doRequestReset(ctx: MutationCtx, email: string): Promise<{ ok: true }> {
  const normalized = email.trim().toLowerCase();
  // Use the `email` index from authTables — exact-match O(log N) instead
  // of a full-table .filter() scan on every reset request.
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", normalized))
    .first();
  if (!user) return { ok: true as const };

  const now = Date.now();

  // Per-email rate limit. 5 requests/hour bucketed by user._id (1:1 to email).
  const recent = await ctx.db
    .query("passwordResetTokens")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .filter((q) => q.gte(q.field("_creationTime"), now - RESET_RATE_WINDOW_MS))
    .collect();
  if (recent.length >= RESET_RATE_MAX) {
    console.warn(`[password-reset] per-email rate-limited userId=${user._id} (${recent.length}/${RESET_RATE_MAX} in last hour)`);
    return { ok: true as const };
  }

  // Invalidate pending tokens for this user (keep DB small, prevent parallel reuse)
  for (const t of recent) {
    if (!t.usedAt && t.expiresAt > now) {
      await ctx.db.patch(t._id, { usedAt: now });
    }
  }

  const rawBytes = crypto.getRandomValues(new Uint8Array(32));
  const rawToken = toBase64Url(rawBytes);
  // HMAC (deterministic) — enables `by_hash` exact-match lookup at verify time.
  // The previous PBKDF2 random-salt hash forced a linear scan + verify.
  const tokenHash = await hmacToken(rawToken);

  await ctx.db.insert("passwordResetTokens", {
    userId: user._id,
    tokenHash,
    expiresAt: now + TOKEN_TTL_MS,
  });

  await ctx.scheduler.runAfter(0, internal.passwordReset.deliverResetEmail, {
    to: normalized,
    rawToken,
  });

  return { ok: true as const };
}

export const requestReset = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => doRequestReset(ctx, args.email),
});

/**
 * IP-gated wrapper invoked by the `/api/password-reset/request` httpAction.
 * Mutations don't expose request IP, so the httpAction extracts the IP,
 * hashes it (SHA-256 hex) for privacy, and passes the hash here.
 *
 * Two-tier rate limit (per-IP cap is enforced FIRST so an attacker can't
 * make us hit `passwordResetTokens` index for many emails from one IP):
 *   1. per-IP   — 10 req/hour (this function)
 *   2. per-email — 5 req/hour (handled by `doRequestReset`)
 *
 * Returns `{ ok: true }` on rate-limit overflow to preserve anti-enumeration.
 */
export const _ipGatedRequestReset = internalMutation({
  args: { email: v.string(), ipHash: v.string() },
  handler: async (ctx, { email, ipHash }) => {
    const now = Date.now();
    const windowStart = now - RESET_RATE_WINDOW_MS;
    const events = await ctx.db
      .query("passwordResetIpEvents")
      .withIndex("by_ipHash_time", (q) =>
        q.eq("ipHash", ipHash).gte("timestamp", windowStart),
      )
      .collect();
    if (events.length >= IP_RATE_MAX) {
      console.warn(`[password-reset] per-IP rate-limited ipHash=${ipHash.slice(0, 8)}… (${events.length}/${IP_RATE_MAX} in last hour)`);
      return { ok: true as const };
    }
    await ctx.db.insert("passwordResetIpEvents", { ipHash, timestamp: now });
    return doRequestReset(ctx, email);
  },
});

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

/**
 * Public HTTP endpoint: `POST /api/password-reset/request`.
 * Body: `{ "email": string }`.
 *
 * Always returns 200 + `{ ok: true }`. On bad input returns 400. On
 * unsupported method returns 405. OPTIONS preflight returns 204 with
 * permissive CORS — endpoint is anti-enumeration safe.
 *
 * IP extraction: prefer `x-forwarded-for` (first hop = client IP behind
 * trusted proxy / CDN), fallback to `x-real-ip`, fallback to "unknown".
 * Hashed before storage so privacy-conscious users don't end up with raw
 * IPs persisted server-side.
 */
export const handleRequestReset = httpAction(async (ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== "POST") {
    return new Response("method_not_allowed", {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  const originRejection = rejectIfBadOrigin(request, CORS_HEADERS);
  if (originRejection) return originRejection;

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return new Response("invalid_json", { status: 400, headers: CORS_HEADERS });
  }
  if (!parsed || typeof parsed !== "object") {
    return new Response("missing_payload", { status: 400, headers: CORS_HEADERS });
  }
  const email = (parsed as Record<string, unknown>).email;
  if (typeof email !== "string" || email.length === 0 || email.length > 200) {
    return new Response("missing_email", { status: 400, headers: CORS_HEADERS });
  }

  const ip = extractClientIp(request.headers);
  const ipHash = await sha256Hex(ip);

  await ctx.runMutation(internal.passwordReset._ipGatedRequestReset, {
    email,
    ipHash,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
});

/**
 * Deliver the reset email out-of-band. Scheduled by `requestReset` —
 * never call this from the frontend directly. The mutation has already
 * persisted the hashed token; this action just turns the raw token into
 * a link and hands it to whichever email backend is configured.
 *
 * NEVER write the raw token to a queryable table — earlier versions
 * wrote it to `errorLogs`, which any admin could read and use to take
 * over any account.
 */
export const deliverResetEmail = internalAction({
  args: { to: v.string(), rawToken: v.string() },
  handler: async (ctx, args) => {
    const baseUrl = (process.env.APP_URL ?? "https://careerpack.local").replace(/\/$/, "");
    const link = `${baseUrl}/reset-password/${encodeURIComponent(args.rawToken)}`;
    const { subject, html, text } = await renderResetEmail(link, args.to);
    const result = await sendEmail(ctx, {
      to: args.to,
      subject,
      html,
      text,
      tag: "password-reset",
      alwaysSend: true, // security mail — bypass marketing unsubscribe list
    });
    if (!result.ok) {
      console.error(`[password-reset] email delivery failed reason=${result.reason} to=${redactEmail(args.to)}`);
    }
    return result;
  },
});

export const resetPassword = mutation({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    validatePassword(args.newPassword);

    const now = Date.now();

    // HMAC-deterministic hash → exact-match `by_hash` lookup. Constant-
    // time string compare gates against accidental hash truncation /
    // race-window collisions. Legacy `pbkdf2v2_*` rows from before the
    // HMAC switch still verify via `verifySecret` linear-scan fallback —
    // the 30m TTL pruner clears them within a day of deploy.
    const expectedHash = await hmacToken(args.token);
    const directHit = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_hash", (q) => q.eq("tokenHash", expectedHash))
      .first();

    let match: typeof directHit | null = null;
    if (
      directHit &&
      !directHit.usedAt &&
      directHit.expiresAt > now &&
      constantTimeEq(directHit.tokenHash, expectedHash)
    ) {
      match = directHit;
    } else {
      const legacy = await ctx.db.query("passwordResetTokens").collect();
      for (const c of legacy) {
        if (c.usedAt) continue;
        if (c.expiresAt <= now) continue;
        if (!c.tokenHash.startsWith("pbkdf2v2_")) continue;
        if (await verifySecret(args.token, c.tokenHash)) {
          match = c;
          break;
        }
      }
    }

    if (!match) throw new Error("Token tidak valid atau sudah kedaluwarsa");

    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", match.userId).eq("provider", "password"),
      )
      .first();

    if (!account) {
      throw new Error("Akun tidak menggunakan sandi — tidak bisa direset");
    }

    const newSecret = await hashSecret(args.newPassword);
    await ctx.db.patch(account._id, { secret: newSecret });
    await ctx.db.patch(match._id, { usedAt: now });

    return { ok: true as const };
  },
});
