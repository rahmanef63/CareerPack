"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Palette, RotateCcw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";
import {
  DEFAULT_PRESET_NAME,
  useThemePreset,
} from "@/shared/providers/ThemePresetProvider";
import { presetSwatches, type ThemePresetItem } from "@/shared/lib/themePresets";
import { groupPresets, type PresetGroup } from "@/shared/lib/presetGroups";

interface ThemePresetSwitcherProps {
  /** Button size variant. Desktop = sm icon, mobile = h-11 touch target. */
  size?: "sm" | "mobile";
  /** Custom trigger class (desktop vs mobile rhythms). */
  triggerClassName?: string;
}

export function ThemePresetSwitcher({
  size = "sm",
  triggerClassName,
}: ThemePresetSwitcherProps) {
  const { registry, presetName, setPreset, preview, restore } = useThemePreset();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const groups: PresetGroup<ThemePresetItem>[] = useMemo(() => {
    if (!registry) return [];
    return groupPresets(registry.items);
  }, [registry]);

  // Close on outside click / Escape, restore saved preset.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        restore();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        restore();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, restore]);

  const commit = (name: string) => {
    setPreset(name);
    setOpen(false);
  };

  const resetDefault = () => commit(DEFAULT_PRESET_NAME);

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size={size === "mobile" ? "icon" : "icon"}
        aria-label="Pilih preset tema"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
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
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
          onMouseLeave={() => restore()}
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Preset Tema
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

          <ScrollArea className="max-h-[28rem]">
            {groups.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Memuat preset…
              </p>
            )}
            {groups.map((grp) => (
              <div key={grp.id}>
                <div className="sticky top-0 z-10 bg-muted/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
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
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
