"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
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

import type { ContactFormValues } from "../types";
import { AVATAR_HUES, DEFAULT_FORM, ROLE_LABELS } from "../constants";

interface ContactFormProps {
  trigger: React.ReactNode;
  onSubmit: (values: ContactFormValues) => Promise<void> | void;
}

export function ContactForm({ trigger, onSubmit }: ContactFormProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ContactFormValues>(DEFAULT_FORM);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }
    setBusy(true);
    try {
      await onSubmit(values);
      toast.success("Kontak tersimpan");
      setOpen(false);
      setValues(DEFAULT_FORM);
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
          <ResponsiveDialogTitle>Tambah Kontak</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Simpan info rekruter, mentor, atau rekan profesional.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              placeholder="Nama lengkap"
              value={values.name}
              onChange={(e) =>
                setValues((v) => ({ ...v, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipe</Label>
              <ResponsiveSelect
                value={values.role}
                onValueChange={(v) =>
                  setValues((prev) => ({
                    ...prev,
                    role: v as ContactFormValues["role"],
                  }))
                }
              >
                <ResponsiveSelectTrigger placeholder="Pilih tipe" />
                <ResponsiveSelectContent drawerTitle="Tipe kontak">
                  {(Object.keys(ROLE_LABELS) as ContactFormValues["role"][]).map(
                    (k) => (
                      <ResponsiveSelectItem key={k} value={k}>
                        {ROLE_LABELS[k]}
                      </ResponsiveSelectItem>
                    ),
                  )}
                </ResponsiveSelectContent>
              </ResponsiveSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Perusahaan</Label>
              <Input
                id="company"
                placeholder="(opsional)"
                value={values.company}
                onChange={(e) =>
                  setValues((v) => ({ ...v, company: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Posisi</Label>
            <Input
              id="position"
              placeholder="Senior Recruiter, Staff Engineer, dst."
              value={values.position}
              onChange={(e) =>
                setValues((v) => ({ ...v, position: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={values.email}
                onChange={(e) =>
                  setValues((v) => ({ ...v, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+62…"
                value={values.phone}
                onChange={(e) =>
                  setValues((v) => ({ ...v, phone: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              type="url"
              placeholder="https://linkedin.com/in/…"
              value={values.linkedinUrl}
              onChange={(e) =>
                setValues((v) => ({ ...v, linkedinUrl: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Warna avatar</Label>
            <div className="flex flex-wrap gap-1.5">
              {AVATAR_HUES.map((h) => (
                <button
                  key={h.value}
                  type="button"
                  onClick={() =>
                    setValues((v) => ({ ...v, avatarHue: h.value }))
                  }
                  aria-label={h.label}
                  className={cn(
                    "h-8 w-8 rounded-full bg-gradient-to-br ring-2 transition-all",
                    h.value,
                    values.avatarHue === h.value
                      ? "ring-foreground"
                      : "ring-transparent hover:ring-border",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Konteks perkenalan, follow-up, dll."
              value={values.notes}
              onChange={(e) =>
                setValues((v) => ({ ...v, notes: e.target.value }))
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm">Favorit</Label>
              <p className="text-xs text-muted-foreground">
                Muncul di carousel atas
              </p>
            </div>
            <Switch
              checked={values.favorite}
              onCheckedChange={(c) =>
                setValues((v) => ({ ...v, favorite: c }))
              }
            />
          </div>

          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setValues(DEFAULT_FORM);
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
