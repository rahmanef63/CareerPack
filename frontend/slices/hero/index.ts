export { HeroSection } from "./sections/hero";
export { ShowcaseSection } from "./sections/showcase";
export { ToolkitSection } from "./sections/toolkit";
export { CtaSection } from "./sections/cta";

// Server Components — no "use client" anywhere below. They carry the landing
// page's actual prose, so they must render in the served HTML rather than
// waiting on a client bundle. Keep them out of the client island in
// `app/(marketing)/_components/MarketingLanding.tsx`.
export { HowItWorksSection } from "./sections/how-it-works";
export { ContentHubsSection, type HubLink } from "./sections/hubs";
export { AudienceSection } from "./sections/audience";
// FAQ_ITEMS is exported alongside the section because the landing route builds
// its FAQPage JSON-LD from the same array — visible answer and structured
// answer cannot be allowed to drift.
export { FaqSection, FAQ_ITEMS, type FaqItem } from "./sections/faq";

export { heroManifest } from "./manifest";
