import { describe, it, expect } from "vitest";
import { sanitizeHtml, sanitizeUrl } from "./helpers";

describe("sanitizeHtml — XSS bypass regression (2026-06-11)", () => {
  it("strips a `/`-separated event handler that the on*= stripper missed", () => {
    const out = sanitizeHtml(
      '<a href="https://x"/onmouseover="alert(document.cookie)">hover</a>',
    );
    expect(out.toLowerCase()).not.toContain("onmouseover");
    expect(out).toContain("hover");
  });

  it("strips a quote-adjacent event handler (no whitespace before `on`)", () => {
    const out = sanitizeHtml('<a href="https://x"onclick="evil()">y</a>');
    expect(out.toLowerCase()).not.toContain("onclick");
  });

  it("strips a normal whitespace-separated handler", () => {
    const out = sanitizeHtml('<span onmouseenter="evil()">z</span>');
    expect(out.toLowerCase()).not.toContain("onmouseenter");
    expect(out).toContain("z");
  });

  it("neutralises a quoted javascript: href to #", () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
    expect(out.toLowerCase()).not.toContain("javascript:");
    expect(out).toContain('href="#"');
  });

  it("neutralises an UNQUOTED javascript: href (step 3's quoted-only regex misses it)", () => {
    const out = sanitizeHtml("<a href=javascript:alert(1)>x</a>");
    expect(out.toLowerCase()).not.toContain("javascript:");
  });

  it("drops style attributes (CSS-based vectors)", () => {
    const out = sanitizeHtml('<span style="background:url(x)">s</span>');
    expect(out.toLowerCase()).not.toContain("style");
    expect(out).toContain("s");
  });

  it("removes <script> and its contents entirely", () => {
    const out = sanitizeHtml("<p>ok</p><script>alert(1)</script>");
    expect(out.toLowerCase()).not.toContain("script");
    expect(out).toContain("ok");
  });

  it("drops disallowed tags but keeps text (e.g. <img onerror>)", () => {
    const out = sanitizeHtml('<img src=x onerror="alert(1)">caption');
    expect(out.toLowerCase()).not.toContain("onerror");
    expect(out.toLowerCase()).not.toContain("<img");
    expect(out).toContain("caption");
  });

  it("preserves allowlisted formatting tags and safe links", () => {
    const out = sanitizeHtml('<strong>bold</strong> <a href="https://ok.com">link</a>');
    expect(out).toContain("<strong>bold</strong>");
    expect(out).toContain('href="https://ok.com"');
    // external links get hardened with target + rel
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it("keeps a relative href untouched", () => {
    const out = sanitizeHtml('<a href="/cv">cv</a>');
    expect(out).toContain('href="/cv"');
  });
});

describe("sanitizeHtml — `>` inside quoted attribute bypass regression (2026-06-15)", () => {
  // A `>` inside an allowlisted quoted attribute value used to terminate every
  // tag-boundary regex early (naive [^>]), leaving a trailing on*= handler
  // verbatim. Cover a `>` inside EACH allowlisted attribute, with both a
  // whitespace-separated and a quote-fused handler (the fused variant is the
  // one the on*= stripper missed).
  for (const attr of ["title", "class", "rel", "target", "lang", "dir"]) {
    it(`strips an onmouseover fused to a quoted '>' in ${attr}=`, () => {
      const out = sanitizeHtml(
        `<a ${attr}="x>"onmouseover="alert(document.cookie)">hover</a>`,
      );
      expect(out.toLowerCase()).not.toContain("onmouseover");
      expect(out.toLowerCase()).not.toContain("alert");
      expect(out).toContain("hover");
    });

    it(`strips an onmouseover after a whitespace-separated quoted '>' in ${attr}=`, () => {
      const out = sanitizeHtml(
        `<a ${attr}="x>" onmouseover="alert(1)">hover</a>`,
      );
      expect(out.toLowerCase()).not.toContain("onmouseover");
      expect(out).toContain("hover");
    });
  }

  it("strips an on-handler when the quoted attribute value contains two '>' chars", () => {
    const out = sanitizeHtml(
      '<a title="x>>"onmouseover="alert(1)">hover</a>',
    );
    expect(out.toLowerCase()).not.toContain("onmouseover");
    expect(out).toContain("hover");
  });

  it("handles single-quoted attribute values containing '>' too", () => {
    const out = sanitizeHtml(
      "<a title='x>'onmouseover='alert(1)'>hover</a>",
    );
    expect(out.toLowerCase()).not.toContain("onmouseover");
    expect(out).toContain("hover");
  });

  it("still neutralises a javascript: href on a tag whose title hides a '>'", () => {
    const out = sanitizeHtml(
      '<a title="x>" href="javascript:alert(1)">go</a>',
    );
    expect(out.toLowerCase()).not.toContain("javascript:");
    expect(out).toContain("go");
  });

  it("strips a disallowed-tag on-handler smuggled behind a quoted '>'", () => {
    const out = sanitizeHtml(
      '<span title="x>"onmouseover="alert(1)">caption</span>',
    );
    expect(out.toLowerCase()).not.toContain("onmouseover");
    expect(out).toContain("caption");
  });
});

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

  describe("sanitizeHtml href with a whitespace-split scheme becomes #", () => {
    it("tab-split scheme in href", () => {
      const out = sanitizeHtml('<a href="java\tscript:alert(1)">x</a>');
      expect(out.toLowerCase()).not.toContain("script:");
      expect(out.toLowerCase()).not.toContain("alert");
      expect(out).toContain('href="#"');
      expect(out).toContain("x");
    });

    it("newline-split scheme in href", () => {
      const out = sanitizeHtml('<a href="java\nscript:alert(1)">x</a>');
      expect(out.toLowerCase()).not.toContain("script:");
      expect(out.toLowerCase()).not.toContain("alert");
      expect(out).toContain('href="#"');
    });

    it("carriage-return-split scheme in href", () => {
      const out = sanitizeHtml('<a href="java\rscript:alert(1)">x</a>');
      expect(out.toLowerCase()).not.toContain("script:");
      expect(out.toLowerCase()).not.toContain("alert");
      expect(out).toContain('href="#"');
    });

    it("tab-split vbscript in href", () => {
      const out = sanitizeHtml('<a href="vb\tscript:msgbox(1)">x</a>');
      expect(out.toLowerCase()).not.toContain("script:");
      expect(out).toContain('href="#"');
    });

    it("mixed-case split scheme combined with an on-handler", () => {
      const out = sanitizeHtml(
        '<a href="Jav\tAsCriPt:alert(1)" onmouseover="evil()">x</a>',
      );
      expect(out.toLowerCase()).not.toContain("script:");
      expect(out.toLowerCase()).not.toContain("onmouseover");
      expect(out.toLowerCase()).not.toContain("alert");
      expect(out).toContain('href="#"');
      expect(out).toContain("x");
    });

    it("leaves a clean https href unchanged", () => {
      const out = sanitizeHtml('<a href="https://ok.com">link</a>');
      expect(out).toContain('href="https://ok.com"');
      expect(out).toContain("link");
    });

    it("leaves a relative / href unchanged", () => {
      const out = sanitizeHtml('<a href="/cv">cv</a>');
      expect(out).toContain('href="/cv"');
    });
  });
});
