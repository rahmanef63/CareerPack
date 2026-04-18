"use client";

import { useState, type ReactNode } from "react";
import { BottomNav, type NavView } from "./BottomNav";
import { MoreDrawer, type MoreView } from "./MoreDrawer";

interface AppShellProps {
  currentView: string;
  onViewChange: (view: string) => void;
  /**
   * Slot callback to mount the AI console. App.tsx owns this so that
   * AppShell itself does not cross-import a slice (ai-agent).
   * `aiOpen` + `setAiOpen` are driven here but consumed outside.
   */
  renderAIConsole?: (args: {
    open: boolean;
    setOpen: (open: boolean) => void;
    currentView: string;
    onNavigate: (view: string) => void;
  }) => ReactNode;
  children: ReactNode;
}

const PRIMARY_VIEWS = ["home", "cv", "calendar"] as const;

export function AppShell({
  currentView,
  onViewChange,
  renderAIConsole,
  children,
}: AppShellProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const handleNav = (id: NavView) => {
    if (id === "more") {
      setMoreOpen(true);
      return;
    }
    onViewChange(id);
  };

  const handleMoreSelect = (id: MoreView) => {
    onViewChange(id);
  };

  // Highlight "Lainnya" when the current view is anything outside the primary tabs
  const navCurrent: string = (PRIMARY_VIEWS as readonly string[]).includes(currentView)
    ? currentView
    : "more";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main
        className="min-h-screen"
        style={{ paddingBottom: "calc(var(--nav-height) + var(--safe-bottom) + 1rem)" }}
      >
        {children}
      </main>

      <BottomNav
        current={navCurrent}
        onSelect={handleNav}
        onAITap={() => setAiOpen(true)}
        aiActive={aiOpen}
      />

      <MoreDrawer open={moreOpen} onOpenChange={setMoreOpen} onSelect={handleMoreSelect} />

      {renderAIConsole?.({
        open: aiOpen,
        setOpen: setAiOpen,
        currentView,
        onNavigate: onViewChange,
      })}
    </div>
  );
}
