import { mutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { renderResetEmail, sendEmail } from "./_shared/email";

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
const PBKDF2_ITERATIONS = 100_000;
const RESET_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RESET_RATE_MAX = 5;

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

export const requestReset = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    // Always return ok — no enumeration of registered emails.
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first();

    if (!user) return { ok: true as const };

    const now = Date.now();

    // Per-email rate limit. Mutations don't expose request IP, so we
    // bucket by user._id (effectively per-email since email→user is 1:1).
    // 5 requests/hour: enough for a real user retrying, low enough to
    // blunt mass-spam against a single inbox. Silent on overflow to keep
    // the anti-enumeration property — same response as a non-existent email.
    const recent = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("_creationTime"), now - RESET_RATE_WINDOW_MS))
      .collect();
    if (recent.length >= RESET_RATE_MAX) {
      console.warn(`[password-reset] rate-limited userId=${user._id} (${recent.length}/${RESET_RATE_MAX} in last hour)`);
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

    // Hand off to an action — only actions can fetch() to Resend.
    // Action picks env vars at runtime and falls back to console log
    // when RESEND_API_KEY is unset.
    await ctx.scheduler.runAfter(0, internal.passwordReset.deliverResetEmail, {
      to: email,
      rawToken,
    });

    return { ok: true as const };
  },
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
  handler: async (_ctx, args) => {
    const baseUrl = (process.env.APP_URL ?? "https://careerpack.local").replace(/\/$/, "");
    const link = `${baseUrl}/reset-password/${encodeURIComponent(args.rawToken)}`;
    const { subject, html, text } = renderResetEmail(link);
    const result = await sendEmail({ to: args.to, subject, html, text });
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
