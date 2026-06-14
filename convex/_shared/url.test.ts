import { describe, it, expect } from "vitest";
import { sanitizeActionUrl } from "./url";

describe("sanitizeActionUrl — allowlist basics", () => {
  it("rejects javascript: / data: / file: / vbscript: schemes", () => {
    expect(sanitizeActionUrl("javascript:alert(1)")).toBe("");
    expect(sanitizeActionUrl("data:text/html,x")).toBe("");
    expect(sanitizeActionUrl("file:///etc/passwd")).toBe("");
    expect(sanitizeActionUrl("vbscript:msgbox(1)")).toBe("");
  });

  it("rejects empty / non-string input", () => {
    expect(sanitizeActionUrl("")).toBe("");
    expect(sanitizeActionUrl("   ")).toBe("");
    expect(sanitizeActionUrl(undefined)).toBe("");
    expect(sanitizeActionUrl(null)).toBe("");
    expect(sanitizeActionUrl(42)).toBe("");
  });

  it("keeps legitimate https / root-relative / anchor values unchanged", () => {
    expect(sanitizeActionUrl("https://example.com/")).toBe(
      "https://example.com/",
    );
    expect(sanitizeActionUrl("/dashboard")).toBe("/dashboard");
    expect(sanitizeActionUrl("/r/foo")).toBe("/r/foo");
    expect(sanitizeActionUrl("#section")).toBe("#section");
    expect(sanitizeActionUrl("https://example.com:8080/p")).toBe(
      "https://example.com:8080/p",
    );
  });
});

describe("sanitizeActionUrl — protocol-relative open-redirect regression", () => {
  // `//evil.com`, `/\evil.com`, `//\evil.com`, `///evil.com` all start with
  // `/` so a char[1]-only guard accepted them, but the browser resolves them
  // OFF-origin (open-redirect / phishing via a notification actionUrl Link).
  it("rejects protocol-relative //evil.com", () => {
    expect(sanitizeActionUrl("//evil.com")).toBe("");
  });
  it("rejects protocol-relative with path //evil.com/phish", () => {
    expect(sanitizeActionUrl("//evil.com/phish")).toBe("");
  });
  it("rejects slash-backslash /\\evil.com", () => {
    expect(sanitizeActionUrl("/\\evil.com")).toBe("");
  });
  it("rejects slash-slash-backslash //\\evil.com", () => {
    expect(sanitizeActionUrl("//\\evil.com")).toBe("");
  });
  it("rejects three or more leading slashes ///evil.com", () => {
    expect(sanitizeActionUrl("///evil.com")).toBe("");
  });
});

describe("sanitizeActionUrl — interior-whitespace open-redirect regression (2026-06-15)", () => {
  // trimSafe keeps interior tab/newline/CR/space for prose, and the browser
  // collapses interior whitespace out of a URL at parse time — so a
  // slash + <whitespace> + slash candidate resolves to a protocol-relative
  // `//evil.com`. The slash-pair guard must therefore test a de-whitespaced
  // copy, otherwise these slip through to a Link href.
  it("rejects slash + TAB + slash (/<TAB>/evil.com)", () => {
    expect(sanitizeActionUrl("/\t/evil.com")).toBe("");
  });
  it("rejects slash + newline + slash (/<LF>/evil.com)", () => {
    expect(sanitizeActionUrl("/\n/evil.com")).toBe("");
  });
  it("rejects slash + CR + slash (/<CR>/evil.com)", () => {
    expect(sanitizeActionUrl("/\r/evil.com")).toBe("");
  });
  it("rejects slash + space + slash (/ /evil.com)", () => {
    expect(sanitizeActionUrl("/ /evil.com")).toBe("");
  });
  it("rejects slash + TAB + backslash (/<TAB>\\evil.com)", () => {
    expect(sanitizeActionUrl("/\t\\evil.com")).toBe("");
  });
  it("rejects slash + multiple whitespace + slash", () => {
    expect(sanitizeActionUrl("/ \t \n /evil.com")).toBe("");
  });
});

describe("sanitizeActionUrl — whitespace-split dangerous scheme regression", () => {
  it("rejects tab-split javascript:", () => {
    expect(sanitizeActionUrl("java\tscript:alert(1)")).toBe("");
  });
  it("rejects newline-split javascript:", () => {
    expect(sanitizeActionUrl("java\nscript:alert(1)")).toBe("");
  });
  it("rejects carriage-return-split javascript:", () => {
    expect(sanitizeActionUrl("java\rscript:alert(1)")).toBe("");
  });
  it("rejects tab-split vbscript:", () => {
    expect(sanitizeActionUrl("vb\tscript:msgbox(1)")).toBe("");
  });
  it("rejects mixed-case tab-split javascript:", () => {
    expect(sanitizeActionUrl("Jav\tAsCriPt:alert(1)")).toBe("");
  });
  it("rejects space-before-colon javascript :", () => {
    expect(sanitizeActionUrl("javascript :alert(1)")).toBe("");
  });
});

describe("sanitizeActionUrl — does not over-strip legitimate values", () => {
  it("does not mangle a legit port colon", () => {
    expect(sanitizeActionUrl("https://example.com:8080/p")).toBe(
      "https://example.com:8080/p",
    );
  });
  it("keeps a single-slash path with interior whitespace preserved verbatim", () => {
    // A genuine same-origin path is a single leading `/` NOT followed by
    // slash/backslash; trimSafe keeps interior whitespace so the returned
    // value is unchanged (the guard only de-whitespaces a throwaway copy).
    expect(sanitizeActionUrl("/foo bar")).toBe("/foo bar");
  });
  it("enforces the max length bound", () => {
    const long = "/" + "a".repeat(20);
    expect(sanitizeActionUrl(long, 5)).toBe("/aaaa");
  });
});
