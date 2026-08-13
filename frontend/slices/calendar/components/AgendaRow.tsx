"use client";

import { Clock, MapPin, Pencil, StickyNote, Trash2 } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { formatMonthShort } from "@/shared/lib/formatDate";
import { getAgendaStyle } from "@/shared/lib/agendaStyles";
import type { AgendaItem } from "@/shared/hooks/useAgenda";
import { parseDateKey } from "../lib/dateKeys";

export interface AgendaRowProps {
  item: AgendaItem;
  compact?: boolean;
  onEdit: (item: AgendaItem) => void;
  onDelete: (item: AgendaItem) => void;
}

export function AgendaRow({ item, compact, onEdit, onDelete }: AgendaRowProps) {
  const style = getAgendaStyle(item.type);
  const date = parseDateKey(item.date);
  return (
    <li className="group flex items-start gap-3 rounded-xl bg-muted/40 p-3 transition-colors hover:bg-muted/70">
      <button
        type="button"
        onClick={() => onEdit(item)}
        className="flex min-w-[44px] flex-col items-center justify-center text-center hover:opacity-80"
        aria-label={`Edit ${item.title}`}
      >
        <span className="text-xs font-medium uppercase text-muted-foreground">
          {formatMonthShort(date)}
        </span>
        <span className="text-lg font-bold leading-none text-foreground">
          {date.getDate()}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onEdit(item)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* min-w-0: as a flex item its automatic minimum is the full
              nowrap title width, so `truncate` never clipped — one long
              unbroken title pushed the type badges out of the card. */}
          <p className="min-w-0 truncate text-sm font-medium text-foreground">
            {item.title}
          </p>
          <Badge variant="secondary" className={cn("px-1.5 py-0", style.cls)}>
            {style.label}
          </Badge>
          {item.reminderMinutes ? (
            <Badge variant="outline" className="px-1.5 py-0">
              {formatReminder(item.reminderMinutes)}
            </Badge>
          ) : null}
        </div>
        {compact ? (
          <p className="truncate text-xs text-muted-foreground">
            {item.time} · {item.location}
          </p>
        ) : (
          <>
            <div className="mt-0.5 flex min-w-0 items-center gap-3 text-xs text-muted-foreground">
              <span className="flex shrink-0 items-center gap-1">
                <Clock className="h-3 w-3" /> {item.time}
              </span>
              <span className="flex min-w-0 items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{item.location}</span>
              </span>
            </div>
            {item.notes ? (
              <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground line-clamp-2">
                <StickyNote className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{item.notes}</span>
              </p>
            ) : null}
          </>
        )}
      </button>
      <div className="flex flex-col gap-1 opacity-100 lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(item)}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label={`Edit agenda ${item.title}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(item)}
          className="h-9 w-9 text-muted-foreground hover:text-destructive"
          aria-label={`Hapus agenda ${item.title}`}
        >
          <Trash2 className="h-4 w-4" />
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
