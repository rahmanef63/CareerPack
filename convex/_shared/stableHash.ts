/**
 * Deterministic 32-bit FNV-1a over a canonical JSON rendering.
 *
 * Used as the optimistic-concurrency token for the CV import: the client
 * hashes what it believed was stored, the mutation re-hashes the row it is
 * about to overwrite, and a mismatch means somebody else edited that field
 * while the review dialog sat open. There is no version column anywhere, so
 * this is the whole concurrency story — it must give the same digest in the
 * browser and in the Convex runtime, hence no crypto, no Buffer, no Date.
 */

/** Object keys sorted so a re-serialized document cannot change the digest. */
function canonical(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`).join(",")}}`;
}

export function stableHash(value: unknown): string {
  const input = canonical(value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // Math.imul keeps the multiply in 32-bit space; a plain `*` overflows
    // into float territory and silently stops being FNV.
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
