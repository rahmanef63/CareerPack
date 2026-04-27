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
import { PageContainer } from "@/shared/components/layout/PageContainer";
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
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { notify } from "@/shared/lib/notify";
import { formatMonthShort, formatWeekdayLong } from "@/shared/lib/formatDate";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAgenda, type AgendaItem, type AgendaType } from "@/shared/hooks/useAgenda";
import { AGENDA_TYPE_STYLES } from "@/shared/lib/agendaStyles";

// Derived from the SSoT in shared/lib/agendaStyles.ts — adding a new
// agenda type there auto-propagates to the TypeSelect below + every
// badge consumer.
const TYPE_STYLE = AGENDA_TYPE_STYLES;
const TYPE_OPTIONS: ReadonlyArray<{ value: AgendaType; label: string }> = (
  Object.entries(AGENDA_TYPE_STYLES) as Array<
    [AgendaType, { label: string; cls: string }]
  >
).map(([value, { label }]) => ({ value, label }));

export function CalendarView() {
  const [selected, setSelected] = useState<Date | undefined>(undefined);
  const [todayKey, setTodayKey] = useState<string>("");
  const [addOpen, setAddOpen] = useState(false);
  const [timeZone, setTimeZone] = useState<string | undefined>(undefined);
  const { items: agenda, isLoading, create, remove } = useAgenda();

  // Today + timezone resolved on client only — module-level `new Date()`
  // would diverge between SSR build time and client runtime, causing
  // hydration mismatches that re-render the whole calendar (visible as
  // a layout flash when data is present).
  useEffect(() => {
    const now = new Date();
    setSelected(now);
    setTodayKey(now.toISOString().slice(0, 10));
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
      todayKey
        ? agenda
            .filter((a) => a.date >= todayKey)
            .sort((a, b) =>
              a.date === b.date
                ? a.time.localeCompare(b.time)
                : a.date.localeCompare(b.date),
            )
            .slice(0, 6)
        : [],
    [agenda, todayKey],
  );

  const offsetDate = useCallback(
    (days: number): string => {
      const base = todayKey ? new Date(todayKey) : new Date();
      base.setDate(base.getDate() + days);
      return base.toISOString().slice(0, 10);
    },
    [todayKey],
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
        notify.success("Agenda ditambahkan", {
          description: `${input.title} · ${input.date} ${input.time}`,
        });
      } catch (err) {
        notify.fromError(err, "Gagal menambahkan agenda");
      }
    },
    [create]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await remove(id);
        notify.success("Agenda dihapus");
      } catch (err) {
        notify.fromError(err, "Gagal menghapus agenda");
      }
    },
    [remove]
  );

  return (
    <PageContainer size="lg" className="space-y-6">
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

      {/* `items-start` keeps the calendar card from stretching to match
          the right column when it grows tall with many items —
          previously the calendar widget sat in a much taller card with
          empty whitespace below, which read as a "broken" container. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
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
                {selected ? formatWeekdayLong(selected) : "Pilih tanggal"}
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
    </PageContainer>
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
          {formatMonthShort(item.date)}
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
          <p className="text-xs text-muted-foreground truncate">
            {item.time} · {item.location}
          </p>
        ) : (
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground min-w-0">
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" /> {item.time}
            </span>
            <span className="flex items-center gap-1 min-w-0">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{item.location}</span>
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

  // Resync `date` whenever the dialog (re)opens with a new defaultDate.
  // Without this, picking a new calendar day → opening the dialog →
  // canceling → picking another day → reopening would still show the
  // first day because useState only seeds once.
  useEffect(() => {
    if (open) setDate(defaultDate);
  }, [open, defaultDate]);

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
