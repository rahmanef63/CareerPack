import { describe, it, expect } from "vitest";
import { redactEmail, redactId } from "./redact";

describe("redactEmail", () => {
  it("keeps domain + first letter, masks the rest", () => {
    expect(redactEmail("alice@example.com")).toBe("a***@example.com");
    expect(redactEmail("bob@careerpack.app")).toBe("b***@careerpack.app");
  });

  it("returns redacted on falsy / non-string", () => {
    expect(redactEmail(null)).toBe("[redacted]");
    expect(redactEmail(undefined)).toBe("[redacted]");
    expect(redactEmail("")).toBe("[redacted]");
  });

  it("returns redacted on malformed (no @)", () => {
    expect(redactEmail("notanemail")).toBe("[redacted]");
  });

  it("returns redacted on missing user part", () => {
    expect(redactEmail("@example.com")).toBe("[redacted]");
  });
});

describe("redactId", () => {
  it("truncates to first 8 chars + ellipsis", () => {
    expect(redactId("kf2abcdef1234567890")).toBe("kf2abcde…");
  });

  it("redacts short ids (8 chars or fewer reveal too much)", () => {
    expect(redactId("short")).toBe("[redacted]");
    expect(redactId("12345678")).toBe("[redacted]");
  });

  it("returns redacted on falsy", () => {
    expect(redactId(null)).toBe("[redacted]");
    expect(redactId(undefined)).toBe("[redacted]");
    expect(redactId("")).toBe("[redacted]");
  });
});
