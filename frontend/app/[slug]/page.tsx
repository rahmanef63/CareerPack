import { ConvexHttpClient } from "convex/browser";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api } from "../../../convex/_generated/api";
import { PersonalBrandingPage } from "@/slices/personal-branding/themes";
import { ProfileSummary } from "./ProfileSummary";
import type { PersonalBrandingTheme as PBTheme } from "@/slices/personal-branding/blocks/types";

/**
 * Public personal-brand page — rendered at https://careerpack.org/<slug>.
 *
 * Security checkpoints (mirrors convex/publicProfile.ts §):
 * 1. Server Component only — no client bundle leaks field whitelist.
 * 2. `getBySlug` returns null for every kind of failure → we notFound()
 *    so attackers can't distinguish "slug exists but disabled" from
 *    "slug never existed".
 * 3. `<meta name="robots">` defaults to noindex, noarchive, nosnippet —
 *    only unlocked when the user explicitly sets `publicAllowIndex`.
 * 4. No raw HTML rendered. React auto-escapes text, no `dangerouslySet*`.
 * 5. ISR with revalidate=60s — absorbs enumeration scraping behind the
 *    CDN before it reaches Convex.
 * 6. Static routes (/login, /admin, /dashboard, etc.) take priority over
 *    this dynamic segment per Next.js router rules; reserved-slug list
 *    in publicProfile.ts prevents users from claiming those paths even
 *    if routing changed.
 */

export const revalidate = 60;
export const dynamic = "force-static";
export const dynamicParams = true;

/**
 * There must be NO `loading.tsx` in this route segment. It is not a style
 * preference; it decides the HTTP status code of every unknown slug.
 *
 * A `loading.tsx` makes Next wrap the segment in a Suspense boundary and flush
 * the fallback shell immediately. Flushing commits the status line — so by the
 * time `notFound()` throws further down, the response has already promised
 * **200 OK**. This route shipped with one, and the result was a soft 404 on
 * careerpack.org: every unknown path returned 200 with a "Profil tidak
 * ditemukan" body, 38 skeleton `shimmer` divs, and a
 * `<template data-dgst="NEXT_HTTP_ERROR_FALLBACK;404">` marker that only the
 * client understood. Crawlers do not run that client. Google treats a 200 as a
 * real page, indexes it, and only later decides it was not one — spending
 * crawl budget on every URL anyone ever guessed, and on a root catch-all that
 * is every URL there is.
 *
 * Removing it costs the skeleton on a cold render only: `revalidate = 60`
 * above means the second visitor within the window gets a cache hit either
 * way. If a skeleton is wanted back, it has to go INSIDE the page, below the
 * `notFound()` decision — a `<Suspense>` around the slow subtree, never a
 * segment-level `loading.tsx`.
 *
 * Verified against the standalone server (`next start` refuses to run a
 * standalone build, which is how this was mismeasured the first time):
 *
 *   /rahman             200  Cache-Control: s-maxage=60, stale-while-revalidate=…
 *   /slug-palsu-xyz123  404  x-nextjs-cache: HIT, 7ms, no Convex round trip
 *
 * That cache HIT is checkpoint 5 above doing its job: enumeration is absorbed
 * by the ISR layer instead of reaching Convex. It is not free — each distinct
 * slug probed leaves ~44 KB of `.html`/`.rsc`/`.meta` in the server cache, and
 * nothing bounds how many an attacker can mint. That is a pre-existing
 * property of `force-static` on a visitor-controlled segment, unchanged here.
 */

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

interface PageProps {
  params: Promise<{ slug: string }>;
}

type PublicProfile = NonNullable<
  Awaited<ReturnType<typeof fetchPublicProfile>>
>;

export interface PublicPortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  link: string;
  date: string;
  techStack: string[];
  featured: boolean;
  coverEmoji: string | null;
  coverGradient: string | null;
  coverUrl: string | null;
}

