"use client";

import { useState, type ReactNode } from "react";
import { BottomNav, type NavView } from "./BottomNav";
import { MoreDrawer, type MoreView } from "./MoreDrawer";
import { AIAgentConsole } from "@/features/ai-agent/components/AIAgentConsole";

interface AppShellProps {
  currentView: string;
  onViewChange: (view: string) => void;
  children: ReactNode;
}

export function AppShell({ currentView, onViewChange, children }: AppShellProps) {
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

  // Map nav highlight: when on a "more" view, treat nav as "more"
  const navCurrent: string = ["home", "cv", "calendar"].includes(currentView)
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

      <AIAgentConsole
        open={aiOpen}
        onOpenChange={setAiOpen}
        onNavigate={onViewChange}
        currentView={currentView}
      />
    </div>
  );
}
