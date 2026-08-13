import type { AgendaType } from "@/shared/hooks/useAgenda";
import { AGENDA_TYPE_STYLES } from "@/shared/lib/agendaStyles";

/** Type dropdown + filter chips both read the shared style registry, so a
 *  renamed label ("Wawancara" → …) lands in every surface at once. */
export const TYPE_OPTIONS: ReadonlyArray<{ value: AgendaType; label: string }> = (
  Object.entries(AGENDA_TYPE_STYLES) as Array<
    [AgendaType, { label: string; cls: string }]
  >
).map(([value, { label }]) => ({ value, label }));

export type FilterType = AgendaType | "all";
