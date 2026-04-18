"use client";

import { Sparkles, Type, LayoutPanelTop } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  useUIPrefs,
  type AIButtonStyle,
  type FontScale,
  type NavStyle,
} from "@/shared/hooks/useUIPrefs";

export function TweaksPanel() {
  const prefs = useUIPrefs();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Penyesuaian Tampilan</h1>
        <p className="text-sm text-muted-foreground">
          Personalisasi tampilan aplikasi sesuai selera Anda. Perubahan langsung tersimpan.
        </p>
      </header>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-career-600" /> Gaya Tombol AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Segmented<AIButtonStyle>
            value={prefs.aiButtonStyle}
            onChange={prefs.setAIButtonStyle}
            options={[
              { value: "solid", label: "Polos" },
              { value: "gradient", label: "Gradien" },
              { value: "glow", label: "Berpendar" },
            ]}
          />
          <PreviewFab style={prefs.aiButtonStyle} />
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Type className="w-4 h-4 text-career-600" /> Ukuran Huruf
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Segmented<FontScale>
            value={prefs.fontScale}
            onChange={prefs.setFontScale}
            options={[
              { value: "compact", label: "Kecil" },
              { value: "normal", label: "Normal" },
              { value: "large", label: "Besar" },
            ]}
          />
          <p className="text-sm text-muted-foreground">
            Contoh: <span className="font-medium text-foreground">Halo, ini ukuran huruf Anda saat ini.</span>
          </p>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutPanelTop className="w-4 h-4 text-career-600" /> Gaya Bar Navigasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Segmented<NavStyle>
            value={prefs.navStyle}
            onChange={prefs.setNavStyle}
            options={[
              { value: "flat", label: "Datar" },
              { value: "floating", label: "Melayang" },
              { value: "notched", label: "Lekukan" },
            ]}
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

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}

function Segmented<T extends string>({ value, onChange, options }: SegmentedProps<T>) {
  return (
    <div className="inline-flex w-full bg-muted rounded-lg p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
            value === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function PreviewFab({ style }: { style: AIButtonStyle }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
      <div data-ai-btn={style} className="relative">
        <div className="ai-fab-bg w-12 h-12 rounded-full flex items-center justify-center text-white">
          <Sparkles className="w-6 h-6 relative z-10" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Pratinjau tombol AI</p>
    </div>
  );
}
