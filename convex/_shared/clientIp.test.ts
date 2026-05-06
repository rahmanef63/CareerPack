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

  it("prefers x-forwarded-for first hop", () => {
    expect(
      extractClientIp(h({ "x-forwarded-for": "203.0.113.1, 10.0.0.1" })),
    ).toBe("203.0.113.1");
  });

  it("falls through to x-real-ip when xff missing", () => {
    expect(extractClientIp(h({ "x-real-ip": "203.0.113.2" }))).toBe(
      "203.0.113.2",
    );
  });

  it("falls through to cf-connecting-ip when others missing", () => {
    expect(extractClientIp(h({ "cf-connecting-ip": "203.0.113.3" }))).toBe(
      "203.0.113.3",
    );
  });

  it("ignores empty x-forwarded-for", () => {
    expect(
      extractClientIp(h({ "x-forwarded-for": "", "x-real-ip": "203.0.113.4" })),
    ).toBe("203.0.113.4");
  });

  it("ignores whitespace-only x-real-ip", () => {
    expect(
      extractClientIp(h({ "x-real-ip": "   ", "cf-connecting-ip": "203.0.113.5" })),
    ).toBe("203.0.113.5");
  });

  it("trims xff first hop", () => {
    expect(
      extractClientIp(h({ "x-forwarded-for": "  203.0.113.6  , 10.0.0.1" })),
    ).toBe("203.0.113.6");
  });

  it("returns IPv6 untouched", () => {
    expect(
      extractClientIp(h({ "x-forwarded-for": "2001:db8::1" })),
    ).toBe("2001:db8::1");
  });

  it("ignores empty xff segment + empty real-ip + falls through", () => {
    expect(
      extractClientIp(
        h({
          "x-forwarded-for": ", , 10.0.0.1",
          "cf-connecting-ip": "203.0.113.7",
        }),
      ),
    ).toBe("203.0.113.7");
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
