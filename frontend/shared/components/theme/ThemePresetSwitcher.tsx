"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { ChevronDown, Monitor, Moon, Palette, RotateCcw, Sun } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";
import {
  DEFAULT_PRESET_NAME,
  useThemePreset,
} from "@/shared/providers/ThemePresetProvider";
import { presetSwatches, type ThemePresetItem } from "@/shared/lib/themePresets";
import { groupPresets, type PresetGroup } from "@/shared/lib/presetGroups";

interface ThemePresetSwitcherProps {
  size?: "sm" | "mobile";
  triggerClassName?: string;
}

const MODES = [
  { id: "light", label: "Terang", Icon: Sun },
  { id: "dark", label: "Gelap", Icon: Moon },
  { id: "system", label: "Sistem", Icon: Monitor },
] as const;

type ModeId = (typeof MODES)[number]["id"];

/**
 * Unified theme controller — light/dark/system mode tabs + preset
 * palette in one Popover, replacing the previous two-button setup
 * (separate ThemeMenu + ThemePresetSwitcher) that competed for header
 * real estate on mobile.
 *
 * Layout:
 *   [palette + chevron trigger]
 *     ├─ sticky header (mode tabs — 3-button segmented control)
 *     └─ scrollable preset list (grouped, hover-preview, click-commit)
 *
 * The mode tabs are sticky inside the popover so they stay visible
 * while scrolling through presets. PopoverContent uses Radix's
 * collisionPadding so the floater never crops on narrow viewports.
 */
export function ThemePresetSwitcher({
  size = "sm",
  triggerClassName,
}: ThemePresetSwitcherProps) {
  const { registry, presetName, setPreset, preview, restore } = useThemePreset();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const groups: PresetGroup<ThemePresetItem>[] = useMemo(() => {
    if (!registry) return [];
    return groupPresets(registry.items);
  }, [registry]);

  const presetCount = useMemo(
    () => groups.reduce((sum, g) => sum + g.items.length, 0),
    [groups],
  );

  const activeMode: ModeId =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system";

  const commit = (name: string) => {
    setPreset(name);
    setOpen(false);
  };

  const resetDefault = () => commit(DEFAULT_PRESET_NAME);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) restore();
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Tema dan preset warna"
          className={cn(
            size === "mobile" && "h-11 w-11",
            "gap-1.5",
            triggerClassName,
          )}
        >
          <Palette className="h-4 w-4" />
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform opacity-70",
              open && "rotate-180",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={8}
        avoidCollisions
        className="flex h-[min(80vh,34rem)] w-[min(20rem,calc(100vw-1rem))] sm:w-80 flex-col p-0 overflow-hidden"
        onMouseLeave={() => restore()}
      >
        {/* Sticky mode header — survives scroll inside the scrollable
            preset list below. shadow on overflow gives a subtle
            visual depth cue when content scrolls underneath. */}
        <div className="sticky top-0 z-20 shrink-0 border-b border-border bg-popover/95 px-3 py-2 backdrop-blur">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Mode Tampilan
          </p>
          <div
            role="tablist"
            aria-label="Mode tampilan"
            className="grid grid-cols-3 gap-1 rounded-md bg-muted/60 p-1"
          >
            {MODES.map(({ id, label, Icon }) => {
              const active = id === activeMode;
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setTheme(id)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preset list header (also sticky just below the mode tabs
            visually so the count + reset action stay accessible). */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Preset Warna{" "}
            <span className="font-normal text-muted-foreground/70">
              ({presetCount})
            </span>
          </span>
          <button
            type="button"
            onClick={resetDefault}
            onMouseEnter={() => preview(DEFAULT_PRESET_NAME)}
            onMouseLeave={() => restore()}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              presetName === DEFAULT_PRESET_NAME && "text-brand",
            )}
          >
            <RotateCcw className="h-3 w-3" />
            Default
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {groups.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Memuat preset…
            </p>
          )}
          {groups.map((grp) => (
            <div key={grp.id}>
              <div className="sticky top-0 z-10 border-b border-border/30 bg-popover/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                {grp.label}
              </div>
              {grp.items.map((p) => {
                const selected = p.name === presetName;
                const swatches = presetSwatches(p);
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => commit(p.name)}
                    onMouseEnter={() => preview(p.name)}
                    onFocus={() => preview(p.name)}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-border/40 px-3 py-2 text-left text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      selected && "bg-accent text-accent-foreground",
                    )}
                    aria-pressed={selected}
                  >
                    <span className="flex shrink-0 items-center gap-0.5">
                      {swatches.map((c, i) => (
                        <span
                          key={i}
                          aria-hidden
                          className="block h-3 w-3 rounded-full border border-border/60"
                          style={{ background: c }}
                        />
                      ))}
                    </span>
                    <span className="flex-1 truncate">{p.title}</span>
                    {selected && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
