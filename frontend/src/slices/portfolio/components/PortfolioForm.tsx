"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { Plus, Trash2, X, Upload, ExternalLink } from "lucide-react";
import { notify } from "@/shared/lib/notify";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import { Switch } from "@/shared/components/ui/switch";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { FileUpload } from "@/shared/components/files/FileUpload";
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

import type {
  PortfolioFormValues,
  PortfolioItem,
  PortfolioLink,
  PortfolioLinkKind,
  PortfolioMedia,
  PortfolioMediaKind,
} from "../types";
import {
  CATEGORY_LABELS,
  COVER_GRADIENTS,
  DEFAULT_FORM,
  EMOJI_SUGGESTIONS,
  LINK_KIND_LABELS,
} from "../constants";
import { LibraryPicker } from "./LibraryPicker";

interface PortfolioFormProps {
  trigger?: React.ReactNode;
  /** When supplied, parent controls open/close (used for edit-from-card). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: "create" | "edit";
  initialItem?: PortfolioItem;
  onSubmit: (values: PortfolioFormValues) => Promise<void> | void;
}

function itemToValues(item: PortfolioItem): PortfolioFormValues {
  return {
    title: item.title,
    description: item.description,
    category: (item.category as PortfolioFormValues["category"]) ?? "project",
    coverEmoji: item.coverEmoji ?? DEFAULT_FORM.coverEmoji,
    coverGradient: item.coverGradient ?? DEFAULT_FORM.coverGradient,
    media: (item.media ?? []).map((m) => ({
      storageId: m.storageId,
      kind: m.kind,
      caption: m.caption,
      url: m.url,
    })),
    link: item.link ?? "",
    links: item.links ?? [],
    techStack: item.techStack ?? [],
    date: item.date,
    featured: item.featured,
    role: item.role ?? "",
    client: item.client ?? "",
    duration: item.duration ?? "",
    outcomes: item.outcomes ?? [],
    collaborators: item.collaborators ?? [],
    skills: item.skills ?? [],
    brandingShow: item.brandingShow,
  };
}

export function PortfolioForm({
  trigger,
  open: openProp,
  onOpenChange,
  mode = "create",
  initialItem,
  onSubmit,
}: PortfolioFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const baseValues = useMemo(
    () => (initialItem ? itemToValues(initialItem) : DEFAULT_FORM),
    [initialItem],
  );
  const [values, setValues] = useState<PortfolioFormValues>(baseValues);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"basic" | "media" | "links" | "detail">("basic");

  // Resync when caller supplies a new initialItem (edit a different card).
  useEffect(() => {
    if (open) setValues(baseValues);
  }, [open, baseValues]);

  const reset = () => setValues(DEFAULT_FORM);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values.title.trim() || !values.description.trim()) {
      notify.validation("Judul dan deskripsi wajib diisi");
      setTab("basic");
      return;
    }
    setBusy(true);
    try {
      await onSubmit(values);
      notify.success(mode === "edit" ? "Portofolio diperbarui" : "Portofolio tersimpan");
      setOpen(false);
      if (mode === "create") reset();
    } catch (err) {
      notify.fromError(err, "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      {trigger && <ResponsiveDialogTrigger asChild>{trigger}</ResponsiveDialogTrigger>}
      <ResponsiveDialogContent className="sm:max-w-2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {mode === "edit" ? "Edit Portofolio" : "Tambah Portofolio"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Showcase proyek, sertifikasi, desain, tulisan, atau hasil karya
            apa pun. Cover diunggah sekali, bisa dipakai ulang dari Library.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList variant="pills" className="flex-wrap">
              <TabsTrigger value="basic">Dasar</TabsTrigger>
              <TabsTrigger value="media">Media{values.media.length > 0 && ` · ${values.media.length}`}</TabsTrigger>
              <TabsTrigger value="links">Tautan{values.links.length > 0 && ` · ${values.links.length}`}</TabsTrigger>
              <TabsTrigger value="detail">Detail</TabsTrigger>
            </TabsList>

            <ScrollArea className="max-h-[60vh] pr-3">
              <TabsContent value="basic" className="space-y-3 pt-3">
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
              </TabsContent>

              <TabsContent value="media" className="space-y-3 pt-3">
                <MediaEditor
                  media={values.media}
                  onChange={(media) => setValues((v) => ({ ...v, media }))}
                />
              </TabsContent>

              <TabsContent value="links" className="space-y-3 pt-3">
                <LinksEditor
                  links={values.links}
                  onChange={(links) => setValues((v) => ({ ...v, links }))}
                />
                <div className="space-y-2 pt-2 border-t border-border">
                  <Label className="text-xs text-muted-foreground">Tautan utama (legacy)</Label>
                  <Input
                    type="url"
                    placeholder="https://… (opsional, fallback)"
                    value={values.link}
                    onChange={(e) => setValues((v) => ({ ...v, link: e.target.value }))}
                  />
                </div>
              </TabsContent>

              <TabsContent value="detail" className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldInput
                    label="Peran"
                    value={values.role}
                    placeholder="Lead Designer, Solo Dev…"
                    onChange={(s) => setValues((v) => ({ ...v, role: s }))}
                  />
                  <FieldInput
                    label="Klien / Organisasi"
                    value={values.client}
                    placeholder="Personal, Acme Inc, dll"
                    onChange={(s) => setValues((v) => ({ ...v, client: s }))}
                  />
                </div>
                <FieldInput
                  label="Durasi"
                  value={values.duration}
                  placeholder="Jan 2024 – Mar 2024 (3 bulan)"
                  onChange={(s) => setValues((v) => ({ ...v, duration: s }))}
                />

                <ChipListEditor
                  label="Outcome / Metrik"
                  hint="e.g. +30% konversi, 10k DAU"
                  items={values.outcomes}
                  onChange={(outcomes) => setValues((v) => ({ ...v, outcomes }))}
                />
                <ChipListEditor
                  label="Tech / Tool"
                  hint="React, Figma, Sony A7…"
                  items={values.techStack}
                  onChange={(techStack) => setValues((v) => ({ ...v, techStack }))}
                />
                <ChipListEditor
                  label="Skill"
                  hint="UX research, JS, public speaking…"
                  items={values.skills}
                  onChange={(skills) => setValues((v) => ({ ...v, skills }))}
                />
                <ChipListEditor
                  label="Kolaborator"
                  hint="Nama orang/tim yang ikut serta"
                  items={values.collaborators}
                  onChange={(collaborators) => setValues((v) => ({ ...v, collaborators }))}
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                if (mode === "create") reset();
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan…" : mode === "edit" ? "Simpan perubahan" : "Simpan"}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

// ---------------------------------------------------------------------
// Sub-editors
// ---------------------------------------------------------------------

function FieldInput({
  label, value, placeholder, onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ChipListEditor({
  label, hint, items, onChange,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (!t || items.includes(t)) return;
    onChange([...items, t]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          placeholder={hint ?? "Tekan Enter"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1 pr-1">
              {t}
              <button
                type="button"
                onClick={() => onChange(items.filter((x) => x !== t))}
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
  );
}

function MediaEditor({
  media, onChange,
}: {
  media: PortfolioMedia[];
  onChange: (next: PortfolioMedia[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleUploaded = (storageId: string, kind: PortfolioMediaKind) => {
    onChange([...media, { storageId, kind }]);
  };

  const remove = (idx: number) => {
    onChange(media.filter((_, i) => i !== idx));
  };

  const updateCaption = (idx: number, caption: string) => {
    onChange(media.map((m, i) => (i === idx ? { ...m, caption } : m)));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...media];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Unggah satu atau beberapa media. Item pertama jadi cover otomatis.
        Bisa pilih dari Library untuk media yang sudah pernah diunggah.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <FileUpload
          label=""
          accept="image/*"
          crop={{ aspect: 16 / 9 }}
          hint="Unggah baru — gambar (JPG/PNG/WebP)"
          onUploaded={(r) => handleUploaded(r.storageId, "image")}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setPickerOpen(true)}
          className="h-full min-h-[120px] flex-col gap-2"
        >
          <Upload className="h-5 w-5" />
          <span className="text-sm">Pilih dari Library</span>
          <span className="text-xs text-muted-foreground">Reuse media yang sudah diunggah</span>
        </Button>
      </div>

      {media.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Belum ada media. Tambahkan minimal satu untuk cover yang menarik.
        </p>
      ) : (
        <ul className="space-y-2">
          {media.map((m, idx) => (
            <li
              key={`${m.storageId}-${idx}`}
              className="flex items-start gap-3 rounded-md border border-border p-2"
            >
              <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded bg-muted">
                {m.url && m.kind === "image" ? (
                  <Image
                    src={m.url}
                    alt={m.caption ?? ""}
                    fill
                    unoptimized
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    {m.kind}
                  </div>
                )}
                {idx === 0 && (
                  <span className="absolute bottom-0 right-0 rounded-tl bg-brand px-1 text-[9px] font-bold text-brand-foreground">
                    COVER
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Caption (opsional)"
                  value={m.caption ?? ""}
                  onChange={(e) => updateCaption(idx, e.target.value)}
                  className="h-8 text-xs"
                />
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="h-7 px-2 text-xs"
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => move(idx, 1)}
                    disabled={idx === media.length - 1}
                    className="h-7 px-2 text-xs"
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(idx)}
                    className="h-7 px-2 text-xs text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <LibraryPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        accept="image"
        onPick={(file) => {
          handleUploaded(file.storageId, "image");
          setPickerOpen(false);
        }}
      />
    </div>
  );
}

function LinksEditor({
  links, onChange,
}: {
  links: PortfolioLink[];
  onChange: (next: PortfolioLink[]) => void;
}) {
  const [draft, setDraft] = useState<PortfolioLink>({ url: "", label: "", kind: "live" });

  const add = () => {
    const url = draft.url.trim();
    const label = draft.label.trim();
    if (!url || !label) {
      notify.validation("URL dan label wajib diisi");
      return;
    }
    onChange([...links, { url, label, kind: draft.kind }]);
    setDraft({ url: "", label: "", kind: draft.kind });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Tambahkan link yang relevan: live demo, repo, case study, slides, video, dll.
      </p>

      {links.length > 0 && (
        <ul className="space-y-2">
          {links.map((l, idx) => (
            <li
              key={`${l.url}-${idx}`}
              className="flex items-center gap-2 rounded-md border border-border p-2"
            >
              <Badge variant="secondary" className="text-[10px] uppercase">
                {LINK_KIND_LABELS[l.kind as PortfolioLinkKind] ?? l.kind}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{l.label}</p>
                <p className="truncate text-xs text-muted-foreground">{l.url}</p>
              </div>
              <a href={l.url} target="_blank" rel="noopener noreferrer" aria-label="Buka">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                onClick={() => onChange(links.filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 rounded-md border border-dashed border-border p-3">
        <div className="grid grid-cols-3 gap-2">
          <ResponsiveSelect
            value={draft.kind}
            onValueChange={(v) => setDraft((d) => ({ ...d, kind: v as PortfolioLinkKind }))}
          >
            <ResponsiveSelectTrigger placeholder="Tipe" />
            <ResponsiveSelectContent>
              {(Object.keys(LINK_KIND_LABELS) as PortfolioLinkKind[]).map((k) => (
                <ResponsiveSelectItem key={k} value={k}>
                  {LINK_KIND_LABELS[k]}
                </ResponsiveSelectItem>
              ))}
            </ResponsiveSelectContent>
          </ResponsiveSelect>
          <Input
            placeholder="Label"
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            className="col-span-2"
          />
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="https://…"
            type="url"
            value={draft.url}
            onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={add}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Cover preview — uses media[0] when available, falls back to emoji+gradient.
 */
function CoverPreview({ values }: { values: PortfolioFormValues }) {
  const first = values.media[0];
  if (first?.url && first.kind === "image") {
    return (
      <div className="relative h-28 overflow-hidden rounded-lg bg-muted">
        <Image
          src={first.url}
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
        "flex h-28 items-center justify-center rounded-lg bg-gradient-to-br",
        values.coverGradient,
      )}
    >
      <span className="text-4xl">{values.coverEmoji}</span>
    </div>
  );
}
