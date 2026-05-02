import type { Doc } from "../../../../../convex/_generated/dataModel";

export type JobListing = Doc<"jobListings">;

export interface JobMatch {
  job: JobListing;
  score: number;
}

export type WorkModeFilter = "all" | "remote" | "hybrid" | "onsite";

export const WORK_MODE_LABELS: Record<Exclude<WorkModeFilter, "all">, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

/** Bidang/functional category — surfaced as a colored pill on JobCard.
 *  Keys must match the strings emitted by backend `inferCategory` /
 *  WWR feed mapping. Add new keys here when adding a new feed. */
export const CATEGORY_LABELS: Record<string, string> = {
  engineering: "Engineering",
  design: "Design",
  support: "Customer Support",
  product: "Product",
  marketing: "Marketing",
  data: "Data",
};

/** Tailwind class pairs per category. Stable, accessible contrast in
 *  both light + dark modes via shadcn token aliases. Unknown keys fall
 *  through to a neutral muted style (see JobCard fallback). */
export const CATEGORY_COLORS: Record<string, string> = {
  engineering: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  design: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
  support: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  product: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  marketing: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  data: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
};
