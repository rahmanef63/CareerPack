"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { notify } from "@/shared/lib/notify";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/shared/components/ui/responsive-dialog";

import type { PortfolioFormValues, PortfolioItem } from "../types";
import { DEFAULT_FORM } from "../constants";
import { itemToValues } from "./portfolio-form/lib";
import { BasicTab } from "./portfolio-form/BasicTab";
import { MediaEditor } from "./portfolio-form/MediaEditor";
import { LinksEditor } from "./portfolio-form/LinksEditor";
import { DetailTab } from "./portfolio-form/DetailTab";

interface PortfolioFormProps {
  trigger?: React.ReactNode;
  /** When supplied, parent controls open/close (used for edit-from-card). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mode?: "create" | "edit";
  initialItem?: PortfolioItem;
  onSubmit: (values: PortfolioFormValues) => Promise<void> | void;
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

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
            <TabsList variant="pills">
              <TabsTrigger value="basic">Dasar</TabsTrigger>
              <TabsTrigger value="media">Media{values.media.length > 0 && ` · ${values.media.length}`}</TabsTrigger>
              <TabsTrigger value="links">Tautan{values.links.length > 0 && ` · ${values.links.length}`}</TabsTrigger>
              <TabsTrigger value="detail">Detail</TabsTrigger>
            </TabsList>

            <div className="w-full">
              <TabsContent value="basic">
                <BasicTab values={values} setValues={setValues} />
              </TabsContent>

              <TabsContent value="media" className="w-full space-y-3 pt-3">
                <MediaEditor
                  media={values.media}
                  onChange={(media) => setValues((v) => ({ ...v, media }))}
                />
              </TabsContent>

              <TabsContent value="links" className="w-full space-y-3 pt-3">
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

              <TabsContent value="detail">
                <DetailTab values={values} setValues={setValues} />
              </TabsContent>
            </div>
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
