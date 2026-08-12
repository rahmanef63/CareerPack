import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./serializeJsonLd";

/**
 * The payload is inlined with `dangerouslySetInnerHTML`, and since
 * /roadmap/[slug] shipped it carries user-published roadmap titles and node
 * text. `publishMyRoadmap` applies no moderation and never touches angle
 * brackets, so an unescaped `</script>` in a title is stored XSS on a public,
 * crawlable page.
 */
describe("serializeJsonLd", () => {
  it("neutralises a </script> break-out in a string field", () => {
    const out = serializeJsonLd({
      "@type": "Course",
      name: '</script><script>alert(document.cookie)</script>',
    });
    expect(out).not.toContain("</script");
    expect(out).not.toContain("<script");
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
  });

  it("escapes the characters that matter and leaves the rest alone", () => {
    const out = serializeJsonLd({ a: "<", b: ">", c: "&" });
    expect(out).toContain("\\u003c");
    expect(out).toContain("\\u003e");
    expect(out).toContain("\\u0026");
  });

  it("escapes U+2028 / U+2029, which are legal JSON but end a line for older parsers", () => {
    const out = serializeJsonLd({ a: String.fromCharCode(0x2028, 0x2029) });
    expect(out).toContain("\\u2028");
    expect(out).toContain("\\u2029");
    expect(out).not.toContain(String.fromCharCode(0x2028));
    expect(out).not.toContain(String.fromCharCode(0x2029));
  });

  it("round-trips: a crawler still parses exactly what went in", () => {
    const input = {
      "@context": "https://schema.org",
      name: 'Roadmap </script> & "quoted" <b>bold</b>',
      nested: { list: ["a & b", "c < d"] },
    };
    // The escapes are JSON escapes, so JSON.parse restores the original —
    // the structured data is unchanged, only the transport is safe.
    expect(JSON.parse(serializeJsonLd(input))).toEqual(input);
  });

  it("handles an array of schemas", () => {
    const out = serializeJsonLd([{ a: "<" }, { b: ">" }]);
    expect(JSON.parse(out)).toEqual([{ a: "<" }, { b: ">" }]);
  });
});
