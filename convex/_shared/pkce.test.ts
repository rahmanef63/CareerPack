import { describe, it, expect } from "vitest";
import {
  base64Url,
  randomToken,
  sha256Base64Url,
  timingSafeEqual,
  verifyPkce,
} from "./pkce";

// RFC 7636 Appendix B. Pinning the published vector is the only way to
// catch the base64-vs-base64url slip: plain base64 produces a challenge
// that looks right, matches nothing, and only fails at the token endpoint.
const RFC_VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const RFC_CHALLENGE = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

describe("sha256Base64Url", () => {
  it("matches the RFC 7636 test vector", async () => {
    expect(await sha256Base64Url(RFC_VERIFIER)).toBe(RFC_CHALLENGE);
  });

  it("emits no base64 characters that PKCE strips", async () => {
    for (let i = 0; i < 50; i++) {
      expect(await sha256Base64Url(randomToken(16))).not.toMatch(/[+/=]/);
    }
  });
});

describe("verifyPkce", () => {
  const S256 = { challenge: RFC_CHALLENGE, method: "S256" };

  it("accepts the verifier that produced the challenge", async () => {
    expect(await verifyPkce({ verifier: RFC_VERIFIER, ...S256 })).toBeNull();
  });

  it("rejects plain — the challenge would equal the verifier, so anyone who saw the authorize URL could redeem the code", async () => {
    expect(
      await verifyPkce({
        verifier: RFC_VERIFIER,
        challenge: RFC_VERIFIER,
        method: "plain",
      }),
    ).toBe("unsupported_method");
  });

  it("rejects a verifier outside RFC 7636 43..128", async () => {
    expect(await verifyPkce({ verifier: "a".repeat(42), ...S256 })).toBe(
      "bad_verifier_length",
    );
    expect(await verifyPkce({ verifier: "a".repeat(129), ...S256 })).toBe(
      "bad_verifier_length",
    );
    // 43 and 128 are inside the range: they must fail on the hash, not the length.
    expect(await verifyPkce({ verifier: "a".repeat(43), ...S256 })).toBe(
      "mismatch",
    );
    expect(await verifyPkce({ verifier: "a".repeat(128), ...S256 })).toBe(
      "mismatch",
    );
  });

  it("rejects characters outside the unreserved set", async () => {
    expect(
      await verifyPkce({ verifier: `+${"a".repeat(42)}`, ...S256 }),
    ).toBe("bad_verifier_charset");
  });

  it("rejects a well-formed verifier for a different challenge", async () => {
    expect(
      await verifyPkce({
        verifier: RFC_VERIFIER,
        challenge: await sha256Base64Url("something-else-entirely"),
        method: "S256",
      }),
    ).toBe("mismatch");
  });
});

describe("timingSafeEqual", () => {
  it("compares by value, not identity or prefix", () => {
    expect(timingSafeEqual("abc123", "abc123")).toBe(true);
    expect(timingSafeEqual("abc123", "abc124")).toBe(false);
    expect(timingSafeEqual("abc", "abc123")).toBe(false);
    expect(timingSafeEqual("", "")).toBe(true);
  });
});

describe("randomToken", () => {
  it("is hex of the requested byte length and does not repeat", () => {
    const a = randomToken(32);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(randomToken(32));
  });
});

describe("base64Url", () => {
  it("substitutes and strips instead of emitting standard base64", () => {
    // 0xfb 0xff encodes to "+/8=" in standard base64 — one byte from each
    // substitution class plus padding.
    expect(base64Url(new Uint8Array([0xfb, 0xff]))).toBe("-_8");
  });
});
