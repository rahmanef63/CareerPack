import { JsonLd } from "@/shared/components/seo/JsonLd";
import { MarketingLanding } from "./_components/MarketingLanding";

const SITE_URL = "https://careerpack.org";

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
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

/**
 * Server-rendered marketing landing. JSON-LD ships in the initial HTML
 * (crawlers see it pre-hydration). The auth-redirect + Hero interaction
 * lives inside `<MarketingLanding>` — a thin client island.
 */
export default function LandingPage() {
  return (
    <>
      <JsonLd data={ORGANIZATION_LD} />
      <JsonLd data={WEBSITE_LD} />
      <MarketingLanding />
    </>
  );
}
