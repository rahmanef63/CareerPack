"use client";

import { useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { BottomNav } from "@/shared/components/layout/BottomNav";
import { MoreDrawer } from "@/shared/components/layout/MoreDrawer";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { BrandMark } from "@/shared/components/brand/Logo";

interface MobileContainerProps {
  onAITap: () => void;
  aiActive: boolean;
  children: ReactNode;
}

/**
 * Container untuk layar < lg. BottomNav 5-slot + AI FAB di tengah,
 * More drawer sebagai app-launcher. Top bar slim berisi brand mark +
 * theme toggle agar ganti tema tidak butuh 3-tap lewat Pengaturan.
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
  const { theme, setTheme } = useTheme();
  const current =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system";
  return (
    <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur">
      <span className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground">
          <BrandMark size={14} stroke="hsl(var(--brand-foreground))" strokeWidth={2.4} />
        </span>
        CareerPack
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Ganti tema" className="h-11 w-11">
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:inline" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>Mode Tampilan</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={current} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light">
              <Sun className="mr-2 h-4 w-4" /> Terang
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Moon className="mr-2 h-4 w-4" /> Gelap
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <Monitor className="mr-2 h-4 w-4" /> Sistem
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
