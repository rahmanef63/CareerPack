"use client";

import { useState, type ReactNode } from "react";
import { BottomNav } from "@/shared/components/layout/BottomNav";
import { MoreDrawer } from "@/shared/components/layout/MoreDrawer";
import { MobileUserMenu } from "@/shared/components/layout/MobileUserMenu";
import { ThemePresetSwitcher } from "@/shared/components/theme/ThemePresetSwitcher";
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-ring"
      >
        Lewati ke konten utama
      </a>
      <MobileTopBar />
      <main
        id="main-content"
        className="flex-1 px-4"
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
    <header
      className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur"
      style={{
        // Status-bar safe area — iOS standalone PWA places the page
        // directly under the time/signal row; without this, brand mark
        // and avatar overlap the system clock.
        paddingTop: "var(--safe-top)",
        height: "calc(3rem + var(--safe-top))",
      }}
    >
      <span className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground">
          <BrandMark size={14} stroke="oklch(var(--brand-foreground))" strokeWidth={2.4} />
        </span>
        CareerPack
      </span>
      <div className="flex items-center gap-1">
        {/* Single theme controller — opens a Popover with mode tabs
            (Terang/Gelap/Sistem) sticky on top + preset palette
            scrollable below. Replaces the two-button setup that
            used to take up scarce mobile-header real estate. */}
        <ThemePresetSwitcher size="mobile" />
        <MobileUserMenu />
      </div>
    </header>
  );
}
