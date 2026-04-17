"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginPage } from "@/features/auth";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function LoginRoute() {
  const router = useRouter();
  const { state } = useAuth();

  useEffect(() => {
    if (!state.isLoading && state.isAuthenticated) {
      router.replace("/");
    }
  }, [state.isLoading, state.isAuthenticated, router]);

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-career-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <LoginPage />;
}
