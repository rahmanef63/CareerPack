"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";
import { useThemePreset } from "@/shared/providers/ThemePresetProvider";

/**
 * Unified theme menu — light/dark mode radio + theme preset picker in
 * one dropdown. Used by both the desktop SiteHeader and mobile top bar.
 *
 * Trigger prop is injected so each shell can style its own button
 * (ghost icon-only for desktop/mobile top bar).
 */

interface ThemeMenuProps {
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
}

export function ThemeMenu({ trigger, align = "end" }: ThemeMenuProps) {
  const { theme, setTheme } = useTheme();
  const { registry, presetName, setPreset } = useThemePreset();
  const current =
    theme === "light" || theme === "dark" || theme === "system" ? theme : "system";

  const presets = useMemo(() => registry?.items ?? [], [registry]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" aria-label="Ganti tema">
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:inline" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-60">
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

        {presets.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2">
              <Palette className="h-3.5 w-3.5 text-brand" />
              Preset Tema
            </DropdownMenuLabel>
            <ScrollArea className="h-[260px]">
              <div className="space-y-0.5 px-1 pb-1">
                {presets.map((item) => {
                  const selected = item.name === presetName;
                  const vars = item.cssVars?.[current === "dark" ? "dark" : "light"] ?? {};
                  const primary = vars.primary ?? "transparent";
                  const accent = vars.accent ?? "transparent";
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setPreset(item.name)}
                      aria-pressed={selected}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                        selected
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/60 focus:bg-accent/60 outline-none",
                      )}
                    >
                      <span className="flex h-4 w-4 shrink-0 overflow-hidden rounded-full border border-border">
                        <span className="h-full w-1/2" style={{ backgroundColor: primary }} />
                        <span className="h-full w-1/2" style={{ backgroundColor: accent }} />
                      </span>
                      <span className="flex-1 truncate">{item.title}</span>
                      {selected && (
                        <Check className="h-3.5 w-3.5 text-brand" />
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
