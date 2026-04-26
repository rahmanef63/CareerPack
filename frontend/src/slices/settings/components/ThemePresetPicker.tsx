"use client";

import { useMemo } from "react";
import { Check, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";
import { DEFAULT_PRESET_NAME, useThemePreset } from "@/shared/providers/ThemePresetProvider";

function resolveColor(raw: string | undefined): string {
  if (!raw) return "transparent";
  // Browser understands oklch / hsl / hex directly as CSS color values,
  // so pass through without conversion for preview swatches.
  return raw.trim();
}

export function ThemePresetPicker() {
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";
  const { registry, presetName, setPreset, isReady } = useThemePreset();

  const items = useMemo(() => registry?.items ?? [], [registry]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-brand" />
          Preset Tema
        </CardTitle>
        <CardDescription>
          Pilih salah satu dari {items.length || "—"} preset tweakcn yang
          dibundel dengan CareerPack. Perubahan berlaku instan dan tersimpan
          di perangkat ini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isReady && (
          <p className="text-sm text-muted-foreground">Memuat preset…</p>
        )}
        {isReady && items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Registri preset tidak tersedia. Pastikan <code>/r/registry.json</code> ter-serve.
          </p>
        )}
        {items.length > 0 && (
          <ScrollArea className="h-[520px] pr-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => {
                const vars = item.cssVars?.[mode] ?? {};
                const bg = resolveColor(vars.background);
                const fg = resolveColor(vars.foreground);
                const primary = resolveColor(vars.primary);
                const accent = resolveColor(vars.accent);
                const border = resolveColor(vars.border);
                const selected = item.name === presetName;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setPreset(item.name)}
                    className={cn(
                      "group relative flex flex-col gap-2 rounded-lg border p-3 text-left transition-all",
                      selected
                        ? "border-brand ring-2 ring-brand/30"
                        : "border-border hover:border-muted-foreground",
                    )}
                    aria-pressed={selected}
                  >
                    <div
                      className="flex h-16 items-center justify-center rounded-md border"
                      style={{ backgroundColor: bg, borderColor: border, color: fg }}
                    >
                      <div className="flex gap-1.5">
                        <span
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: primary, borderColor: border }}
                        />
                        <span
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: accent, borderColor: border }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium leading-tight text-foreground">
                        {item.title}
                      </span>
                      {selected && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPreset(DEFAULT_PRESET_NAME)}
            disabled={!registry}
          >
            Reset ke default
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
