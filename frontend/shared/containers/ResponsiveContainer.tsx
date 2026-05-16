"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { DesktopContainer } from "./DesktopContainer";
import { AIAgentConsole } from "@/slices/ai-agent";
import { ALL_NAV_ITEMS } from "@/shared/components/layout/navConfig";
import { LoadingScreen } from "@/shared/components/feedback/LoadingScreen";

/**
 * MobileContainer di-lazy supaya bundle desktop tidak menarik BottomNav +
 * MoreDrawer JS. `ssr: false` karena deteksi mobile baru valid di client
 * (useIsMobile pakai matchMedia).
 */
const MobileContainer = dynamic(
  () => import("./MobileContainer").then((m) => m.MobileContainer),
  { ssr: false, loading: () => <LoadingScreen /> },
);

interface ResponsiveContainerProps {
  children: ReactNode;
}

/**
 * Pilih container sesuai breakpoint, host AIAgentConsole satu level di
 * atas supaya state `open` sinkron antara FAB mobile dan trigger desktop.
 *
 * Routing AI actions pakai `ALL_NAV_ITEMS` (navConfig SSOT) — tidak ada
 * hardcoded map.
 */
export function ResponsiveContainer({ children }: ResponsiveContainerProps) {
  const isMobile = useIsMobile();
  const [aiOpen, setAiOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = (view: string) => {
    // AI sering pakai alias "home" / "dashboard" untuk root dashboard
    if (view === "dashboard" || view === "home") {
      router.push("/dashboard");
      return;
    }
    const item = ALL_NAV_ITEMS.find((n) => n.id === view);
    router.push(item?.href ?? `/dashboard/${view}`);
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