async function fetchPublicProfile(slug: string) {
  if (!CONVEX_URL) return null;
  const client = new ConvexHttpClient(CONVEX_URL);
  try {
    const result = await client.query(api.profile.queries.getBySlug, { slug });
    return result;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await fetchPublicProfile(slug);
  if (!profile) {
    return {
      title: "Profil tidak ditemukan",
      robots: { index: false, follow: false },
    };
  }

  const description =
    profile.headline ||
    (profile.targetRole ? `${profile.targetRole} — CareerPack` : "Personal brand CareerPack");

  return {
    // Root layout title.template = "%s · CareerPack" appends the suffix —
    // pass just the name so we don't render "Name · CareerPack · CareerPack".
    title: profile.displayName,
    description,
    // Relative — `metadataBase` (root layout) resolves it to
    // https://careerpack.org/<slug>. Built from `profile.slug`, the slug the
    // backend actually resolved, not the raw param, so a case/alias variant of
    // the URL still points at one canonical address.
    //
    // Deliberately NOT gated on `allowIndex`: a canonical is valid and useful
    // on a noindex page too (it consolidates ?utm_* copies), and the robots
    // block below is the only thing that decides indexability. Do not move
    // this inside a conditional.
    alternates: { canonical: `/${profile.slug}` },
    openGraph: {
      title: profile.displayName,
      description,
      type: "profile",
      url: `https://careerpack.org/${profile.slug}`,
    },
    twitter: {
      // Must be restated here, not inherited: Next replaces the parent
      // `twitter` object wholesale, so the root layout's summary_large_image
      // does not survive this block. With "summary" X crops to a centre square
      // starting around x=285, which cuts out both the avatar (x≈80) and most
      // of the name in the sibling opengraph-image — a 1200x630 card that is
      // laid out horizontally and was being thrown away by one string.
      card: "summary_large_image",
      title: profile.displayName,
      description,
    },
    robots: profile.allowIndex
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
  };
}

/**
 * Build a Schema.org Person record so Google / LinkedIn unfurl the
 * public page with rich snippets (name, jobTitle, sameAs links).
 * Only emit if the user opted into indexing — otherwise we'd be
 * leaking structured data Google will eagerly cache.
 */
function buildPersonJsonLd(profile: PublicProfile): string | null {
  if (!profile.allowIndex) return null;
  const sameAs = [profile.linkedinUrl, profile.portfolioUrl].filter(Boolean);
  const skills = profile.skills.length > 0 ? profile.skills : undefined;
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.displayName,
    url: `https://careerpack.org/${profile.slug}`,
  };
  if (profile.headline) ld.description = profile.headline;
  if (profile.targetRole) ld.jobTitle = profile.targetRole;
  if (profile.avatarUrl) ld.image = profile.avatarUrl;
  if (profile.contactEmail) ld.email = profile.contactEmail;
  if (sameAs.length > 0) ld.sameAs = sameAs;
  if (skills) ld.knowsAbout = skills;
  // Avoid `</script>` collisions when stringified.
  return JSON.stringify(ld).replace(/</g, "\\u003c");
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await fetchPublicProfile(slug);
  if (!profile) notFound();
  const personJsonLd = buildPersonJsonLd(profile);
  const jsonLdScript = personJsonLd && (
    <script
      type="application/ld+json"
      // Server-rendered, sanitised by buildPersonJsonLd. Safe.
      dangerouslySetInnerHTML={{ __html: personJsonLd }}
    />
  );
  // One renderer. There used to be a second, 340-line "legacy" page below
  // this — avatar + bio + skills + a portfolio grid — reachable only for a
  // profile in custom mode with zero blocks. With the block builder gone that
  // condition can no longer occur, and the template renderer covers the same
  // ground with the user's chosen design.
  //
  // `PersonalBrandingPage` renders the user's own HTML when they have it, and
  // their template otherwise. `ProfileSummary` below it is server-rendered
  // text and the ONLY indexable content on this route — everything the
  // template shows lives in an opaque-origin iframe that no crawler reads.
  return (
    <>
      {jsonLdScript}
      <PersonalBrandingPage
        profile={{
          slug: profile.slug,
          displayName: profile.displayName,
          theme: (profile.theme ?? "template-v2") as PBTheme,
          accent: profile.accent ?? null,
          html: profile.html,
          branding: profile.branding,
        }}
        enableFloatingNav
      />
      <ProfileSummary profile={profile} />
    </>
  );
}
