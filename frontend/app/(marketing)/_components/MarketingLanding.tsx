"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  StatsSection,
  TestimonialsSection,
  FaqSection,
  FinalCtaSection,
} from "@/slices/hero";
import { useAuth } from "@/shared/hooks/useAuth";

/**
 * Client island for the marketing landing route.
 *
 * The parent route is a Server Component (static JSON-LD + meta), so
 * anonymous visitors receive prerendered HTML with no React runtime
 * cost for above-the-fold content. This island hydrates only the
 * pieces that need browser state: the auth-redirect effect (logged-in
 * users bounce to /dashboard) and the Hero's interactive CTAs.
 */
export function MarketingLanding() {
  const router = useRouter();
  const { state } = useAuth();

  useEffect(() => {
    if (!state.isLoading && state.isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [state.isLoading, state.isAuthenticated, router]);

  return (
    <>
      <HeroSection onGetStarted={() => router.push("/login")} />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <TestimonialsSection />
      <FaqSection />
      <FinalCtaSection onGetStarted={() => router.push("/login")} />
    </>
  );
}
