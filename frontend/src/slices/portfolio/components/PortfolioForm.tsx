"use client";

import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import { Switch } from "@/shared/components/ui/switch";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/shared/components/ui/responsive-dialog";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { cn } from "@/shared/lib/utils";

import type { PortfolioFormValues } from "../types";
import {
  CATEGORY_LABELS,
  COVER_GRADIENTS,
  DEFAULT_FORM,
  EMOJI_SUGGESTIONS,
} from "../constants";

interface PortfolioFormProps {
  trigger: React.ReactNode;
  onSubmit: (values: PortfolioFormValues) => Promise<void> | void;
}

export function PortfolioForm({ trigger, onSubmit }: PortfolioFormProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<PortfolioFormValues>(DEFAULT_FORM);
  const [techInput, setTechInput] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setValues(DEFAULT_FORM);
    setTechInput("");
  };

  const addTech = () => {
    const t = techInput.trim();
    if (!t || values.techStack.includes(t)) return;
    setValues((v) => ({ ...v, techStack: [...v.techStack, t] }));
    setTechInput("");
  };

  const removeTech = (t: string) => {
    setValues((v) => ({
      ...v,
      techStack: v.techStack.filter((x) => x !== t),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values.title.trim() || !values.description.trim()) {
      toast.error("Judul dan deskripsi wajib diisi");
      return;
    }
    setBusy(true);
    try {
      await onSubmit(values);
      toast.success("Portofolio tersimpan");
      setOpen(false);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>{trigger}</ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Tambah Portofolio</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Showcase proyek, sertifikasi, atau publikasi terbaik Anda.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Cover preview */}
          <div
            className={cn(
              "flex h-24 items-center justify-center rounded-lg bg-gradient-to-br",
              values.coverGradient,
            )}
          >
            <span className="text-4xl">{values.coverEmoji}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input
              id="title"
              placeholder="e.g. Dashboard analytics realtime"
              value={values.title}
              onChange={(e) =>
                setValues((v) => ({ ...v, title: e.target.value }))
              }
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
                  {(
                    Object.keys(CATEGORY_LABELS) as Array<
                      keyof typeof CATEGORY_LABELS
                    >
                  ).map((k) => (
                    <ResponsiveSelectItem key={k} value={k}>
                      {CATEGORY_LABELS[k]}
                    </ResponsiveSelectItem>
                  ))}
                </ResponsiveSelectContent>
              </ResponsiveSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal</Label>
              <Input
                id="date"
                type="date"
                value={values.date}
                onChange={(e) =>
                  setValues((v) => ({ ...v, date: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Deskripsi</Label>
            <Textarea
              id="desc"
              rows={3}
              placeholder="Ceritakan singkat impact + peran Anda"
              value={values.description}
              onChange={(e) =>
                setValues((v) => ({ ...v, description: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Cover</Label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_SUGGESTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() =>
                    setValues((v) => ({ ...v, coverEmoji: emoji }))
                  }
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
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COVER_GRADIENTS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() =>
                    setValues((v) => ({ ...v, coverGradient: g.value }))
                  }
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

          <div className="space-y-2">
            <Label htmlFor="link">Tautan (opsional)</Label>
            <Input
              id="link"
              type="url"
              placeholder="https://…"
              value={values.link}
              onChange={(e) =>
                setValues((v) => ({ ...v, link: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Tech / tag</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Tekan Enter"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTech();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTech}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {values.techStack.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {values.techStack.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1 pr-1">
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTech(t)}
                      className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                      aria-label={`Hapus ${t}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm">Jadikan unggulan</Label>
              <p className="text-xs text-muted-foreground">
                Muncul di carousel atas
              </p>
            </div>
            <Switch
              checked={values.featured}
              onCheckedChange={(c) =>
                setValues((v) => ({ ...v, featured: c }))
              }
            />
          </div>

          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan"}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
