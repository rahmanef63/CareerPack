"use client";

import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { cn } from "@/shared/lib/utils";
import type { PortfolioFormValues } from "../../types";
import { CATEGORY_LABELS, COVER_GRADIENTS, EMOJI_SUGGESTIONS } from "../../constants";
import { CoverPreview } from "./CoverPreview";

interface Props {
  values: PortfolioFormValues;
  setValues: React.Dispatch<React.SetStateAction<PortfolioFormValues>>;
}

export function BasicTab({ values, setValues }: Props) {
  return (
    <div className="w-full space-y-3 pt-3">
      <CoverPreview values={values} />

      <div className="space-y-2">
        <Label htmlFor="title">Judul</Label>
        <Input
          id="title"
          placeholder="e.g. Dashboard analytics realtime"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Kategori</Label>
          <ResponsiveSelect
            value={values.category}
            onValueChange={(v) =>
              setValues((prev) => ({
                ...prev,
                category: v as PortfolioFormValues["category"],
              }))
            }
          >
            <ResponsiveSelectTrigger placeholder="Pilih kategori" />
            <ResponsiveSelectContent drawerTitle="Kategori">
              {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map(
                (k) => (
                  <ResponsiveSelectItem key={k} value={k}>
                    {CATEGORY_LABELS[k]}
                  </ResponsiveSelectItem>
                ),
              )}
            </ResponsiveSelectContent>
          </ResponsiveSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Tanggal</Label>
          <Input
            id="date"
            type="date"
            value={values.date}
            onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc">Deskripsi</Label>
        <Textarea
          id="desc"
          rows={4}
          placeholder="Apa yang dibangun, peran kamu, dampak yang dihasilkan."
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Cover fallback</Label>
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_SUGGESTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setValues((v) => ({ ...v, coverEmoji: emoji }))}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md border text-lg",
                values.coverEmoji === emoji
                  ? "border-brand bg-brand-muted"
                  : "border-border hover:bg-accent",
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COVER_GRADIENTS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setValues((v) => ({ ...v, coverGradient: g.value }))}
              aria-label={g.label}
              className={cn(
                "h-6 w-10 rounded-md bg-gradient-to-br ring-2 transition-all",
                g.value,
                values.coverGradient === g.value
                  ? "ring-foreground"
                  : "ring-transparent hover:ring-border",
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div className="space-y-0.5">
          <Label className="text-sm">Jadikan unggulan</Label>
          <p className="text-xs text-muted-foreground">Muncul di carousel atas</p>
        </div>
        <Switch
          checked={values.featured}
          onCheckedChange={(c) => setValues((v) => ({ ...v, featured: c }))}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div className="space-y-0.5">
          <Label className="text-sm">Tampilkan di Personal Branding</Label>
          <p className="text-xs text-muted-foreground">
            Override visibilitas global. Kosong = ikuti pengaturan.
          </p>
        </div>
        <ResponsiveSelect
          value={
            values.brandingShow === undefined
              ? "default"
              : values.brandingShow
                ? "show"
                : "hide"
          }
          onValueChange={(v) =>
            setValues((prev) => ({
              ...prev,
              brandingShow:
                v === "default" ? undefined : v === "show",
            }))
          }
        >
          <ResponsiveSelectTrigger className="h-9 w-[140px]" />
          <ResponsiveSelectContent>
            <ResponsiveSelectItem value="default">Ikut global</ResponsiveSelectItem>
            <ResponsiveSelectItem value="show">Selalu tampil</ResponsiveSelectItem>
            <ResponsiveSelectItem value="hide">Sembunyikan</ResponsiveSelectItem>
          </ResponsiveSelectContent>
        </ResponsiveSelect>
      </div>
    </div>
  );
}
