"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon, Download, Plus } from "lucide-react";
import { id as localeID } from "react-day-picker/locale";

import { UltimateCalendar, type MarkedDate } from "@/shared/components/ui/ultimate-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@/shared/components/ui/responsive-alert-dialog";
import { notify } from "@/shared/lib/notify";
import { formatWeekdayLong } from "@/shared/lib/formatDate";
import { useAgenda, type AgendaItem } from "@/shared/hooks/useAgenda";

import { downloadIcs, eventsToIcs } from "../lib/ics";
import { localDateKey, parseDateKey, startOfMonth } from "../lib/dateKeys";
import type { FilterType } from "../constants/agendaTypes";
import { AgendaRow } from "./AgendaRow";
import { FilterChips } from "./FilterChips";
import { MonthGrid } from "./MonthGrid";
import { AgendaFormDialog, type AgendaFormInput } from "./AgendaFormDialog";

/**
 * Kalender Karir.
 *
 * Two shapes, one data set:
 * - `< lg` — compact month picker + the selected day's agenda + what's next.
 *   Right for a phone, where a grid of event chips would be unreadable.
 * - `≥ lg` — a real month grid with the events drawn inside the day cells,
 *   plus the same day/upcoming rail beside it. The point of a calendar is
 *   seeing the month's commitments without clicking each date.
 *
 * Both read `useAgenda()` — the slice makes no extra query for the grid.
 */
