import { describe, expect, it } from "vitest";
import { SANDBOX_CUSTOM, SANDBOX_TEMPLATE } from "./sandbox";

/**
 * The public page renders a whole HTML document that a user — or an AI host
 * writing for them over MCP — supplied, unsanitised. The single thing making
 * that safe is the iframe sandbox, and it is one string that a well-meaning
 * "the preview needs same-origin to measure height" change could widen in a
 * second. These assertions are that string's guard rail.
 *
 * See convex/profile/publicHtml.ts for why there is no sanitiser.
 */
describe("public-page iframe sandbox", () => {
  it("never grants same-origin to either kind of document", () => {
    // With allow-same-origin the frame IS the app: document.cookie, the
    // Convex session in localStorage, and the parent DOM all become reachable
    // from markup a stranger wrote.
    expect(SANDBOX_TEMPLATE).not.toContain("allow-same-origin");
    expect(SANDBOX_CUSTOM).not.toContain("allow-same-origin");
  });

  it("never lets a document navigate the top frame", () => {
    // allow-top-navigation would let a published page redirect its visitor
    // off careerpack.org — the page is the phishing surface, not the target.
    expect(SANDBOX_TEMPLATE).not.toContain("allow-top-navigation");
    expect(SANDBOX_CUSTOM).not.toContain("allow-top-navigation");
  });

  it("withholds forms from user-authored documents", () => {
    expect(SANDBOX_CUSTOM).not.toContain("allow-forms");
  });

  it("keeps user-authored documents no wider than built-in templates", () => {
    const custom = new Set(SANDBOX_CUSTOM.split(" "));
    const template = new Set(SANDBOX_TEMPLATE.split(" "));
    expect([...custom].filter((flag) => !template.has(flag))).toEqual([]);
  });

  it("still allows the scripts and links a page needs", () => {
    // Templates hydrate themselves and report their height by script, and a
    // portfolio page whose links do not open is not a portfolio page.
    for (const sandbox of [SANDBOX_TEMPLATE, SANDBOX_CUSTOM]) {
      expect(sandbox).toContain("allow-scripts");
      expect(sandbox).toContain("allow-popups");
      expect(sandbox).toContain("allow-popups-to-escape-sandbox");
    }
  });
});
