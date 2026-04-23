"use client";

import { useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { BottomNav } from "@/shared/components/layout/BottomNav";
import { MoreDrawer } from "@/shared/components/layout/MoreDrawer";
import { Button } from "@/shared/components/ui/button";
import { ThemeMenu } from "@/shared/components/theme/ThemeMenu";
import { BrandMark } from "@/shared/components/brand/Logo";

interface MobileContainerProps {
  onAITap: () => void;
  aiActive: boolean;
  children: ReactNode;
}

/**
 * Container untuk layar < lg. BottomNav 5-slot + AI FAB di tengah,
 * More drawer sebagai app-launcher. Top bar slim berisi brand mark +
 * theme/preset menu — ganti mode gelap-terang dan preset warna tanpa
 * buka Pengaturan.
 */
export function MobileContainer({
  onAITap,
  aiActive,
  children,
}: MobileContainerProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <MobileTopBar />
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

function MobileTopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur">
      <span className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground">
          <BrandMark size={14} stroke="oklch(var(--brand-foreground))" strokeWidth={2.4} />
        </span>
        CareerPack
      </span>
      <ThemeMenu
        trigger={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ganti tema & preset"
            className="h-11 w-11"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:inline" />
          </Button>
        }
      />
    </header>
  );
}
