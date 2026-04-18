"use client";

import { useState, type ReactNode } from "react";
import { BottomNav } from "@/shared/components/BottomNav";
import { MoreDrawer } from "@/shared/components/MoreDrawer";

interface MobileContainerProps {
  onAITap: () => void;
  aiActive: boolean;
  children: ReactNode;
}

/**
 * Container untuk layar < lg. BottomNav 5-slot + AI FAB di tengah,
 * More drawer sebagai app-launcher.
 */
export function MobileContainer({
  onAITap,
  aiActive,
  children,
}: MobileContainerProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main
        className="flex-1"
        style={{
          paddingBottom: "calc(var(--nav-height) + var(--safe-bottom) + 1rem)",
        }}
      >
        {children}
      </main>
      <BottomNav
        onAITap={onAITap}
        aiActive={aiActive}
        onMoreTap={() => setMoreOpen(true)}
      />
      <MoreDrawer open={moreOpen} onOpenChange={setMoreOpen} />
    </div>
  );
}
