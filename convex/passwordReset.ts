import { mutation } from "./_generated/server";
import { v } from "convex/values";

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
const PBKDF2_ITERATIONS = 100_000;

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

    // Invalidate pending tokens for this user (keep DB small, prevent parallel reuse)
    const existing = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const now = Date.now();
    for (const t of existing) {
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

    // V1 delivery: log to errorLogs so dev/admin can retrieve the link.
    // V2 replaces this with an email action via Resend/SMTP.
    await ctx.db.insert("errorLogs", {
      userId: user._id,
      source: "password-reset",
      message: `Reset link: /reset-password/${rawToken}`,
      route: "/forgot-password",
      timestamp: now,
    });

    return { ok: true as const };
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
