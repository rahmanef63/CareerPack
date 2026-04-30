export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const STATUSES = ["not-started", "in-progress", "completed"] as const;
export const RESOURCE_TYPES = [
  "course", "book", "article", "video", "practice", "documentation", "other",
] as const;

export const LEVEL_LABEL: Record<string, string> = {
  beginner: "Pemula",
  intermediate: "Menengah",
  advanced: "Mahir",
};

export const STATUS_LABEL: Record<string, string> = {
  "not-started": "Belum Mulai",
  "in-progress": "Berjalan",
  completed: "Selesai",
};

export const STATUS_COLOR: Record<string, string> = {
  "not-started": "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  "in-progress": "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
};

export const LEVEL_COLOR: Record<string, string> = {
  beginner: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  intermediate: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  advanced: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
};
