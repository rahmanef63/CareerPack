import type { MetadataRoute } from "next";

const SITE_URL = "https://careerpack.org";

/**
 * /robots.txt — allow public marketing + opted-in profiles, block
 * the auth-gated app surface so Google doesn't waste crawl budget
 * on login walls. Reset-password tokens explicitly disallowed
 * (they're single-use secrets that shouldn't appear in any index).
 *
 * Two things that were wrong until 2026-07-30:
 *
 * - `/_next/` was disallowed. Every stylesheet and font on the site is served
 *   from there (44 `/_next/` URLs on the landing page alone), and Googlebot
 *   honours robots.txt for subresources — so it was rendering careerpack.org
 *   unstyled for indexing, and `/_next/image` output was excluded from Google
 *   Images. Nothing under `/_next/` is private; it is the build output.
 * - The paths had trailing slashes. These entries are PREFIX matches, so
 *   `/dashboard/` never matched the live `/dashboard` catch-all itself, which
 *   was happily served as `index, follow`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/admin",
          "/api",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
