import type { Metadata } from "next";

import { JsonLd } from "@/shared/components/seo/JsonLd";
import {
  AudienceSection,
  ContentHubsSection,
  FAQ_ITEMS,
  FaqSection,
  HowItWorksSection,
  ShowcaseSection,
  ToolkitSection,
  type HubLink,
} from "@/slices/hero";
import { api } from "../../../convex/_generated/api";
import { publicContentList } from "@/shared/lib/publicContentQuery";
import { MarketingLanding } from "./_components/MarketingLanding";

const SITE_URL = "https://careerpack.org";

/**
 * Canonical only. Title and description stay inherited from the root layout on
 * purpose — overriding them here would fork the site's one description string
 * into two places. Relative path is resolved against `metadataBase` (root
 * layout), same as /privacy and /terms.
 *
 * Without this the landing had no <link rel="canonical"> at all, so
 * `/?utm_source=…`, `/?fbclid=…` and the bare `/` were three URLs to Google.
 * Do NOT "fix" that by adding a canonical to the root layout instead: a layout
 * canonical cascades to every child route that does not set its own, which
 * would tell Google that /dokumen/singapura is really the homepage.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * The two hub link lists below are the only dynamic data on this page, and they
 * change only when an admin reseeds the catalog. ISR keeps the homepage's
 * internal links in sync with /dokumen and /roadmap without making the
 * most-hit route in the app render per request. Same interval as those two
 * routes on purpose — the three read the same catalog and should not disagree
 * about it for an hour at a time.
 */
export const revalidate = 3600;

const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CareerPack",
  url: SITE_URL,
  logo: `${SITE_URL}/icons/icon-512.png`,
  description:
    "CV ATS-friendly, roadmap karir, ceklis dokumen, asisten AI — satu paket untuk karir Anda.",
  sameAs: [],
  inLanguage: "id-ID",
};

const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CareerPack",
  url: SITE_URL,
  inLanguage: "id-ID",
  // No `potentialAction`/SearchAction: it declared a sitelinks searchbox at
  // `/?q={search_term_string}`, but nothing in the app reads a `q` param — the
  // landing page does not even accept `searchParams`. Google following the
  // declared target lands on the plain homepage, which is a broken promise made
  // in structured data. Re-add it when a real search route exists.
};

/**
 * `offers` at price 0 is a fact, not a marketing number: there is no billing
 * code, no plan table and no payment provider anywhere in this repo.
 *
 * There is deliberately NO `aggregateRating` and no `review`. We have collected
 * zero reviews, so any rating here would be fabricated — which is both a lie to
 * users and a structured-data manual action waiting to happen. Do not add one
 * "just for the stars in the SERP".
 */
const SOFTWARE_APPLICATION_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CareerPack",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  inLanguage: "id-ID",
  description:
    "Aplikasi web gratis untuk pencari kerja Indonesia: editor CV ramah ATS dengan ekspor PDF, pelacak lamaran, ceklis dokumen kerja dalam dan luar negeri, roadmap belajar per profesi, latihan wawancara, dan asisten AI.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IDR",
    availability: "https://schema.org/InStock",
  },
};

/**
 * Built from the SAME array `FaqSection` renders. Google requires the answer to
 * be visible on the page; a schema-only FAQ is a policy violation, and two
 * hand-maintained copies would drift into one within a release. If you need to
 * change a question, change `slices/hero/sections/faq/constants/faq.constants.ts`.
 */
const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: "id-ID",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

/** How many roadmap chips the hubs section shows. Enough to seed crawl paths, few enough to read. */
const ROADMAP_LINK_LIMIT = 12;

/**
 * Front-load one roadmap per domain before filling the rest, so the homepage
 * links out to tech AND health AND government instead of twelve tech roadmaps
 * (the catalog is ordered by domain, so a plain `.slice(0, 12)` would).
 */
function spreadAcrossDomains<T extends { domain: string }>(
  rows: readonly T[],
  limit: number,
): T[] {
  const firstPerDomain: T[] = [];
  const rest: T[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.domain)) rest.push(row);
    else {
      seen.add(row.domain);
      firstPerDomain.push(row);
    }
  }
  return [...firstPerDomain, ...rest].slice(0, limit);
}

/**
 * Best-effort catalog fetch for the internal-linking section, mirroring
 * `app/sitemap.ts`. THE BUILD MUST NOT FAIL WHEN CONVEX IS UNREACHABLE —
 * Dokploy builds straight off a push to main, and a homepage that cannot be
 * prerendered takes the whole deploy with it. Every failure path returns empty
 * lists; `ContentHubsSection` then renders its prose plus the two hub links,
 * which is a degraded page, not a broken one.
 */
async function fetchHubLinks(): Promise<{
  countries: HubLink[];
  roadmaps: HubLink[];
}> {
  // Independently, so a slow or failing roadmap query cannot also cost the
  // page its country links. Each is bounded — an unbounded read here is what
  // made `next build` time out on this very page.
  const [guides, roadmaps] = await Promise.all([
    publicContentList<{ slug: string; countryLabel: string; flag?: string }>(
      (client) => client.query(api.documents.queries.listPublicCountryGuides, {}),
    ),
    publicContentList<{ slug: string; title: string; domain: string }>(
      (client) => client.query(api.roadmap.queries.listPublicRoadmaps, {}),
    ),
  ]);

  return {
    countries: guides.map((g) => ({
      slug: g.slug,
      label: g.countryLabel,
      flag: g.flag || undefined,
    })),
    roadmaps: spreadAcrossDomains(roadmaps, ROADMAP_LINK_LIMIT).map((r) => ({
      slug: r.slug,
      label: r.title,
    })),
  };
}

/**
 * Server-rendered marketing landing.
 *
 * Structure matters here. `<MarketingLanding>` is a THIN client island — the
 * auth redirect and the two CTA handlers, nothing else — and everything passed
 * as its children is server-rendered, so the page's prose (how it works, the
 * public content hubs, who it is for, the FAQ) ships in the initial HTML and is
 * readable with JavaScript disabled. That is also what makes the FAQPage
 * structured data below legitimate: the answers are genuinely on the page.
 *
 * When adding a section, ask whether it needs state. If not, it is a Server
 * Component and it goes here, not in the island.
 */
export default async function LandingPage() {
  const { countries, roadmaps } = await fetchHubLinks();

  return (
    <>
      <JsonLd data={ORGANIZATION_LD} />
      <JsonLd data={WEBSITE_LD} />
      <JsonLd data={SOFTWARE_APPLICATION_LD} />
      <JsonLd data={FAQ_LD} />
      <MarketingLanding>
        <ShowcaseSection />
        <ToolkitSection />
        <HowItWorksSection />
        <ContentHubsSection countries={countries} roadmaps={roadmaps} />
        <AudienceSection />
        <FaqSection />
      </MarketingLanding>
    </>
  );
}
