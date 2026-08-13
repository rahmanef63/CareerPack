"use client";

import { useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import type { AgendaItem, AgendaType } from "@/shared/hooks/useAgenda";
import { TYPE_OPTIONS } from "../constants/agendaTypes";

export interface AgendaFormInput {
  title: string;
  date: string;
  time: string;
  location: string;
  type: AgendaType;
  notes?: string;
  reminderMinutes?: number;
}

export interface AgendaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: string;
  initial: AgendaItem | null;
  onSubmit: (input: AgendaFormInput) => Promise<void>;
}

const REMINDER_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
  minutes?: number;
}> = [
  { value: "none", label: "Tanpa pengingat" },
  { value: "15", label: "15 menit sebelum", minutes: 15 },
  { value: "60", label: "1 jam sebelum", minutes: 60 },
  { value: "1440", label: "1 hari sebelum", minutes: 1440 },
];

function reminderToOption(m?: number): string {
  if (!m) return "none";
  if (m === 15 || m === 60 || m === 1440) return String(m);
  return "none";
}

export function AgendaFormDialog({
  open,
  onOpenChange,
  defaultDate,
  initial,
  onSubmit,
}: AgendaFormDialogProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("09:00");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<AgendaType>("interview");
  const [notes, setNotes] = useState("");
  const [reminder, setReminder] = useState<string>("none");
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(initial);

  // Reseed form whenever the dialog opens — for create we use defaults,
  // for edit we hydrate from `initial`.
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setTitle(initial.title);
      setDate(initial.date);
      setTime(initial.time);
      setLocation(initial.location === "—" ? "" : initial.location);
      setType(initial.type);
      setNotes(initial.notes ?? "");
      setReminder(reminderToOption(initial.reminderMinutes));
    } else {
      setTitle("");
      setDate(defaultDate);
      setTime("09:00");
      setLocation("");
      setType("interview");
      setNotes("");
      setReminder("none");
    }
  }, [open, initial, defaultDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSubmitting(true);
    try {
      const reminderMinutes = REMINDER_OPTIONS.find(
        (o) => o.value === reminder,
      )?.minutes;
      await onSubmit({
        title: title.trim(),
        date,
        time,
        location: location.trim() || "—",
        type,
        // Send the cleared values explicitly. `undefined` means "field
        // omitted, leave unchanged" to the update mutation, so picking
        // "Tanpa pengingat" or emptying the notes saved successfully and
        // changed nothing — the old reminder kept firing.
        notes: notes.trim(),
        reminderMinutes: reminderMinutes ?? 0,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {isEdit ? "Edit Agenda" : "Tambah Agenda"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {isEdit
              ? "Perbarui detail wawancara, tenggat, atau follow-up."
              : "Catat wawancara, tenggat lamaran, atau follow-up."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agenda-title">Judul</Label>
            <Input
              id="agenda-title"
              placeholder="cth. Wawancara HR Tokopedia"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="agenda-date">Tanggal</Label>
              <DatePicker
                id="agenda-date"
                value={date}
                onChange={setDate}
                placeholder="Pilih tanggal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agenda-time">Waktu</Label>
              <Input
                id="agenda-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agenda-type">Jenis</Label>
            <ResponsiveSelect
              value={type}
              onValueChange={(v) => setType(v as AgendaType)}
            >
              <ResponsiveSelectTrigger id="agenda-type" />
              <ResponsiveSelectContent drawerTitle="Jenis agenda">
                {TYPE_OPTIONS.map((opt) => (
                  <ResponsiveSelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </ResponsiveSelectItem>
                ))}
              </ResponsiveSelectContent>
            </ResponsiveSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agenda-location">Lokasi / Platform</Label>
            <Input
              id="agenda-location"
              placeholder="cth. Online · Google Meet, atau Onsite · SCBD"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agenda-notes">Catatan</Label>
            <Textarea
              id="agenda-notes"
              placeholder="Detail tambahan, link join, kontak HR..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agenda-reminder">Pengingat</Label>
            <ResponsiveSelect value={reminder} onValueChange={setReminder}>
              <ResponsiveSelectTrigger id="agenda-reminder" />
              <ResponsiveSelectContent drawerTitle="Pengingat">
                {REMINDER_OPTIONS.map((opt) => (
                  <ResponsiveSelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </ResponsiveSelectItem>
                ))}
              </ResponsiveSelectContent>
            </ResponsiveSelect>
          </div>
          <ResponsiveDialogFooter>
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
              {isEdit ? "Simpan Perubahan" : "Tambah Agenda"}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
