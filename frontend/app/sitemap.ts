import type { MetadataRoute } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

/**
 * Sitemap.xml emitted at /sitemap.xml.
 *
 * Static routes — landing, login, forgot-password — are always
 * included. Dashboard + admin are auth-gated and not in the sitemap
 * (no public crawl path).
 *
 * Dynamic public profile routes (/[slug]) are pulled from Convex at
 * build time. We only list profiles that have explicitly opted in to
 * indexing (`publicEnabled && publicAllowIndex`). This keeps the
 * sitemap honest: a user who set their profile to private won't have
 * Google try to crawl their slug page only to hit `<meta noindex>`.
 *
 * Falls back to static-only when Convex is unreachable so deploy
 * never blocks on backend availability.
 */
const SITE_URL = "https://careerpack.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/forgot-password`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
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

  // Best-effort dynamic profile fetch. Skip silently on any failure.
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return staticRoutes;
  try {
    const client = new ConvexHttpClient(convexUrl);
    const slugs = await client.query(api.profile.queries.listIndexableSlugs, {});
    if (!Array.isArray(slugs)) return staticRoutes;
    const profileRoutes: MetadataRoute.Sitemap = slugs.map((slug: string) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
    return [...staticRoutes, ...profileRoutes];
  } catch {
    return staticRoutes;
  }
}
