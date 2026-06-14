/**
 * Pure PBKDF2-SHA256 password hashing helpers, extracted verbatim from the
 * inline `crypto` closures of the `Password` provider in `convex/auth.ts`.
 *
 * WHY a separate module: this is the highest-value hand-rolled crypto in the
 * codebase and the never-revert-to-Scrypt constraint makes it permanent — see
 * `convex/auth.ts`. PBKDF2 (WebCrypto) is used instead of the default Scrypt
 * because Scrypt times out behind Dokploy's reverse proxy (>60s), dropping the
 * WebSocket action. Iterations = 100k: OWASP 2023 minimum for PBKDF2-SHA256.
 *
 * DO NOT change the algorithm, iteration counts (100k for v2 / 10k legacy),
 * salt scheme (16 random bytes), hex encoding, or the `pbkdf2_` / `pbkdf2v2_`
 * prefixes — behaviour must stay byte-identical for stored hashes to keep
 * verifying. New hashes use the `pbkdf2v2_` prefix; `verifySecret` still
 * accepts legacy `pbkdf2_` (10k iter) hashes for backward compatibility.
 */

const V2_PREFIX = "pbkdf2v2";
const V1_PREFIX = "pbkdf2";
const V2_ITERATIONS = 100000;
const V1_ITERATIONS = 10000;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function deriveHex(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<string> {
  const enc = new TextEncoder();
  const km = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  // Slice to a fresh ArrayBuffer so the salt is typed as BufferSource (not a
  // SharedArrayBuffer-backed view) — matches the idiom in passwordReset.ts.
  // Byte-identical: the slice contains exactly the salt's bytes.
  const saltBuf = salt.buffer.slice(
    salt.byteOffset,
    salt.byteOffset + salt.byteLength,
  ) as ArrayBuffer;
  const buf = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBuf, iterations, hash: "SHA-256" },
    km,
    256,
  );
  return toHex(new Uint8Array(buf));
}

/**
 * Hash a password with a fresh 16-byte salt at 100k iterations.
 * Returns `pbkdf2v2_<saltHex>_<derivedHex>`.
 */
export async function hashSecret(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await deriveHex(password, salt, V2_ITERATIONS);
  return `${V2_PREFIX}_${toHex(salt)}_${derived}`;
}

/**
 * Constant-time verify of a password against a stored hash. Supports both v1
 * (10k iter, legacy `pbkdf2_`) and v2 (100k iter, `pbkdf2v2_`). Returns false
 * for any malformed hash (unknown prefix, wrong part count, empty string)
 * without throwing.
 */
export async function verifySecret(
  password: string,
  hash: string,
): Promise<boolean> {
  const parts = hash.split("_");
  // Support both v1 (10k iter, legacy) and v2 (100k iter)
  if ((parts[0] !== V1_PREFIX && parts[0] !== V2_PREFIX) || parts.length !== 3) {
    return false;
  }
  const iterations = parts[0] === V2_PREFIX ? V2_ITERATIONS : V1_ITERATIONS;
  const salt = new Uint8Array(
    parts[1].match(/.{2}/g)!.map((b) => parseInt(b, 16)),
  );
  const hex = await deriveHex(password, salt, iterations);
  // Constant-time compare
  if (hex.length !== parts[2].length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) {
    diff |= hex.charCodeAt(i) ^ parts[2].charCodeAt(i);
  }
  return diff === 0;
}
