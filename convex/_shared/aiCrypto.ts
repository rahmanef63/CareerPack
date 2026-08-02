/**
 * AES-256-GCM at rest for AI provider credentials (`aiSettings.apiKey`,
 * `globalAISettings.apiKey`). Master secret: Convex env `AI_CRED_SECRET`.
 *
 * Two facts about production shaped every decision here:
 *
 *  1. There is a LIVE global key sitting in that column in plaintext right
 *     now, and every AI feature reads it on every request. So the read path
 *     accepts both formats and this change rewrites no existing row — the
 *     alternative (bulk re-encrypt on deploy) means one failed migration
 *     takes AI down for everyone at once.
 *  2. `AI_CRED_SECRET` may legitimately be unset (local dev, a fresh
 *     deployment). Everything that works without it must keep working; only
 *     the OAuth connect, which would be minting a NEW secret the user never
 *     sees, refuses. See `credEncryptionAvailable`.
 *
 * The `encv1:` tag is what makes both possible: ciphertext is self-describing,
 * so `decryptCred` distinguishes a stored blob from a raw `sk-…` with no
 * schema column and no migration. Bump the tag if the scheme ever changes;
 * old rows keep decrypting under the old branch.
 */

const TAG = "encv1:";
const enc = new TextEncoder();
const dec = new TextDecoder();

export function isEncryptedCred(stored: string): boolean {
  return stored.startsWith(TAG);
}

/** Whether new secrets can be stored encrypted at all. */
export function credEncryptionAvailable(): boolean {
  return (process.env.AI_CRED_SECRET ?? "").trim() !== "";
}

async function credKey(): Promise<CryptoKey> {
  const secret = (process.env.AI_CRED_SECRET ?? "").trim();
  if (!secret) {
    throw new Error("AI_CRED_SECRET belum diset di deployment Convex");
  }
  // SHA-256 the env value rather than demanding base64-of-32-bytes: any
  // non-empty string then works, so an operator who pastes a passphrase gets
  // working encryption instead of a throw on a path (saving an API key) that
  // was infallible before this file existed.
  const raw = await crypto.subtle.digest("SHA-256", enc.encode(secret) as BufferSource);
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** `encv1:` + base64(iv[12] ‖ ciphertext‖tag). Fresh IV per call — reusing one
 *  under the same key is the single mistake that breaks GCM outright. */
export async function encryptCred(plain: string): Promise<string> {
  const key = await credKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plain) as BufferSource),
  );
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv);
  out.set(ct, iv.length);
  return TAG + toBase64(out);
}

/**
 * Untagged input is returned verbatim — that is the plaintext-compat branch
 * the live global key depends on, not an oversight.
 */
export async function decryptCred(stored: string): Promise<string> {
  if (!isEncryptedCred(stored)) return stored;
  const raw = Uint8Array.from(atob(stored.slice(TAG.length)), (c) => c.charCodeAt(0));
  const key = await credKey();
  try {
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: raw.slice(0, 12) },
      key,
      raw.slice(12) as BufferSource,
    );
    return dec.decode(pt);
  } catch {
    // GCM authentication failed: the secret was rotated or replaced. Say so —
    // the generic "Server Error" this used to become sends whoever is on call
    // hunting the provider instead of the env var.
    throw new Error(
      "Kredensial AI tidak bisa didekripsi — AI_CRED_SECRET berubah atau salah.",
    );
  }
}

/**
 * Write-path helper: encrypt when we can, store plaintext when we cannot.
 * Without this branch, setting `AI_CRED_SECRET` becomes a hard prerequisite
 * for saving any API key, and the settings form starts throwing on a
 * deployment where it used to work.
 */
export async function maybeEncryptCred(plain: string): Promise<string> {
  return credEncryptionAvailable() ? await encryptCred(plain) : plain;
}
