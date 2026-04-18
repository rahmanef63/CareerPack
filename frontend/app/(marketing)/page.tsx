"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HeroSection } from "@/slices/hero";
import { useAuth } from "@/shared/hooks/useAuth";

export default function LandingPage() {
  const router = useRouter();
  const { state } = useAuth();

  // Kalau sudah login, arahkan langsung ke dashboard
  useEffect(() => {
    if (!state.isLoading && state.isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [state.isLoading, state.isAuthenticated, router]);

  return <HeroSection onGetStarted={() => router.push("/login")} />;
}
