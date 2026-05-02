"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Download,
  MapPin,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
} from "lucide-react";
import { downloadIcs, eventsToIcs } from "../lib/ics";
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
import { notify } from "@/shared/lib/notify";
import { formatMonthShort, formatWeekdayLong } from "@/shared/lib/formatDate";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAgenda, type AgendaItem, type AgendaType } from "@/shared/hooks/useAgenda";
import { getAgendaStyle, AGENDA_TYPE_STYLES } from "@/shared/lib/agendaStyles";

const TYPE_OPTIONS: ReadonlyArray<{ value: AgendaType; label: string }> = (
  Object.entries(AGENDA_TYPE_STYLES) as Array<
    [AgendaType, { label: string; cls: string }]
  >
).map(([value, { label }]) => ({ value, label }));

type FilterType = AgendaType | "all";

export function CalendarView() {
  const [selected, setSelected] = useState<Date | undefined>(undefined);
  const [todayKey, setTodayKey] = useState<string>("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AgendaItem | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [timeZone, setTimeZone] = useState<string | undefined>(undefined);
  const { items: agenda, isLoading, create, update, remove } = useAgenda();

  useEffect(() => {
    const now = new Date();
    setSelected(now);
    setTodayKey(now.toISOString().slice(0, 10));
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? agenda : agenda.filter((a) => a.type === filter)),
    [agenda, filter],
  );

  const datesWithEvents = useMemo(
    () => new Set(filtered.map((a) => a.date)),
    [filtered],
  );

  // Pre-aggregate type counts for filter chip badges.
  const typeCounts = useMemo(() => {
    const m = new Map<FilterType, number>();
    m.set("all", agenda.length);
    for (const a of agenda) m.set(a.type, (m.get(a.type) ?? 0) + 1);
    return m;
  }, [agenda]);

  const selectedKey = selected ? selected.toISOString().slice(0, 10) : "";
  const dayItems = useMemo(
    () =>
      filtered
        .filter((a) => a.date === selectedKey)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [filtered, selectedKey],
  );

  const upcoming = useMemo(
    () =>
      todayKey
        ? filtered
            .filter((a) => a.date >= todayKey)
            .sort((a, b) =>
              a.date === b.date
                ? a.time.localeCompare(b.time)
                : a.date.localeCompare(b.date),
            )
            .slice(0, 6)
        : [],
    [filtered, todayKey],
  );

  const offsetDate = useCallback(
    (days: number): string => {
      const base = todayKey ? new Date(todayKey) : new Date();
      base.setDate(base.getDate() + days);
      return base.toISOString().slice(0, 10);
    },
    [todayKey],
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((it: AgendaItem) => {
    setEditing(it);
    setFormOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (input: AgendaFormInput) => {
      try {
        if (editing) {
          await update(editing.id, input);
          notify.success("Agenda diperbarui");
        } else {
          await create(input);
          setSelected(new Date(input.date));
          notify.success("Agenda ditambahkan", {
            description: `${input.title} · ${input.date} ${input.time}`,
          });
        }
      } catch (err) {
        notify.fromError(err, editing ? "Gagal memperbarui" : "Gagal menambahkan");
      }
    },
    [create, update, editing],
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
    [remove],
  );

  const goToToday = useCallback(() => {
    if (!todayKey) return;
    setSelected(new Date(todayKey));
  }, [todayKey]);

  return (
    <PageContainer size="lg" className="space-y-6">
      <ResponsivePageHeader
        title="Kalender Karir"
        description="Wawancara, tenggat lamaran, dan follow-up Anda"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!agenda.length) {
                  notify.info("Belum ada agenda untuk diekspor");
                  return;
                }
                downloadIcs(
                  `careerpack-agenda-${new Date().toISOString().slice(0, 10)}.ics`,
                  eventsToIcs(agenda),
                );
              }}
              disabled={isLoading || agenda.length === 0}
              aria-label="Ekspor agenda ke file ICS"
            >
              <Download className="w-4 h-4 mr-1" /> Ekspor .ics
            </Button>
            <Button
              size="sm"
              className="bg-brand hover:bg-brand"
              onClick={openCreate}
              aria-label="Tambah agenda baru"
            >
              <Plus className="w-4 h-4 mr-1" /> Tambah Agenda
            </Button>
          </div>
        }
      />

      <FilterChips filter={filter} setFilter={setFilter} counts={typeCounts} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-brand" /> Pilih Tanggal
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              disabled={!todayKey || selectedKey === todayKey}
              className="text-xs"
            >
              Hari ini
            </Button>
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
                hasEvent: (date) =>
                  datesWithEvents.has(date.toISOString().slice(0, 10)),
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
                onClick={openCreate}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" /> Tambah
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
                    <AgendaRow
                      key={it.id}
                      item={it}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
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
                    <AgendaRow
                      key={it.id}
                      item={it}
                      compact
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AgendaFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        defaultDate={selectedKey || offsetDate(0)}
        initial={editing}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  );
}

