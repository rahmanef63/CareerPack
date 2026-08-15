import { describe, it, expect } from "vitest";
import { sanitizeUrl } from "./helpers";

describe("sanitizeUrl", () => {
  it("rejects javascript: / data: / file: schemes", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
    expect(sanitizeUrl("data:text/html,x")).toBe("");
    expect(sanitizeUrl("file:///etc/passwd")).toBe("");
  });

  it("allows https and relative URLs", () => {
    expect(sanitizeUrl("https://example.com/")).toBe("https://example.com/");
    expect(sanitizeUrl("/dashboard")).toBe("/dashboard");
  });
});

describe("protocol-relative open-redirect regression (2026-06-15)", () => {
  // `//evil.com`, `/\evil.com`, and `//\evil.com` all start with `/` so the
  // old root-relative branch accepted them verbatim, but the browser resolves
  // them OFF-origin (an open-redirect / phishing vector). Only a single `/`
  // NOT followed by another `/` or a backslash is a true same-origin path.
  describe("sanitizeUrl rejects off-origin slash variants", () => {
    it("protocol-relative //evil.com", () => {
      expect(sanitizeUrl("//evil.com")).toBe("");
    });
    it("protocol-relative with path //evil.com/phish", () => {
      expect(sanitizeUrl("//evil.com/phish")).toBe("");
    });
    it("slash-backslash /\\evil.com", () => {
      expect(sanitizeUrl("/\\evil.com")).toBe("");
    });
    it("slash-slash-backslash //\\evil.com", () => {
      expect(sanitizeUrl("//\\evil.com")).toBe("");
    });
    it("three or more leading slashes ///evil.com", () => {
      expect(sanitizeUrl("///evil.com")).toBe("");
    });
  });

  describe("sanitizeUrl rejects interior-whitespace slash-pair variants", () => {
    // trimSafe keeps interior tab/newline/CR/space, and the browser collapses
    // interior whitespace out of a URL at parse time, so a slash + whitespace
    // + slash candidate resolves to a protocol-relative `//evil.com`. The
    // slash-pair guard tests a de-whitespaced copy to reject these too.
    it("slash + TAB + slash /<TAB>/evil.com", () => {
      expect(sanitizeUrl("/\t/evil.com")).toBe("");
    });
    it("slash + newline + slash /<LF>/evil.com", () => {
      expect(sanitizeUrl("/\n/evil.com")).toBe("");
    });
    it("slash + space + slash / /evil.com", () => {
      expect(sanitizeUrl("/ /evil.com")).toBe("");
    });
    it("slash + TAB + backslash /<TAB>\\evil.com", () => {
      expect(sanitizeUrl("/\t\\evil.com")).toBe("");
    });
  });

  describe("sanitizeUrl keeps legitimate same-origin + anchor + absolute", () => {
    it("root-relative /dashboard", () => {
      expect(sanitizeUrl("/dashboard")).toBe("/dashboard");
    });
    it("root-relative /r/foo", () => {
      expect(sanitizeUrl("/r/foo")).toBe("/r/foo");
    });
    it("#anchor", () => {
      expect(sanitizeUrl("#section")).toBe("#section");
    });
    it("absolute https:// unchanged", () => {
      expect(sanitizeUrl("https://example.com/")).toBe("https://example.com/");
    });
  });
});

describe("whitespace-split scheme bypass regression (2026-06-15)", () => {
  // trimSafe preserves tab/newline/CR for prose, and browsers strip those out
  // of a URL scheme at click time, so `java<TAB>script:` etc. used to defeat
  // the literal-token protocol checks and render a live javascript: URL.
  describe("sanitizeUrl rejects whitespace-split dangerous schemes", () => {
    it("tab-split javascript:", () => {
      expect(sanitizeUrl("java\tscript:alert(1)")).toBe("");
    });
    it("newline-split javascript:", () => {
      expect(sanitizeUrl("java\nscript:alert(1)")).toBe("");
    });
    it("carriage-return-split javascript:", () => {
      expect(sanitizeUrl("java\rscript:alert(1)")).toBe("");
    });
    it("tab-split vbscript:", () => {
      expect(sanitizeUrl("vb\tscript:msgbox(1)")).toBe("");
    });
    it("mixed-case tab-split javascript:", () => {
      expect(sanitizeUrl("Jav\tAsCriPt:alert(1)")).toBe("");
    });
    it("space-before-colon javascript :", () => {
      expect(sanitizeUrl("javascript :alert(1)")).toBe("");
    });
    it("still allows a clean https URL", () => {
      expect(sanitizeUrl("https://example.com/")).toBe("https://example.com/");
    });
    it("still allows a relative / href", () => {
      expect(sanitizeUrl("/dashboard")).toBe("/dashboard");
    });
    it("does not mangle a legit port colon", () => {
      expect(sanitizeUrl("https://example.com:8080/p")).toBe(
        "https://example.com:8080/p",
      );
    });
  });
});