export function CalendarView() {
  const [selected, setSelected] = useState<Date | undefined>(undefined);
  const [visibleMonth, setVisibleMonth] = useState<Date | undefined>(undefined);
  const [todayKey, setTodayKey] = useState<string>("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AgendaItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AgendaItem | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [timeZone, setTimeZone] = useState<string | undefined>(undefined);
  const { items: agenda, isLoading, create, update, remove } = useAgenda();

  useEffect(() => {
    const now = new Date();
    setSelected(now);
    setVisibleMonth(startOfMonth(now));
    // Local calendar date, not UTC. `toISOString()` rolled back a day for
    // every WIB user between 00:00 and 07:00, so "Jadwal Hari Ini" and the
    // "Hari ini" button showed yesterday for the first seven hours.
    setTodayKey(localDateKey(now));
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? agenda : agenda.filter((a) => a.type === filter)),
    [agenda, filter],
  );

  /** date key → that day's events, sorted by time. Feeds the month grid,
   *  the day panel and the picker's dots — one pass, one shape. */
  const eventsByDate = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const item of filtered) {
      const bucket = map.get(item.date);
      if (bucket) bucket.push(item);
      else map.set(item.date, [item]);
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [filtered]);

  // Marked-date dots for the compact picker — one per date that has at
  // least one event after filtering.
  const markedDates = useMemo<MarkedDate[]>(
    () =>
      Array.from(eventsByDate.entries()).map(([key, items]) => ({
        date: parseDateKey(key),
        dot: true,
        color: "after:bg-brand",
        label: items[0]?.title,
      })),
    [eventsByDate],
  );

  // Pre-aggregate type counts for filter chip badges.
  const typeCounts = useMemo(() => {
    const m = new Map<FilterType, number>();
    m.set("all", agenda.length);
    for (const a of agenda) m.set(a.type, (m.get(a.type) ?? 0) + 1);
    return m;
  }, [agenda]);

  const selectedKey = selected ? localDateKey(selected) : "";
  const dayItems = eventsByDate.get(selectedKey) ?? [];

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

  const selectDate = useCallback((date: Date) => {
    setSelected(date);
    setVisibleMonth(startOfMonth(date));
  }, []);

  const selectDateKey = useCallback(
    (key: string) => selectDate(parseDateKey(key)),
    [selectDate],
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const openCreateAt = useCallback(
    (key: string) => {
      selectDateKey(key);
      setEditing(null);
      setFormOpen(true);
    },
    [selectDateKey],
  );

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
          selectDateKey(input.date);
          notify.success("Agenda ditambahkan", {
            description: `${input.title} · ${input.date} ${input.time}`,
          });
        }
      } catch (err) {
        notify.fromError(err, editing ? "Gagal memperbarui" : "Gagal menambahkan");
        // Rethrow so AgendaFormDialog's handleSubmit sees the rejection and
        // skips closing the dialog — otherwise a failed save looked
        // identical to a successful one and the typed data was lost.
        throw err;
      }
    },
    [create, update, editing, selectDateKey],
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

  const requestDelete = useCallback((item: AgendaItem) => {
    setPendingDelete(item);
  }, []);

  const goToToday = useCallback(() => {
    if (todayKey) selectDateKey(todayKey);
  }, [todayKey, selectDateKey]);

  return (
    <PageContainer size="xl" className="space-y-6">
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
                  `careerpack-agenda-${localDateKey(new Date())}.ics`,
                  eventsToIcs(agenda),
                );
              }}
              disabled={isLoading || agenda.length === 0}
              aria-label="Ekspor agenda ke file ICS"
            >
              <Download className="mr-1 h-4 w-4" /> Ekspor .ics
            </Button>
            <Button
              size="sm"
              className="bg-brand hover:bg-brand"
              onClick={openCreate}
              aria-label="Tambah agenda baru"
            >
              <Plus className="mr-1 h-4 w-4" /> Tambah Agenda
            </Button>
          </div>
        }
      />

      <FilterChips filter={filter} setFilter={setFilter} counts={typeCounts} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0">
          {/* Desktop — the month itself, events drawn in the day cells. */}
          <Card className="hidden lg:block">
            <CardContent className="p-4 pt-4">
              {visibleMonth ? (
                <MonthGrid
                  month={visibleMonth}
                  todayKey={todayKey}
                  selectedKey={selectedKey}
                  eventsByDate={eventsByDate}
                  onMonthChange={setVisibleMonth}
                  onSelectDate={selectDateKey}
                  onOpenEvent={openEdit}
                  onAddAt={openCreateAt}
                />
              ) : (
                <Skeleton className="h-[32rem] w-full" />
              )}
            </CardContent>
          </Card>

          {/* Mobile — compact picker; the agenda list below carries detail. */}
          <Card className="lg:hidden">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle as="h2" className="flex items-center gap-2 text-base">
                <CalendarIcon className="h-4 w-4 text-brand" /> Pilih Tanggal
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
            <CardContent className="p-3 pt-0">
              <UltimateCalendar
                mode="single"
                selected={selected}
                onSelect={(d) => d && selectDate(d)}
                month={visibleMonth}
                onMonthChange={setVisibleMonth}
                locale={localeID}
                timeZone={timeZone}
                captionLayout="dropdown"
                accent="primary"
                size="lg"
                highlightToday
                // `size="lg"` sets `--cell-size` on UltimateCalendar's
                // wrapper, but the DayPicker root re-declares it, so the
                // inner value always won and cells stayed 32 px. Setting it
                // through `className` lands on the same element, where
                // tailwind-merge picks the last one — 40 px touch targets.
                className="[--cell-size:2.5rem]"
                wrapperClassName="mx-auto w-fit max-w-full"
                markedDates={markedDates}
                modifiers={{
                  hasEvent: (date) => eventsByDate.has(localDateKey(date)),
                }}
                modifiersClassNames={{
                  hasEvent: "font-bold text-brand",
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle as="h2" className="text-base">
                {selected ? formatWeekdayLong(selected) : "Pilih tanggal"}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={openCreate}
                className="text-xs"
              >
                <Plus className="mr-1 h-3 w-3" /> Tambah
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : dayItems.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">
                  Tidak ada agenda di tanggal ini.
                </p>
              ) : (
                <ul className="space-y-2">
                  {dayItems.map((it) => (
                    <AgendaRow
                      key={it.id}
                      item={it}
                      onEdit={openEdit}
                      onDelete={requestDelete}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle as="h2" className="text-base">
                Akan Datang
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-14 w-full" />
              ) : upcoming.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">
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
                      onDelete={requestDelete}
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
        defaultDate={selectedKey || todayKey}
        initial={editing}
        onSubmit={handleSubmit}
      />

      <ResponsiveAlertDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>Hapus agenda ini?</ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              {pendingDelete
                ? `"${pendingDelete.title}" akan dihapus, termasuk pengingatnya. Tindakan ini tidak bisa dibatalkan.`
                : ""}
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Batal</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                const target = pendingDelete;
                setPendingDelete(null);
                if (target) void handleDelete(target.id);
              }}
            >
              Hapus
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </PageContainer>
  );
}
