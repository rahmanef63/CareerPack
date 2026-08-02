import { describe, it, expect } from "vitest";
import { extractClientIp, sha256Hex } from "./clientIp";

function h(entries: Record<string, string>): Headers {
  const headers = new Headers();
  for (const [k, v] of Object.entries(entries)) headers.set(k, v);
  return headers;
}

describe("extractClientIp", () => {
  it("returns 'unknown' for empty headers", () => {
    expect(extractClientIp(h({}))).toBe("unknown");
  });

  it("takes the RIGHT-most x-forwarded-for hop (trusted-proxy appended)", () => {
    // Multi-hop chain: the genuine client IP is the last entry, appended
    // by our trusted reverse proxy — NOT the leftmost client-claimed one.
    expect(
      extractClientIp(h({ "x-forwarded-for": "10.0.0.1, 203.0.113.1" })),
    ).toBe("203.0.113.1");
  });

  it("ignores a spoofed leftmost x-forwarded-for value", () => {
    // Attacker forges a leftmost entry per request to rotate rate-limit
    // buckets. We must ignore it and use the proxy-appended right-most hop.
    expect(
      extractClientIp(
        h({ "x-forwarded-for": "1.2.3.4, 5.6.7.8, 198.51.100.9" }),
      ),
    ).toBe("198.51.100.9");
  });

  it("cf-connecting-ip wins over x-forwarded-for (edge overwrites it)", () => {
    expect(
      extractClientIp(
        h({
          "cf-connecting-ip": "203.0.113.3",
          "x-forwarded-for": "1.2.3.4, 5.6.7.8",
        }),
      ),
    ).toBe("203.0.113.3");
  });

  it("x-real-ip wins over x-forwarded-for (edge overwrites it)", () => {
    expect(
      extractClientIp(
        h({
          "x-real-ip": "203.0.113.2",
          "x-forwarded-for": "1.2.3.4, 5.6.7.8",
        }),
      ),
    ).toBe("203.0.113.2");
  });

  it("prefers cf-connecting-ip over x-real-ip when both present", () => {
    expect(
      extractClientIp(
        h({ "cf-connecting-ip": "203.0.113.3", "x-real-ip": "203.0.113.2" }),
      ),
    ).toBe("203.0.113.3");
  });

  it("falls through to x-real-ip when cf-connecting-ip missing", () => {
    expect(extractClientIp(h({ "x-real-ip": "203.0.113.2" }))).toBe(
      "203.0.113.2",
    );
  });

  it("falls through to cf-connecting-ip when others missing", () => {
    expect(extractClientIp(h({ "cf-connecting-ip": "203.0.113.3" }))).toBe(
      "203.0.113.3",
    );
  });

  it("ignores empty x-forwarded-for, falls through to x-real-ip", () => {
    expect(
      extractClientIp(h({ "x-forwarded-for": "", "x-real-ip": "203.0.113.4" })),
    ).toBe("203.0.113.4");
  });

  it("ignores whitespace-only x-real-ip, falls through to cf-connecting-ip", () => {
    expect(
      extractClientIp(
        h({ "x-real-ip": "   ", "cf-connecting-ip": "203.0.113.5" }),
      ),
    ).toBe("203.0.113.5");
  });

  it("trims the right-most xff hop", () => {
    expect(
      extractClientIp(h({ "x-forwarded-for": "10.0.0.1 ,  203.0.113.6  " })),
    ).toBe("203.0.113.6");
  });

  it("single-entry x-forwarded-for returns that entry", () => {
    expect(extractClientIp(h({ "x-forwarded-for": "203.0.113.1" }))).toBe(
      "203.0.113.1",
    );
  });

  it("returns IPv6 untouched", () => {
    expect(extractClientIp(h({ "x-forwarded-for": "2001:db8::1" }))).toBe(
      "2001:db8::1",
    );
  });

  it("skips an implausible right-most hop and uses the next valid hop", () => {
    // Trailing junk / empty segment must not become the bucket key.
    expect(
      extractClientIp(h({ "x-forwarded-for": "203.0.113.1, not-an-ip" })),
    ).toBe("203.0.113.1");
  });

  it("skips trailing empty segments and uses the last valid IP", () => {
    expect(
      extractClientIp(h({ "x-forwarded-for": "203.0.113.1, , " })),
    ).toBe("203.0.113.1");
  });

  it("falls through to 'unknown' when xff holds no plausible IP", () => {
    expect(extractClientIp(h({ "x-forwarded-for": "garbage, , junk" }))).toBe(
      "unknown",
    );
  });

  it("rejects out-of-range IPv4 octets as implausible", () => {
    // 999.999.999.999 is forged junk; with no other header, fall to unknown.
    expect(
      extractClientIp(h({ "x-forwarded-for": "999.999.999.999" })),
    ).toBe("unknown");
  });
});

describe("sha256Hex", () => {
  it("produces deterministic 64-char hex output", async () => {
    const result = await sha256Hex("203.0.113.1");
    expect(result).toMatch(/^[0-9a-f]{64}$/);
    const second = await sha256Hex("203.0.113.1");
    expect(result).toBe(second);
  });

  it("differs between distinct inputs", async () => {
    const a = await sha256Hex("203.0.113.1");
    const b = await sha256Hex("203.0.113.2");
    expect(a).not.toBe(b);
  });

  it("matches known SHA-256 digest", async () => {
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("handles empty string", async () => {
    expect(await sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });
});
