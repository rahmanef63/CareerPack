// Shared public-profile slug validation — the SSOT for both the
// read path (queries.ts `isSlugAvailable` / `getBySlug`) and the write
// path (mutations.ts `updateMyPublicProfile`) so the rules and error
// messages never drift between them.

// Internal to assertSlug — not exported (only assertSlug is consumed). If the
// frontend later shares these, export then rather than pre-widening the surface.
const SLUG_MIN = 3;
const SLUG_MAX = 30;
const SLUG_REGEX = /^[a-z][a-z0-9-]+[a-z0-9]$/;

const RESERVED_SLUGS = new Set<string>([
  "_next",
  "api",
  "r",
  "static",
  "assets",
  "public",
  "icon",
  "apple-icon",
  "apple-touch-icon",
  "favicon",
  "manifest",
  "robots",
  "sitemap",
  "well-known",
  "login",
  "logout",
  "signin",
  "signup",
  "register",
  "forgot-password",
  "reset-password",
  "verify",
  "auth",
  "dashboard",
  "admin",
  "settings",
  "help",
  "profile",
  "account",
  "terms",
  "privacy",
  "cookies",
  "legal",
  "about",
  "contact",
  "pricing",
  "home",
  "docs",
  "blog",
  "faq",
  "support",
  "careers",
  "press",
  "root",
  "null",
  "undefined",
  "error",
  "404",
  "500",
  "status",
  "careerpack",
  "anthropic",
  "claude",
  // Public content hubs added 2026-08-12. Next.js gives a STATIC segment
  // priority over the dynamic `app/[slug]`, so a profile on any of these
  // slugs would render the hub instead — a silently unreachable profile.
  // Reserve before the routes ship, not after someone claims one.
  "dokumen",
  "roadmap",
  // AI-crawler manifest served at the root. "llms.txt" can never pass
  // SLUG_REGEX (the dot is rejected) — listed anyway so the blocklist reads
  // as the full set of root paths we own, not a set minus what the regex
  // happens to catch today.
  "llms",
  "llms.txt",
]);

function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

export function assertSlug(raw: string): string {
  const slug = normalizeSlug(raw);
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX) {
    throw new Error(`Slug harus ${SLUG_MIN}-${SLUG_MAX} karakter`);
  }
  if (!SLUG_REGEX.test(slug)) {
    throw new Error(
      "Slug hanya boleh huruf kecil, angka, dan tanda '-'. Harus diawali huruf, diakhiri huruf/angka.",
    );
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw new Error("Slug ini dipakai sistem, pilih yang lain");
  }
  if (slug.includes("--")) {
    throw new Error("Slug tidak boleh mengandung '--' berurutan");
  }
  return slug;
}
