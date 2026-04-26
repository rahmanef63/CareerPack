"use client";

import Link from "next/link";
import { Calendar as CalendarIcon, ChevronRight, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAgenda, type AgendaType } from "@/shared/hooks/useAgenda";
import { cn } from "@/shared/lib/utils";
import {
  AGENDA_TYPE_STYLES,
  AGENDA_TYPE_FALLBACK,
} from "@/shared/lib/agendaStyles";

/**
 * Right-rail widget — shows today's agenda items. Reads `useAgenda` which
 * is already Convex-backed. Empty state links to the full calendar.
 *
 * Designed to be dropped into any dashboard's right rail via
 * <DashboardTwoCol rail={<ScheduleCard />}>. Self-contained; does not
 * assume a specific slice context. Type labels + badge styling come
 * from the shared AGENDA_TYPE_STYLES SSoT.
 */

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ScheduleCard() {
  const { items, isLoading } = useAgenda();
  const key = todayKey();
  const todays = (items ?? [])
    .filter((it) => it.date === key)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-brand" />
          Jadwal Hari Ini
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        ) : todays.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            Tidak ada agenda hari ini. Nikmati harimu — atau tambahkan
            tenggat baru untuk tetap on-track.
          </p>
        ) : (
          <ul className="space-y-2">
            {todays.slice(0, 4).map((it) => {
              const typeStyle =
                AGENDA_TYPE_STYLES[it.type as AgendaType] ?? AGENDA_TYPE_FALLBACK;
              return (
                <li
                  key={it.id}
                  className="flex items-start gap-2 text-xs"
                >
                  <div className="flex items-center gap-1 text-muted-foreground tabular-nums pt-0.5">
                    <Clock className="h-3 w-3" aria-hidden />
                    {it.time}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {it.title}
                    </p>
                    <Badge
                      variant="secondary"
                      className={cn("mt-0.5 text-[10px]", typeStyle.cls)}
                    >
                      {typeStyle.label}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          href="/dashboard/calendar"
          className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
        >
          Lihat kalender lengkap
          <ChevronRight className="h-3 w-3" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}
