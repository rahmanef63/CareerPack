import type { AgendaType } from "@/shared/hooks/useAgenda";

/**
 * Canonical visual style + Indonesian label per agenda type.
 *
 * Consumed by CalendarView (full list) and ScheduleCard (today's
 * widget in the dashboard rail). Keeping the single map here means
 * renaming "Wawancara" or adjusting the badge tint hits both places
 * automatically.
 *
 * All classes use semantic theme tokens so every tweakcn preset
 * renders correctly in both light and dark mode.
 */
export const AGENDA_TYPE_STYLES: Record<AgendaType, { label: string; cls: string }> = {
  interview: {
    label: "Wawancara",
    cls: "bg-accent text-brand dark:bg-accent dark:text-brand/80",
  },
  deadline: {
    label: "Tenggat",
    cls: "bg-warning/20 text-warning dark:bg-warning/20 dark:text-warning/80",
  },
  followup: {
    label: "Follow-up",
    cls: "bg-info/20 text-info dark:bg-info/20 dark:text-brand/80",
  },
  reminder: {
    label: "Pengingat",
    cls: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  other: {
    label: "Lainnya",
    cls: "bg-muted text-foreground",
  },
};

/** Fallback for any agenda type the registry hasn't seen yet (e.g.
 *  legacy rows or a future-added type the client bundle predates). */
export const AGENDA_TYPE_FALLBACK = {
  label: "Lainnya",
  cls: "bg-muted text-foreground",
};

/** Safe lookup — never returns undefined. Use this from any consumer
 *  reading `style.cls`/`style.label` so a stale row or new server-side
 *  type can't crash the UI. */
export function getAgendaStyle(type: string): { label: string; cls: string } {
  return AGENDA_TYPE_STYLES[type as AgendaType] ?? AGENDA_TYPE_FALLBACK;
}
