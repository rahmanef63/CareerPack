import type { ReactNode } from "react";
import { RouteGuard } from "@/shared/components/auth/RouteGuard";
import { ResponsiveContainer } from "@/shared/containers/ResponsiveContainer";
import { ErrorBoundary } from "@/shared/components/error/ErrorBoundary";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard mode="auth">
      <ErrorBoundary title="Dashboard bermasalah">
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </ErrorBoundary>
    </RouteGuard>
  );
}
