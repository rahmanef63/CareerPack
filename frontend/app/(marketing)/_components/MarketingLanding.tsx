"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HeroSection, CtaSection } from "@/slices/hero";
import { useAuth } from "@/shared/hooks/useAuth";

/**
 * Client island for the marketing landing route.
 *
 * It owns exactly two things that need a browser: the auth-redirect effect
 * (logged-in users bounce to /dashboard) and the two CTA click handlers that
 * push to /login. Everything between the hero and the closing CTA arrives as
 * `children` — Server Components rendered by `page.tsx` and streamed straight
 * into the HTML.
 *
 * That `children` hand-off is the point. Wrapping the whole page in this
 * component (as it did until 2026-08-12) pulled every section into the client
 * graph, and the prose sections' text would sit behind hydration for no reason
 * — they have no state, no effects, and no handlers. A Server Component passed
 * as `children` to a Client Component never crosses the boundary; it is already
 * rendered by the time this island hydrates.
 *
 * So: do NOT move new content sections into this file. Add them to `page.tsx`.
 * The only thing that belongs here is markup that genuinely needs `useState`,
 * `useEffect`, or a DOM event.
 */
export function MarketingLanding({ children }: { children: ReactNode }) {
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
      {children}
      <CtaSection onGetStarted={() => router.push("/login")} />
    </>
  );
}
