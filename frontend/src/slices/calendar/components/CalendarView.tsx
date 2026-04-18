"use client";

import { useMemo, useState } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, Plus } from "lucide-react";
import { Calendar } from "@/shared/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface AgendaItem {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  title: string;
  location: string;
  type: "interview" | "deadline" | "followup";
}

const today = new Date();
function offset(days: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const MOCK_AGENDA: AgendaItem[] = [
  { id: "1", date: offset(1), time: "10:00", title: "Wawancara Tokopedia", location: "Online · Google Meet", type: "interview" },
  { id: "2", date: offset(3), time: "14:00", title: "Tenggat Lamaran Gojek", location: "Kirim via portal", type: "deadline" },
  { id: "3", date: offset(5), time: "09:30", title: "Follow-up Shopee", location: "Email rekruter", type: "followup" },
  { id: "4", date: offset(8), time: "13:00", title: "Wawancara Final Traveloka", location: "Onsite · SCBD", type: "interview" },
  { id: "5", date: offset(12), time: "16:00", title: "Tenggat Test Bukalapak", location: "Take-home", type: "deadline" },
];

const TYPE_STYLE: Record<AgendaItem["type"], { label: string; cls: string }> = {
  interview: { label: "Wawancara", cls: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" },
  deadline: { label: "Tenggat", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  followup: { label: "Follow-up", cls: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" },
};

export function CalendarView() {
  const [selected, setSelected] = useState<Date | undefined>(today);

  const datesWithEvents = useMemo(
    () => new Set(MOCK_AGENDA.map((a) => a.date)),
    []
  );

  const selectedKey = selected ? selected.toISOString().slice(0, 10) : "";
  const dayItems = useMemo(
    () => MOCK_AGENDA.filter((a) => a.date === selectedKey).sort((a, b) => a.time.localeCompare(b.time)),
    [selectedKey]
  );

  const upcoming = useMemo(
    () =>
      MOCK_AGENDA
        .filter((a) => a.date >= today.toISOString().slice(0, 10))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 6),
    []
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Kalender Karir</h1>
          <p className="text-sm text-muted-foreground">Wawancara, tenggat lamaran, dan follow-up Anda</p>
        </div>
        <Button size="sm" className="bg-career-600 hover:bg-career-700">
          <Plus className="w-4 h-4 mr-1" /> Tambah
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-career-600" /> Pilih Tanggal
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={setSelected}
              modifiers={{
                hasEvent: (date) => datesWithEvents.has(date.toISOString().slice(0, 10)),
              }}
              modifiersClassNames={{
                hasEvent: "relative font-bold text-career-700 after:absolute after:left-1/2 after:bottom-0.5 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-career-500",
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {selected
                  ? selected.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })
                  : "Pilih tanggal"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dayItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Tidak ada agenda di tanggal ini.</p>
              ) : (
                <ul className="space-y-2">
                  {dayItems.map((it) => (
                    <AgendaRow key={it.id} item={it} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Akan Datang</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {upcoming.map((it) => (
                  <AgendaRow key={it.id} item={it} compact />
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AgendaRow({ item, compact }: { item: AgendaItem; compact?: boolean }) {
  const style = TYPE_STYLE[item.type];
  return (
    <li className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
      <div className="flex flex-col items-center justify-center min-w-[44px] text-center">
        <span className="text-[10px] font-medium text-muted-foreground uppercase">
          {new Date(item.date).toLocaleDateString("id-ID", { month: "short" })}
        </span>
        <span className="text-lg font-bold text-foreground leading-none">{new Date(item.date).getDate()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm text-foreground truncate">{item.title}</p>
          <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", style.cls)}>
            {style.label}
          </Badge>
        </div>
        {!compact && (
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {item.time}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {item.location}
            </span>
          </div>
        )}
        {compact && (
          <p className="text-xs text-muted-foreground">
            {item.time} · {item.location}
          </p>
        )}
      </div>
    </li>
  );
}
