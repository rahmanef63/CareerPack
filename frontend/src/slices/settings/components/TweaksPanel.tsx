"use client";

import { Sparkles, Type, LayoutPanelTop, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/shared/components/ui/toggle-group";
import {
  useUIPrefs,
  type AIButtonStyle,
  type FontScale,
  type NavStyle,
} from "@/shared/hooks/useUIPrefs";

type ThemeMode = "light" | "dark" | "system";

const THEME_OPTIONS: ReadonlyArray<{
  value: ThemeMode;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Sistem", icon: Monitor },
];

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<SegmentedOption<T>>;
  ariaLabel: string;
}

/**
 * Segmented control berbasis shadcn `ToggleGroup` (type="single"),
 * sehingga a11y (role=radiogroup, arrow-key nav) otomatis.
 */
function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as T);
      }}
      aria-label={ariaLabel}
      variant="outline"
      className="w-full"
    >
      {options.map((opt) => (
        <ToggleGroupItem key={opt.value} value={opt.value} className="flex-1">
          {opt.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

const AI_STYLE_OPTIONS: ReadonlyArray<SegmentedOption<AIButtonStyle>> = [
  { value: "solid", label: "Polos" },
  { value: "gradient", label: "Gradien" },
  { value: "glow", label: "Berpendar" },
];

const FONT_OPTIONS: ReadonlyArray<SegmentedOption<FontScale>> = [
  { value: "compact", label: "Kecil" },
  { value: "normal", label: "Normal" },
  { value: "large", label: "Besar" },
];

const NAV_OPTIONS: ReadonlyArray<SegmentedOption<NavStyle>> = [
  { value: "flat", label: "Datar" },
  { value: "floating", label: "Melayang" },
  { value: "notched", label: "Lekukan" },
];

export function TweaksPanel() {
  const prefs = useUIPrefs();
  const { theme, setTheme } = useTheme();
  const themeMode: ThemeMode =
    theme === "light" || theme === "dark" || theme === "system" ? theme : "system";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Penyesuaian Tampilan</h1>
        <p className="text-sm text-muted-foreground">
          Personalisasi tampilan aplikasi sesuai selera Anda. Perubahan langsung tersimpan.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sun className="w-4 h-4 text-brand dark:hidden" />
            <Moon className="w-4 h-4 text-brand hidden dark:inline" />
            Mode Tampilan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="single"
            value={themeMode}
            onValueChange={(next) => {
              if (next) setTheme(next);
            }}
            aria-label="Mode tampilan"
            variant="outline"
            className="w-full"
          >
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className="flex-1 gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
          <p className="text-xs text-muted-foreground mt-2">
            Pilih <strong>Sistem</strong> agar mengikuti preferensi perangkat Anda.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand" /> Gaya Tombol AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Segmented<AIButtonStyle>
            value={prefs.aiButtonStyle}
            onChange={prefs.setAIButtonStyle}
            options={AI_STYLE_OPTIONS}
            ariaLabel="Gaya tombol AI"
          />
          <PreviewFab style={prefs.aiButtonStyle} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Type className="w-4 h-4 text-brand" /> Ukuran Huruf
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Segmented<FontScale>
            value={prefs.fontScale}
            onChange={prefs.setFontScale}
            options={FONT_OPTIONS}
            ariaLabel="Ukuran huruf"
          />
          <p className="text-sm text-muted-foreground">
            Contoh:{" "}
            <span className="font-medium text-foreground">
              Halo, ini ukuran huruf Anda saat ini.
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutPanelTop className="w-4 h-4 text-brand" /> Gaya Bar Navigasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Segmented<NavStyle>
            value={prefs.navStyle}
            onChange={prefs.setNavStyle}
            options={NAV_OPTIONS}
            ariaLabel="Gaya bar navigasi"
          />
          <p className="text-xs text-muted-foreground">
            Lihat ke bar navigasi di bawah — perubahan langsung terlihat.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={prefs.reset}>
          Kembalikan ke Bawaan
        </Button>
      </div>
    </div>
  );
}

function PreviewFab({ style }: { style: AIButtonStyle }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
      <div data-ai-btn={style} className="relative">
        <div className="ai-fab-bg w-12 h-12 rounded-full flex items-center justify-center text-brand-foreground">
          <Sparkles className="w-6 h-6 relative z-10" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Pratinjau tombol AI</p>
    </div>
  );
}
