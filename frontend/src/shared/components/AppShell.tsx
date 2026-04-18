"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/shared/components/ui/sidebar";
import { Button } from "@/shared/components/ui/button";
import { BottomNav } from "./BottomNav";
import { MoreDrawer } from "./MoreDrawer";
import { DesktopSidebar } from "./DesktopSidebar";
import { PRIMARY_VIEW_IDS, type NavId, type PrimaryNavId } from "./navConfig";

interface AppShellProps {
  currentView: string;
  onViewChange: (view: string) => void;
  /**
   * Slot untuk memasang AI console. Dimiliki App.tsx supaya AppShell
   * tidak perlu cross-import slice ai-agent.
   */
  renderAIConsole?: (args: {
    open: boolean;
    setOpen: (open: boolean) => void;
    currentView: string;
    onNavigate: (view: string) => void;
  }) => ReactNode;
  children: ReactNode;
}

/**
 * Shell responsif:
 * - `lg` ke atas: Sidebar kiri (collapsible, icon-only saat collapsed).
 * - Di bawah `lg`: BottomNav 5-slot + More drawer.
 * Keduanya berbagi `PRIMARY_NAV` + `MORE_APPS` (SSOT di navConfig).
 */
export function AppShell({
  currentView,
  onViewChange,
  renderAIConsole,
  children,
}: AppShellProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const handleMobileNav = (id: PrimaryNavId) => {
    if (id === "more") {
      setMoreOpen(true);
      return;
    }
    onViewChange(id);
  };

  const handleDesktopSelect = (id: NavId) => {
    onViewChange(id);
  };

  // Di BottomNav: kalau current view bukan primary, highlight "Lainnya"
  const bottomNavCurrent = PRIMARY_VIEW_IDS.includes(currentView) ? currentView : "more";

  const aiConsole = renderAIConsole?.({
    open: aiOpen,
    setOpen: setAiOpen,
    currentView,
    onNavigate: onViewChange,
  });

  return (
    <SidebarProvider defaultOpen>
      <DesktopSidebar
        current={currentView}
        onSelect={handleDesktopSelect}
        onAITap={() => setAiOpen(true)}
        aiActive={aiOpen}
      />

      {/* Konten utama — di-inset otomatis oleh SidebarProvider di desktop */}
      <div className="flex-1 min-h-screen bg-background text-foreground flex flex-col">
        {/* Top bar desktop: trigger collapse sidebar */}
        <header className="hidden lg:flex sticky top-0 z-20 h-12 items-center gap-2 px-3 border-b border-border bg-card/70 backdrop-blur">
          <SidebarTrigger aria-label="Lipat / buka sidebar">
            <Menu className="w-5 h-5" />
          </SidebarTrigger>
          <div className="flex-1" />
          <Button
            type="button"
            onClick={() => setAiOpen(true)}
            size="sm"
            className="bg-gradient-to-br from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white"
            aria-label="Buka Asisten AI"
          >
            Asisten AI
          </Button>
        </header>

        <main
          className="flex-1"
          style={{
            paddingBottom:
              "calc(var(--nav-height) + var(--safe-bottom) + 1rem)",
          }}
        >
          <div className="lg:[--nav-height:0px]">{children}</div>
        </main>

        <BottomNav
          current={bottomNavCurrent}
          onSelect={handleMobileNav}
          onAITap={() => setAiOpen(true)}
          aiActive={aiOpen}
        />
      </div>

      <MoreDrawer open={moreOpen} onOpenChange={setMoreOpen} onSelect={onViewChange} />

      {aiConsole}
    </SidebarProvider>
  );
}
