"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HeroSection } from "@/slices/hero";
import { JsonLd } from "@/shared/components/seo/JsonLd";
import { useAuth } from "@/shared/hooks/useAuth";

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

export default function LandingPage() {
  const router = useRouter();
  const { state } = useAuth();

  useEffect(() => {
    if (!state.isLoading && state.isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [state.isLoading, state.isAuthenticated, router]);

  return (
    <>
      <JsonLd data={ORGANIZATION_LD} />
      <JsonLd data={WEBSITE_LD} />
      <HeroSection onGetStarted={() => router.push("/login")} />
    </>
  );
}
