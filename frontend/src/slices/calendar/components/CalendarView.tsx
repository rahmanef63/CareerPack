"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, Plus, Trash2 } from "lucide-react";
import { id as localeID } from "react-day-picker/locale";
import { Calendar } from "@/shared/components/ui/calendar";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAgenda, type AgendaItem, type AgendaType } from "../hooks/useAgenda";

const today = new Date();
function offsetDate(days: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const TYPE_STYLE: Record<AgendaType, { label: string; cls: string }> = {
  interview: { label: "Wawancara", cls: "bg-accent text-brand dark:bg-accent dark:text-brand/80" },
  deadline: { label: "Tenggat", cls: "bg-warning/20 text-warning dark:bg-warning/20 dark:text-warning/80" },
  followup: { label: "Follow-up", cls: "bg-info/20 text-info dark:bg-info/20 dark:text-brand/80" },
};

const TYPE_OPTIONS: ReadonlyArray<{ value: AgendaType; label: string }> = [
  { value: "interview", label: "Wawancara" },
  { value: "deadline", label: "Tenggat" },
  { value: "followup", label: "Follow-up" },
];

export function CalendarView() {
  const [selected, setSelected] = useState<Date | undefined>(today);
  const [addOpen, setAddOpen] = useState(false);
  const [timeZone, setTimeZone] = useState<string | undefined>(undefined);
  const { items: agenda, isLoading, create, remove } = useAgenda();

  // Detect user's timezone kat client saja — elak hydration mismatch
  // sebab server dan client boleh beza timezone.
  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const datesWithEvents = useMemo(
    () => new Set(agenda.map((a) => a.date)),
    [agenda]
  );

  const selectedKey = selected ? selected.toISOString().slice(0, 10) : "";
  const dayItems = useMemo(
    () =>
      agenda
        .filter((a) => a.date === selectedKey)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [agenda, selectedKey]
  );

  const upcoming = useMemo(
    () =>
      agenda
        .filter((a) => a.date >= today.toISOString().slice(0, 10))
        .sort((a, b) =>
          a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)
        )
        .slice(0, 6),
    [agenda]
  );

  const handleAdd = useCallback(
    async (input: {
      title: string;
      date: string;
      time: string;
      location: string;
      type: AgendaType;
    }) => {
      try {
        await create(input);
        setSelected(new Date(input.date));
        toast.success("Agenda ditambahkan", {
          description: `${input.title} · ${input.date} ${input.time}`,
        });
      } catch (err) {
        toast.error("Gagal menambahkan agenda", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    },
    [create]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await remove(id);
        toast.success("Agenda dihapus");
      } catch (err) {
        toast.error("Gagal menghapus agenda", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    },
    [remove]
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      <ResponsivePageHeader
        title="Kalender Karir"
        description="Wawancara, tenggat lamaran, dan follow-up Anda"
        actions={
          <Button
            size="sm"
            className="bg-brand hover:bg-brand"
            onClick={() => setAddOpen(true)}
            aria-label="Tambah agenda baru"
          >
            <Plus className="w-4 h-4 mr-1" /> Tambah Agenda
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-brand" /> Pilih Tanggal
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={setSelected}
              locale={localeID}
              timeZone={timeZone}
              captionLayout="dropdown"
              className="rounded-lg border"
              modifiers={{
                hasEvent: (date) => datesWithEvents.has(date.toISOString().slice(0, 10)),
              }}
              modifiersClassNames={{
                hasEvent:
                  "relative font-bold text-brand after:absolute after:left-1/2 after:bottom-0.5 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-brand",
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2 flex-row justify-between items-center space-y-0">
              <CardTitle className="text-base">
                {selected
                  ? selected.toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })
                  : "Pilih tanggal"}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAddOpen(true)}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" /> Tambah Agenda
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : dayItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Tidak ada agenda di tanggal ini.
                </p>
              ) : (
                <ul className="space-y-2">
                  {dayItems.map((it) => (
                    <AgendaRow key={it.id} item={it} onDelete={handleDelete} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Akan Datang</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-14 w-full" />
              ) : upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Belum ada agenda mendatang.
                </p>
              ) : (
                <ul className="space-y-2">
                  {upcoming.map((it) => (
                    <AgendaRow key={it.id} item={it} compact onDelete={handleDelete} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddAgendaDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultDate={selectedKey || offsetDate(0)}
        onAdd={handleAdd}
      />
    </div>
  );
}

interface AgendaRowProps {
  item: AgendaItem;
  compact?: boolean;
  onDelete: (id: string) => void;
}

function AgendaRow({ item, compact, onDelete }: AgendaRowProps) {
  const style = TYPE_STYLE[item.type];
  return (
    <li className="group flex items-start gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
      <div className="flex flex-col items-center justify-center min-w-[44px] text-center">
        <span className="text-[10px] font-medium text-muted-foreground uppercase">
          {new Date(item.date).toLocaleDateString("id-ID", { month: "short" })}
        </span>
        <span className="text-lg font-bold text-foreground leading-none">
          {new Date(item.date).getDate()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm text-foreground truncate">{item.title}</p>
          <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", style.cls)}>
            {style.label}
          </Badge>
        </div>
        {compact ? (
          <p className="text-xs text-muted-foreground">
            {item.time} · {item.location}
          </p>
        ) : (
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {item.time}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {item.location}
            </span>
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(item.id)}
        className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 h-7 w-7 text-muted-foreground hover:text-destructive"
        aria-label={`Hapus agenda ${item.title}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </li>
  );
}

interface AddAgendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: string;
  onAdd: (input: {
    title: string;
    date: string;
    time: string;
    location: string;
    type: AgendaType;
  }) => Promise<void>;
}

function AddAgendaDialog({ open, onOpenChange, defaultDate, onAdd }: AddAgendaDialogProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("09:00");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<AgendaType>("interview");

  const reset = () => {
    setTitle("");
    setDate(defaultDate);
    setTime("09:00");
    setLocation("");
    setType("interview");
  };

  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSubmitting(true);
    try {
      await onAdd({
        title: title.trim(),
        date,
        time,
        location: location.trim() || "—",
        type,
      });
      reset();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Tambah Agenda</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Catat wawancara, tenggat lamaran, atau follow-up.
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
            <Select
              value={type}
              onValueChange={(v) => setType(v as AgendaType)}
            >
              <SelectTrigger id="agenda-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <ResponsiveDialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting} className="bg-brand hover:bg-brand">
              Tambah Agenda
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
