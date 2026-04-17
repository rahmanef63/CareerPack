"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboard } from "@/features/admin";
import { useAuth } from "@/features/auth";

export default function AdminPage() {
  const router = useRouter();
  const { state } = useAuth();

  useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!state.isLoading && state.user?.role !== "admin") {
      router.replace("/");
    }
  }, [state.isLoading, state.isAuthenticated, state.user?.role, router]);

  if (state.isLoading || !state.isAuthenticated || state.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-career-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <AdminDashboard />;
}
