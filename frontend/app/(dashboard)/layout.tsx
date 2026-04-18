"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/hooks/useAuth";
import { ResponsiveContainer } from "@/shared/containers/ResponsiveContainer";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { state } = useAuth();

  // Auth guard — redirect ke /login kalau tidak terautentikasi
  useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      router.replace("/login");
    }
  }, [state.isLoading, state.isAuthenticated, router]);

  if (state.isLoading || !state.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-spin w-8 h-8 border-4 border-career-600 border-t-transparent rounded-full"
          aria-label="Memuat"
        />
      </div>
    );
  }

  return <ResponsiveContainer>{children}</ResponsiveContainer>;
}
