import { describe, it, expect } from "vitest";
import { hashSecret, verifySecret } from "./passwordCrypto";

/**
 * Build a legacy v1 (`pbkdf2_`, 10k iter) hash using the SAME WebCrypto
 * primitives the old code used, so we can prove `verifySecret` still accepts
 * stored hashes from before the v2 (100k iter) bump. This mirrors the
 * historic hashSecret exactly; it lives in the test only — production never
 * mints v1 hashes anymore.
 */
async function makeLegacyV1Hash(password: string): Promise<string> {
  // Fixed salt so the hash is deterministic for the test.
  const salt = new Uint8Array([
    0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb,
    0xcc, 0xdd, 0xee, 0xff,
  ]);
  const enc = new TextEncoder();
  const km = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const buf = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 10000, hash: "SHA-256" },
    km,
    256,
  );
  const hex = (a: Uint8Array) =>
    Array.from(a)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  return `pbkdf2_${hex(salt)}_${hex(new Uint8Array(buf))}`;
}

describe("hashSecret / verifySecret round-trip", () => {
  it("verifies a freshly hashed password", async () => {
    const hash = await hashSecret("Sup3rSecret!");
    expect(await verifySecret("Sup3rSecret!", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashSecret("Sup3rSecret!");
    expect(await verifySecret("wrongPassword1", hash)).toBe(false);
  });

  it("rejects a password that differs by one character", async () => {
    const hash = await hashSecret("password123");
    expect(await verifySecret("password124", hash)).toBe(false);
  });

  it("produces a distinct hash each call (random salt)", async () => {
    const a = await hashSecret("password123");
    const b = await hashSecret("password123");
    expect(a).not.toBe(b);
    // ...but both still verify against the same password.
    expect(await verifySecret("password123", a)).toBe(true);
    expect(await verifySecret("password123", b)).toBe(true);
  });
});

describe("hash format / prefixes", () => {
  it("freshly produced hash carries the pbkdf2v2_ prefix", async () => {
    const hash = await hashSecret("password123");
    expect(hash.startsWith("pbkdf2v2_")).toBe(true);
  });

  it("produces three underscore-separated parts: prefix, salt hex, derived hex", async () => {
    const parts = (await hashSecret("password123")).split("_");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe("pbkdf2v2");
    // 16-byte salt -> 32 hex chars; 256-bit derived key -> 64 hex chars.
    expect(parts[1]).toMatch(/^[0-9a-f]{32}$/);
    expect(parts[2]).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("backward compatibility with legacy v1 hashes", () => {
  it("still verifies a legacy pbkdf2_ (10k iter) hash", async () => {
    const legacy = await makeLegacyV1Hash("legacyPass1");
    expect(legacy.startsWith("pbkdf2_")).toBe(true);
    expect(await verifySecret("legacyPass1", legacy)).toBe(true);
  });

  it("rejects a wrong password against a legacy v1 hash", async () => {
    const legacy = await makeLegacyV1Hash("legacyPass1");
    expect(await verifySecret("legacyPass2", legacy)).toBe(false);
  });
});

describe("malformed hashes return false without throwing", () => {
  it("empty string", async () => {
    await expect(verifySecret("password123", "")).resolves.toBe(false);
  });

  it("unknown prefix", async () => {
    await expect(
      verifySecret("password123", "scrypt_aabb_ccdd"),
    ).resolves.toBe(false);
  });

  it("too few parts (no derived segment)", async () => {
    await expect(verifySecret("password123", "pbkdf2v2_aabb")).resolves.toBe(
      false,
    );
  });

  it("too many parts", async () => {
    await expect(
      verifySecret("password123", "pbkdf2v2_aabb_ccdd_eeff"),
    ).resolves.toBe(false);
  });

  it("valid prefix + part count but mismatched derived length", async () => {
    // Correct shape (3 parts, known prefix, valid hex salt) but the derived
    // segment is the wrong length -> constant-time length guard returns false.
    await expect(
      verifySecret("password123", "pbkdf2v2_00112233445566778899aabbccddeeff_abcd"),
    ).resolves.toBe(false);
  });

  it("crafted empty salt segment (pbkdf2v2__<derived>) — false, not a throw", async () => {
    // Known prefix + exactly 3 parts, but the salt segment is empty, so the
    // old `parts[1].match(/.{2}/g)!.map(...)` dereferenced null and threw a
    // TypeError. The salt guard must short-circuit to false without throwing.
    await expect(
      verifySecret(
        "password123",
        "pbkdf2v2__00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
      ),
    ).resolves.toBe(false);
  });

  it("odd-length / non-hex salt segment — false, not a throw", async () => {
    // Odd-length salt also makes `.match(/.{2}/g)` drop the trailing nibble
    // (or return null for length 1); a non-hex char yields NaN bytes. Both
    // are malformed and must be rejected without throwing.
    await expect(
      verifySecret("password123", "pbkdf2v2_abc_ccdd"),
    ).resolves.toBe(false);
    await expect(
      verifySecret("password123", "pbkdf2v2_zz_ccdd"),
    ).resolves.toBe(false);
  });
});
