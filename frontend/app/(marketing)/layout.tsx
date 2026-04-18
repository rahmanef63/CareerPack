import type { ReactNode } from "react";
import { MarketingHeader } from "@/shared/components/MarketingHeader";
import { MarketingFooter } from "@/shared/components/MarketingFooter";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketingHeader />
      <div className="flex-1">{children}</div>
      <MarketingFooter />
    </div>
  );
}
