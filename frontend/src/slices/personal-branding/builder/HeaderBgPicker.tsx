"use client";

import { useState } from "react";
import { Check, Palette, ImageIcon, Square, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/utils";
import { HEADER_GRADIENT_PRESETS } from "../blocks/types";
import type { HeaderBg } from "../blocks/types";

interface Props {
  value: HeaderBg | null;
  onChange: (v: HeaderBg) => void;
}

type Tab = "gradient" | "solid" | "image" | "none";

export function HeaderBgPicker({ value, onChange }: Props) {
  const initial: Tab = value?.kind ?? "gradient";
  const [tab, setTab] = useState<Tab>(initial);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1 rounded-md bg-muted p-1">
        <TabButton active={tab === "gradient"} onClick={() => setTab("gradient")}>
          <Palette className="mr-1.5 h-3.5 w-3.5" />
          Gradient
        </TabButton>
        <TabButton active={tab === "solid"} onClick={() => setTab("solid")}>
          <Square className="mr-1.5 h-3.5 w-3.5" />
          Solid
        </TabButton>
        <TabButton active={tab === "image"} onClick={() => setTab("image")}>
          <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
          Gambar
        </TabButton>
        <TabButton active={tab === "none"} onClick={() => setTab("none")}>
          <X className="mr-1.5 h-3.5 w-3.5" />
          Default
        </TabButton>
      </div>

      {tab === "gradient" && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {HEADER_GRADIENT_PRESETS.map((g) => {
            const active =
              value?.kind === "gradient" && value.value === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() =>
                  onChange({ kind: "gradient", value: g })
                }
                className={cn(
                  "relative h-16 rounded-lg bg-gradient-to-br",
                  g,
                  active
                    ? "ring-2 ring-brand ring-offset-2 ring-offset-background"
                    : "hover:scale-[1.02] transition-transform",
                )}
                aria-label="Pilih gradient"
              >
                {active && (
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {tab === "solid" && (
        <div className="space-y-2">
          <Label htmlFor="hb-solid">Warna hex</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              id="hb-solid"
              value={
                value?.kind === "solid" ? value.value : "#0ea5e9"
              }
              onChange={(e) =>
                onChange({ kind: "solid", value: e.target.value })
              }
              className="h-12 w-20 cursor-pointer rounded-md border border-border bg-transparent"
            />
            <Input
              value={value?.kind === "solid" ? value.value : ""}
              placeholder="#0ea5e9"
              maxLength={7}
              onChange={(e) =>
                onChange({ kind: "solid", value: e.target.value })
              }
              className="font-mono"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Format hex 6 digit. Teks heading otomatis pilih putih atau
            hitam berdasarkan kontras YIQ.
          </p>
        </div>
      )}

      {tab === "image" && (
        <div className="space-y-2">
          <Label htmlFor="hb-image">URL gambar</Label>
          <Input
            id="hb-image"
            type="url"
            value={value?.kind === "image" ? value.value : ""}
            placeholder="https://…/banner.jpg"
            inputMode="url"
            onChange={(e) =>
              onChange({ kind: "image", value: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground">
            Akan otomatis diberi overlay gelap supaya teks heading tetap
            terbaca.
          </p>
        </div>
      )}

      {tab === "none" && (
        <div className="rounded-md border border-dashed border-border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">
            Pakai background default — soft brand wash + parang pattern.
            Klik tombol ini untuk menerapkan.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => onChange({ kind: "none", value: "" })}
          >
            Pakai Default
          </Button>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-sm px-2 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
