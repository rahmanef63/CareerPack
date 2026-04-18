import type { ReactNode } from "react";
import { MarketingHeader } from "@/shared/components/MarketingHeader";
import { MarketingFooter } from "@/shared/components/MarketingFooter";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketingHeader />
      <div className="flex-1">
        <ErrorBoundary>{children}</ErrorBoundary>
      </div>
      <MarketingFooter />
    </div>
  );
}
