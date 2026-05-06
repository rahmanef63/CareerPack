import { mutation, internalMutation, internalAction, httpAction } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { renderResetEmail, sendEmail } from "./_shared/email";

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
  const user = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("email"), normalized))
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
  const tokenHash = await hashSecret(rawToken);

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

/**
 * Public HTTP endpoint: `POST /api/password-reset/request`.
 * Body: `{ "email": string }`.
 *
 * Always returns 200 + `{ ok: true }`. On bad input returns 400. On
 * unsupported method returns 405.
 *
 * IP extraction: prefer `x-forwarded-for` (first hop = client IP behind
 * trusted proxy / CDN), fallback to `x-real-ip`, fallback to "unknown".
 * Hashed before storage so privacy-conscious users don't end up with raw
 * IPs persisted server-side.
 */
export const handleRequestReset = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("method_not_allowed", { status: 405 });
  }

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return new Response("invalid_json", { status: 400 });
  }
  if (!parsed || typeof parsed !== "object") {
    return new Response("missing_payload", { status: 400 });
  }
  const email = (parsed as Record<string, unknown>).email;
  if (typeof email !== "string" || email.length === 0 || email.length > 200) {
    return new Response("missing_email", { status: 400 });
  }

  const ip = extractClientIp(request.headers);
  const ipHash = await sha256Hex(ip);

  await ctx.runMutation(internal.passwordReset._ipGatedRequestReset, {
    email,
    ipHash,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // Intentionally permissive — endpoint is anti-enumeration safe.
      "Access-Control-Allow-Origin": "*",
    },
  });
});

function extractClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc as BufferSource);
  return hex(new Uint8Array(buf));
}

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
      console.error(`[password-reset] email delivery failed reason=${result.reason} to=${args.to}`);
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

    // Linear scan is fine — tokens table is small (TTL 30m, invalidated on use).
    // by_hash index exists for future exact-match lookups if the hash becomes
    // deterministic; current hash uses random salt, so we must scan + verify.
    const candidates = await ctx.db.query("passwordResetTokens").collect();
    let match: (typeof candidates)[number] | null = null;
    for (const c of candidates) {
      if (c.usedAt) continue;
      if (c.expiresAt <= now) continue;
      if (await verifySecret(args.token, c.tokenHash)) {
        match = c;
        break;
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
