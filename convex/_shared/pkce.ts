/**
 * PKCE (RFC 7636) + opaque-token helpers for the MCP OAuth 2.1 flow.
 *
 * Pure: no Convex ctx, no db. Importable from mutations, httpActions and
 * vitest alike, which is the whole point — the security-critical half of
 * OAuth is this file, and it is the only half that can be tested without
 * standing up a deployment.
 */

const B64URL = /^[A-Za-z0-9\-._~]+$/;

/**
 * base64url per RFC 4648 §5. Plain base64 here silently produces a
 * challenge that never matches the client's — `+`/`/`/`=` are exactly
 * the characters PKCE strips, and the mismatch only shows up as
 * `invalid_grant` at the token endpoint, long after the bug was written.
 */
export function base64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256Base64Url(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input) as BufferSource,
  );
  return base64Url(new Uint8Array(digest));
}

/** Hex, from the platform CSPRNG. 32 bytes = 256 bits of entropy. */
export function randomToken(byteLength = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// RFC 7636 §4.1. Below 43 chars the verifier has under 256 bits of
// entropy and becomes brute-forceable against a stolen code; above 128
// it is a memory-burn vector on a public endpoint.
export const VERIFIER_MIN = 43;
export const VERIFIER_MAX = 128;

export type PkceFailure =
  | "unsupported_method"
  | "bad_verifier_length"
  | "bad_verifier_charset"
  | "mismatch";

/**
 * Returns null when the verifier proves possession of the challenge,
 * otherwise the reason. `plain` is refused outright: it makes the
 * challenge equal to the verifier, so anyone who intercepted the
 * authorize redirect can complete the exchange — which is the single
 * attack PKCE exists to stop.
 */
export async function verifyPkce(args: {
  verifier: string;
  challenge: string;
  method: string;
}): Promise<PkceFailure | null> {
  if (args.method !== "S256") return "unsupported_method";
  if (
    args.verifier.length < VERIFIER_MIN ||
    args.verifier.length > VERIFIER_MAX
  ) {
    return "bad_verifier_length";
  }
  if (!B64URL.test(args.verifier)) return "bad_verifier_charset";
  const computed = await sha256Base64Url(args.verifier);
  return timingSafeEqual(computed, args.challenge) ? null : "mismatch";
}

/**
 * Constant-time-ish string compare. `===` on a secret leaks its prefix
 * length through timing; this always walks the full string. Length is
 * still observable, which is fine — every token this compares is a
 * fixed-length hex string.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