interface FilterChipsProps {
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  counts: Map<FilterType, number>;
}

function FilterChips({ filter, setFilter, counts }: FilterChipsProps) {
  const chips: ReadonlyArray<{ key: FilterType; label: string }> = [
    { key: "all", label: "Semua" },
    ...TYPE_OPTIONS.map((o) => ({ key: o.value as FilterType, label: o.label })),
  ];
  return (
    <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((c) => {
        const active = c.key === filter;
        const n = counts.get(c.key) ?? 0;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => setFilter(c.key)}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-brand bg-brand text-white"
                : "border-border bg-card hover:bg-muted",
            )}
          >
            {c.label}
            {n > 0 ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] tabular-nums",
                  active ? "bg-white/25" : "bg-muted-foreground/15",
                )}
              >
                {n}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

interface AgendaRowProps {
  item: AgendaItem;
  compact?: boolean;
  onEdit: (item: AgendaItem) => void;
  onDelete: (id: string) => void;
}

function AgendaRow({ item, compact, onEdit, onDelete }: AgendaRowProps) {
  const style = getAgendaStyle(item.type);
  return (
    <li className="group flex items-start gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
      <button
        type="button"
        onClick={() => onEdit(item)}
        className="flex flex-col items-center justify-center min-w-[44px] text-center hover:opacity-80"
        aria-label={`Edit ${item.title}`}
      >
        <span className="text-[10px] font-medium text-muted-foreground uppercase">
          {formatMonthShort(item.date)}
        </span>
        <span className="text-lg font-bold text-foreground leading-none">
          {new Date(item.date).getDate()}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onEdit(item)}
        className="flex-1 min-w-0 text-left"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm text-foreground truncate">
            {item.title}
          </p>
          <Badge
            variant="secondary"
            className={cn("text-[10px] px-1.5 py-0", style.cls)}
          >
            {style.label}
          </Badge>
          {item.reminderMinutes ? (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {formatReminder(item.reminderMinutes)}
            </Badge>
          ) : null}
        </div>
        {compact ? (
          <p className="text-xs text-muted-foreground truncate">
            {item.time} · {item.location}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground min-w-0">
              <span className="flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" /> {item.time}
              </span>
              <span className="flex items-center gap-1 min-w-0">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{item.location}</span>
              </span>
            </div>
            {item.notes ? (
              <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground line-clamp-2">
                <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />
                <span>{item.notes}</span>
              </p>
            ) : null}
          </>
        )}
      </button>
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(item)}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label={`Edit agenda ${item.title}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(item.id)}
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          aria-label={`Hapus agenda ${item.title}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </li>
  );
}

function formatReminder(min: number): string {
  if (min >= 1440) return `${Math.round(min / 1440)}h sblm`;
  if (min >= 60) return `${Math.round(min / 60)}j sblm`;
  return `${min}m sblm`;
}

interface AgendaFormInput {
  title: string;
  date: string;
  time: string;
  location: string;
  type: AgendaType;
  notes?: string;
  reminderMinutes?: number;
}

interface AgendaFormDialogProps {
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

function AgendaFormDialog({
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
        notes: notes.trim() || undefined,
        reminderMinutes,
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
