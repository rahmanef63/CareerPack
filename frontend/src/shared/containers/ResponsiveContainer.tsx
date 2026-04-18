"use client";

import { useState, type ReactNode } from "react";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { DesktopContainer } from "./DesktopContainer";
import { MobileContainer } from "./MobileContainer";
import { AIAgentConsole } from "@/slices/ai-agent";
import { useRouter, usePathname } from "next/navigation";

interface ResponsiveContainerProps {
  children: ReactNode;
}

/**
 * Memilih container sesuai breakpoint dan meng-host AIAgentConsole
 * di satu tempat (state `open` diangkat ke sini).
 */
export function ResponsiveContainer({ children }: ResponsiveContainerProps) {
  const isMobile = useIsMobile();
  const [aiOpen, setAiOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = (view: string) => {
    // AI actions → route berbasis view id, semua under /dashboard
    const map: Record<string, string> = {
      home: "/dashboard",
      dashboard: "/dashboard",
      cv: "/dashboard/cv",
      calendar: "/dashboard/calendar",
      roadmap: "/dashboard/roadmap",
      checklist: "/dashboard/checklist",
      applications: "/dashboard/applications",
      interview: "/dashboard/interview",
      calculator: "/dashboard/calculator",
      matcher: "/dashboard/matcher",
      networking: "/dashboard/networking",
      portfolio: "/dashboard/portfolio",
      notifications: "/dashboard/notifications",
      settings: "/dashboard/settings",
      help: "/dashboard/help",
    };
    const href = map[view] ?? `/dashboard/${view}`;
    router.push(href);
  };

  const currentView =
    pathname === "/dashboard"
      ? "home"
      : pathname.replace(/^\/dashboard\//, "").split("/")[0] || "home";

  return (
    <>
      {isMobile ? (
        <MobileContainer onAITap={() => setAiOpen(true)} aiActive={aiOpen}>
          {children}
        </MobileContainer>
      ) : (
        <DesktopContainer onAITap={() => setAiOpen(true)} aiActive={aiOpen}>
          {children}
        </DesktopContainer>
      )}

      <AIAgentConsole
        open={aiOpen}
        onOpenChange={setAiOpen}
        currentView={currentView}
        onNavigate={handleNavigate}
      />
    </>
  );
}
