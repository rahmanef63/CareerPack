import type { MetadataRoute } from "next";
import { api } from "../../convex/_generated/api";
import { publicContentList } from "@/shared/lib/publicContentQuery";

/**
 * Sitemap.xml emitted at /sitemap.xml.
 *
 * Static routes are the ones that are actually indexable: landing, privacy,
 * terms, plus the two public content hubs (/dokumen, /roadmap). Dashboard +
 * admin are auth-gated and not in the sitemap (no public crawl path).
 *
 * /login and /forgot-password were listed until 2026-07-30 and should not have
 * been — both serve `noindex, nofollow`, so submitting them asked Google to
 * crawl pages that tell it to go away. A sitemap that contradicts the page's
 * own robots meta is a crawl-budget leak, not a ranking signal.
 *
 * Three independent dynamic sources are pulled from Convex at build time:
 *
 *   1. public profiles  (/[slug])          — profile.queries.listIndexableSlugs
 *   2. country guides   (/dokumen/<slug>)  — documents.queries.listPublicCountryGuides
 *   3. roadmaps         (/roadmap/<slug>)  — roadmap.queries.listPublicRoadmaps
 *
 * For profiles we only list the ones that explicitly opted in to indexing
 * (`publicEnabled && publicAllowIndex`). This keeps the sitemap honest: a user
 * who set their profile to private won't have Google try to crawl their slug
 * page only to hit `<meta noindex>`.
 *
 * Each source gets its own bounded, never-throwing read rather than one shared
 * try/catch around the lot. With a single wrapper, one failing query silently
 * deleted the entries the other two had already produced — a transient error on
 * the roadmap table would have dropped every country guide out of the sitemap
 * for a whole deploy cycle. Degradation is now per-source, and a total Convex
 * outage still yields a valid static sitemap: the hub index pages are listed
 * unconditionally because they render (with an empty state) regardless.
 * The build must never fail because Convex is unreachable — Dokploy builds
 * straight off a push. A try/catch alone did not deliver that: it cannot fire
 * on a request that never returns, so the read is time-boxed too.
 */
const SITE_URL = "https://careerpack.org";

/** Every dynamic source returns rows keyed by a URL-safe `slug`. */
type SlugRow = { slug?: unknown };

/** Turn rows into sitemap entries under `prefix`, dropping anything slugless. */
function toEntries(
  rows: unknown[],
  prefix: string,
  lastModified: Date,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];
  for (const row of rows) {
    const slug =
      typeof row === "string" ? row : ((row as SlugRow)?.slug ?? undefined);
    if (typeof slug !== "string" || slug.length === 0) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);
    entries.push({
      url: `${SITE_URL}${prefix}${slug}`,
      lastModified,
      changeFrequency,
      priority,
    });
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    // Content hubs: below the landing page, well above the legal pages.
    // These are the pages we actually want ranking for informational queries.
    {
      url: `${SITE_URL}/dokumen`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/roadmap`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Best-effort dynamic fetch. `publicContentList` handles the missing env
  // var, the malformed URL, the query error AND the case a bare try/catch
  // cannot: a backend that accepts the request and never answers. Without a
  // deadline the sitemap render simply parks until Next kills the page.
  const [profileRows, guideRows, roadmapRows] = await Promise.all([
    publicContentList((client) =>
      client.query(api.profile.queries.listIndexableSlugs, {}),
    ),
    publicContentList((client) =>
      client.query(api.documents.queries.listPublicCountryGuides, {}),
    ),
    publicContentList((client) =>
      client.query(api.roadmap.queries.listPublicRoadmaps, {}),
    ),
  ]);

  return [
    ...staticRoutes,
    // Curated evergreen content ranks above user profiles.
    ...toEntries(guideRows, "/dokumen/", now, "monthly", 0.8),
    ...toEntries(roadmapRows, "/roadmap/", now, "monthly", 0.8),
    ...toEntries(profileRows, "/", now, "monthly", 0.7),
  ];
}
