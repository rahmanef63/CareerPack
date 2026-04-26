import type { MetadataRoute } from "next";

const SITE_URL = "https://careerpack.org";

/**
 * /robots.txt — allow public marketing + opted-in profiles, block
 * the auth-gated app surface so Google doesn't waste crawl budget
 * on login walls. Reset-password tokens explicitly disallowed
 * (they're single-use secrets that shouldn't appear in any index).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/admin/",
          "/api/",
          "/reset-password/",
          "/_next/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
