"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogFooter as DialogFooter,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
} from "@/shared/components/ui/responsive-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: {
    company: string;
    position: string;
    location?: string;
    salary?: string;
    notes?: string;
    source?: string;
  }) => Promise<void>;
}

export function AddApplicationDialog({ open, onOpenChange, onCreate }: Props) {
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setCompany("");
    setPosition("");
    setLocation("");
    setSalary("");
    setSource("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !position.trim()) return;
    setSubmitting(true);
    try {
      await onCreate({
        company: company.trim(),
        position: position.trim(),
        location: location.trim() || undefined,
        salary: salary.trim() || undefined,
        source: source.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Lamaran Baru</DialogTitle>
          <DialogDescription>
            Catat detail lamaran agar mudah ditelusuri saat follow-up.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="app-company">Nama Perusahaan *</Label>
              <Input
                id="app-company"
                placeholder="cth. Tokopedia"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-position">Posisi *</Label>
              <Input
                id="app-position"
                placeholder="cth. Software Engineer"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="app-location">Lokasi</Label>
              <Input
                id="app-location"
                placeholder="cth. Jakarta / Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-salary">Ekspektasi Gaji</Label>
              <Input
                id="app-salary"
                placeholder="cth. Rp 12–18 juta"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-source">Sumber Lowongan</Label>
            <ResponsiveSelect value={source ?? ""} onValueChange={setSource}>
              <ResponsiveSelectTrigger id="app-source" placeholder="Pilih sumber" />
              <ResponsiveSelectContent drawerTitle="Sumber lowongan">
                <ResponsiveSelectItem value="Website perusahaan">
                  Website perusahaan
                </ResponsiveSelectItem>
                <ResponsiveSelectItem value="LinkedIn">LinkedIn</ResponsiveSelectItem>
                <ResponsiveSelectItem value="JobStreet">JobStreet</ResponsiveSelectItem>
                <ResponsiveSelectItem value="Glints">Glints</ResponsiveSelectItem>
                <ResponsiveSelectItem value="Referensi">
                  Referensi teman / mentor
                </ResponsiveSelectItem>
                <ResponsiveSelectItem value="Kalibrr">Kalibrr</ResponsiveSelectItem>
                <ResponsiveSelectItem value="Lainnya">Lainnya</ResponsiveSelectItem>
              </ResponsiveSelectContent>
            </ResponsiveSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-notes">Catatan</Label>
            <Textarea
              id="app-notes"
              placeholder="cth. referensi dari Pak Andi, deadline 30 April"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-brand hover:bg-brand"
            >
              {submitting ? "Menyimpan…" : "Tambah Lamaran"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
