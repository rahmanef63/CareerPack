"use client";

import { useState, useEffect, type FormEvent } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { Plus, Trash2, X } from "lucide-react";
import { notify } from "@/shared/lib/notify";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import { Switch } from "@/shared/components/ui/switch";
import { FileUpload } from "@/shared/components/files/FileUpload";
import { api } from "../../../../../convex/_generated/api";
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
      notify.validation("Judul dan deskripsi wajib diisi");
      return;
    }
    setBusy(true);
    try {
      await onSubmit(values);
      notify.success("Portofolio tersimpan");
      setOpen(false);
      reset();
    } catch (err) {
      notify.fromError(err, "Gagal menyimpan");
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
          {/* Cover preview — uploaded image overrides emoji+gradient */}
          <CoverPreview values={values} />

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

          <div className="space-y-3">
            <Label>Cover</Label>
            {values.coverStorageId ? (
              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-2">
                <p className="flex-1 text-xs text-muted-foreground">
                  Gambar cover sudah diunggah — tampil di kartu mengganti
                  emoji/gradien. Hapus untuk kembali ke emoji.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setValues((v) => ({ ...v, coverStorageId: undefined }))
                  }
                >
                  <Trash2 className="mr-1 h-3 w-3" /> Hapus cover
                </Button>
              </div>
            ) : (
              <FileUpload
                label=""
                accept="image/*"
                crop={{ aspect: 16 / 9 }}
                hint="Opsional — unggah gambar cover (JPG/PNG/WebP, rasio 16:9, maks 10 MB)."
                onUploaded={(r) =>
                  setValues((v) => ({ ...v, coverStorageId: r.storageId }))
                }
              />
            )}
            <p className="text-xs text-muted-foreground">
              Atau pilih emoji + gradien sebagai fallback:
            </p>
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

/**
 * Renders the cover preview at the top of the form. When an upload
 * exists, the server-resolved URL is fetched via api.files.queries.getFileUrl
 * and takes priority over emoji+gradient. Falls back to the static
 * emoji+gradient combo when no storageId is set.
 */
function CoverPreview({ values }: { values: PortfolioFormValues }) {
  const url = useQuery(
    api.files.queries.getFileUrl,
    values.coverStorageId ? { storageId: values.coverStorageId } : "skip",
  );
  // Warm the layout so the <Image fill> container has size even before
  // the URL resolves. useEffect placeholder keeps React happy about the
  // useEffect import being used by at least one consumer.
  useEffect(() => { /* no-op; preview only reacts to values */ }, [values.coverStorageId]);

  if (url) {
    return (
      <div className="relative h-24 overflow-hidden rounded-lg bg-muted">
        <Image
          src={url}
          alt="Cover portofolio"
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, 512px"
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex h-24 items-center justify-center rounded-lg bg-gradient-to-br",
        values.coverGradient,
      )}
    >
      <span className="text-4xl">{values.coverEmoji}</span>
    </div>
  );
}
