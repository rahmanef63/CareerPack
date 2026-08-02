import type { ApplicationStatus } from "../types";

// `applied` and `offer` carry the `-text` prose tones: these are small badge
// labels on their own /20 tint, where --info measures 2.43:1 and --success
// 2.08:1. Their `dark:` twins are gone with them — dark:bg was a duplicate of
// the base, and dark:text-brand/80 silently swapped `applied` from blue-info
// to brand hue. --*-text already carries its own dark-mode value.
export const STATUS_META: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  applied: { label: "Dilamar", className: "bg-info/20 text-info-text" },
  screening: { label: "Screening", className: "bg-warning/20 text-warning dark:bg-warning/20 dark:text-warning/80" },
  interview: { label: "Wawancara", className: "bg-accent text-brand dark:bg-accent dark:text-brand/80" },
  offer: { label: "Tawaran", className: "bg-success/20 text-success-text" },
  rejected: { label: "Ditolak", className: "bg-destructive/20 text-destructive dark:bg-destructive/20 dark:text-destructive/80" },
  withdrawn: { label: "Ditarik", className: "bg-muted text-foreground dark:bg-muted dark:text-foreground" },
};
