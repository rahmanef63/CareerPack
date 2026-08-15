import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { HYDRATOR_FILL_HELPERS } from "./templateHydrator/fillHelpers";
import { HYDRATOR_IDENTITY_FILLS } from "./templateHydrator/identityFills";
import { HYDRATOR_PAGE_EXTRAS } from "./templateHydrator/pageExtras";

/**
 * The marker contract between the hydrator and the built-in templates is a set
 * of attribute strings matched at runtime inside a sandboxed iframe. Nothing
 * typechecks it: rename a key on either side and the page loses a section
 * silently, on a stranger's screen, with no error anywhere.
 *
 * This is the cheapest check that fails when they drift — it reads the keys
 * the hydrator actually fills straight out of the hydrator source and asserts
 * `starter.html` renders every one of them. starter.html is the template we
 * hand to AI hosts as the reference example (convex/mcp/tools/branding.ts), so
 * a key missing HERE propagates into every AI-authored page.
 *
 * It deliberately does not execute the hydrator: that needs a DOM, and adding
 * jsdom to run one assertion is a worse trade than checking the strings.
 */

const html = readFileSync(
  fileURLToPath(
    new URL(
      "../../../public/personal-branding/templates/starter.html",
      import.meta.url,
    ),
  ),
  "utf8",
)
  // The template documents the marker contract in an HTML comment, so every
  // marker name appears twice in the raw file — once as prose, once for real.
  .replace(/<!--[\s\S]*?-->/g, "");

/** Every `fill(scope, 'key', …)` the hydrator performs. */
function hydratorKeys(): string[] {
  const source = [
    HYDRATOR_FILL_HELPERS,
    HYDRATOR_IDENTITY_FILLS,
    HYDRATOR_PAGE_EXTRAS,
  ].join("\n");
  const keys = new Set<string>();
  for (const m of source.matchAll(/\bfill\(\s*\w+\s*,\s*'([a-z-]+)'/g)) {
    keys.add(m[1]);
  }
  return [...keys].sort();
}

function attrValues(attr: string): string[] {
  return [
    ...html.matchAll(new RegExp(`${attr}="([a-z-]+)"`, "g")),
  ].map((m) => m[1]);
}

/** The `has` map keys buildBrandingPayload emits (convex/profile/brandingPayload.ts). */
const HAS_KEYS = [
  "about",
  "skills",
  "experience",
  "education",
  "certifications",
  "languages",
  "projects",
  "contact",
];

describe("starter.html honours the hydrator contract", () => {
  it("renders every key the hydrator fills", () => {
    const present = new Set(attrValues("data-cp"));
    const missing = hydratorKeys().filter((k) => !present.has(k));
    expect(missing, `data-cp keys the hydrator fills but the template drops`).toEqual([]);
  });

  it("gives every list exactly one clone source", () => {
    // renderList() deletes every child of a [data-cp-list] that is not the
    // [data-cp-template], so a list with none renders nothing and a list with
    // two loses one.
    const lists = attrValues("data-cp-list");
    const templates = html.match(/data-cp-template(?![-\w])/g) ?? [];
    expect(lists.length).toBeGreaterThan(0);
    expect(templates.length).toBe(lists.length);
  });

  it("only marks sections the payload has a `has` flag for", () => {
    const sections = attrValues("data-cp-section");
    expect(sections.length).toBeGreaterThan(0);
    expect(sections.filter((s) => !HAS_KEYS.includes(s))).toEqual([]);
  });

  it("requests nothing over the network", () => {
    // The page inherits the app's CSP inside the iframe, and a template that
    // needs a CDN renders unstyled for everyone. Mock content may LINK out
    // (href), it may not LOAD anything.
    expect(html).not.toMatch(/<script[^>]+\ssrc=/i);
    expect(html).not.toMatch(/<link[^>]+stylesheet/i);
    expect(html).not.toMatch(/<img[^>]+src="https?:/i);
    expect(html).not.toMatch(/@import/i);
  });

  it("carries no form or inline event handler", () => {
    expect(html).not.toMatch(/<form[\s>]/i);
    expect(html).not.toMatch(/\son[a-z]+\s*=\s*["']/i);
  });
});
