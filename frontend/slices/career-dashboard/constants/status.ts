import type { ApplicationStatus } from "../types";

export const STATUS_META: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  applied: { label: "Dilamar", className: "bg-info/20 text-info dark:bg-info/20 dark:text-brand/80" },
  screening: { label: "Screening", className: "bg-warning/20 text-warning dark:bg-warning/20 dark:text-warning/80" },
  interview: { label: "Wawancara", className: "bg-accent text-brand dark:bg-accent dark:text-brand/80" },
  offer: { label: "Tawaran", className: "bg-success/20 text-success dark:bg-success/20 dark:text-success/80" },
  rejected: { label: "Ditolak", className: "bg-destructive/20 text-destructive dark:bg-destructive/20 dark:text-destructive/80" },
  withdrawn: { label: "Ditarik", className: "bg-muted text-foreground dark:bg-muted dark:text-foreground" },
};
