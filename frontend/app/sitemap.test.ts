import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFunctionName } from "convex/server";
import { api } from "../../convex/_generated/api";
import sitemap from "./sitemap";

/**
 * The sitemap talks to Convex, so the whole point of these tests is that they
 * do NOT need a live backend: `convex/browser` is mocked and each query is
 * answered from a per-test table keyed by its function name
 * ("documents/queries:listPublicCountryGuides"). Keying by name rather than
 * call order means the tests keep passing if the fetches are reordered, and
 * fail loudly if one is renamed.
 *
 * What is actually pinned here: the build must never fail because Convex is
 * unreachable, and the three sources must degrade INDEPENDENTLY — one broken
 * query must not delete the entries the others produced.
 */

const { responses } = vi.hoisted(() => ({
  responses: new Map<string, () => unknown>(),
}));

vi.mock("convex/browser", () => ({
  ConvexHttpClient: class {
    constructor(url: string) {
      if (!url.startsWith("http")) throw new Error("Invalid deployment address");
    }
    async query(ref: unknown) {
      const name = getFunctionName(ref as Parameters<typeof getFunctionName>[0]);
      const handler = responses.get(name);
      if (!handler) throw new Error(`unstubbed query: ${name}`);
      return handler();
    }
  },
}));

const PROFILES = getFunctionName(api.profile.queries.listIndexableSlugs);
const GUIDES = getFunctionName(api.documents.queries.listPublicCountryGuides);
const ROADMAPS = getFunctionName(api.roadmap.queries.listPublicRoadmaps);

const STATIC_URLS = [
  "https://careerpack.org/",
  "https://careerpack.org/dokumen",
  "https://careerpack.org/roadmap",
  "https://careerpack.org/privacy",
  "https://careerpack.org/terms",
];

/** Every source healthy, with the shapes the data contract promises. */
function stubHappyPath() {
  responses.set(PROFILES, () => ["rahman", "casa"]);
  responses.set(GUIDES, () => [
    { slug: "singapura", country: "SG", countryLabel: "Singapura" },
    { slug: "korea-selatan", country: "KR", countryLabel: "Korea Selatan" },
  ]);
  responses.set(ROADMAPS, () => [
    { slug: "data-analyst", title: "Data Analyst" },
    { slug: "ui-designer", title: "UI Designer" },
  ]);
}

const originalUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

beforeEach(() => {
  responses.clear();
  process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
});

afterEach(() => {
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_CONVEX_URL;
  else process.env.NEXT_PUBLIC_CONVEX_URL = originalUrl;
});

describe("sitemap", () => {
  it("lists the static routes plus every dynamic entry", async () => {
    stubHappyPath();
    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).toEqual([
      ...STATIC_URLS,
      "https://careerpack.org/dokumen/singapura",
      "https://careerpack.org/dokumen/korea-selatan",
      "https://careerpack.org/roadmap/data-analyst",
      "https://careerpack.org/roadmap/ui-designer",
      "https://careerpack.org/rahman",
      "https://careerpack.org/casa",
    ]);
  });

  it("ranks the content hubs above the legal pages and below the landing page", async () => {
    stubHappyPath();
    const byUrl = new Map((await sitemap()).map((e) => [e.url, e]));

    const priority = (url: string) => byUrl.get(url)?.priority ?? -1;
    expect(priority("https://careerpack.org/")).toBe(1);
    expect(priority("https://careerpack.org/dokumen")).toBeGreaterThan(
      priority("https://careerpack.org/privacy"),
    );
    expect(priority("https://careerpack.org/dokumen")).toBeLessThan(
      priority("https://careerpack.org/"),
    );
    expect(priority("https://careerpack.org/roadmap/data-analyst")).toBe(0.8);
  });

  it("never lists the noindex auth pages (regression: 2026-07-30)", async () => {
    stubHappyPath();
    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).not.toContain("https://careerpack.org/login");
    expect(urls).not.toContain("https://careerpack.org/forgot-password");
  });

  it("keeps the surviving sources when one query fails", async () => {
    stubHappyPath();
    responses.set(ROADMAPS, () => {
      throw new Error("backend on fire");
    });

    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).toContain("https://careerpack.org/dokumen/singapura");
    expect(urls).toContain("https://careerpack.org/rahman");
    // The hub index still ships — the page renders an empty state, it is not
    // gated on the query.
    expect(urls).toContain("https://careerpack.org/roadmap");
    expect(urls.some((u) => u.startsWith("https://careerpack.org/roadmap/"))).toBe(
      false,
    );
  });

  it("falls back to static routes when Convex is entirely unreachable", async () => {
    const boom = () => {
      throw new Error("ECONNREFUSED");
    };
    responses.set(PROFILES, boom);
    responses.set(GUIDES, boom);
    responses.set(ROADMAPS, boom);

    expect((await sitemap()).map((e) => e.url)).toEqual(STATIC_URLS);
  });

  it("falls back to static routes when the Convex URL is missing or malformed", async () => {
    stubHappyPath();
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    expect((await sitemap()).map((e) => e.url)).toEqual(STATIC_URLS);

    process.env.NEXT_PUBLIC_CONVEX_URL = "not-a-url";
    expect((await sitemap()).map((e) => e.url)).toEqual(STATIC_URLS);
  });

  it("drops rows that are not usable slugs, and de-duplicates", async () => {
    responses.set(PROFILES, () => ["rahman", "", null, "rahman"]);
    responses.set(GUIDES, () => [
      { slug: "jepang" },
      { slug: null },
      {},
      { slug: "jepang" },
    ]);
    // A query that answers with something other than an array must not crash
    // the build either.
    responses.set(ROADMAPS, () => ({ oops: true }));

    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).toEqual([
      ...STATIC_URLS,
      "https://careerpack.org/dokumen/jepang",
      "https://careerpack.org/rahman",
    ]);
  });
});
