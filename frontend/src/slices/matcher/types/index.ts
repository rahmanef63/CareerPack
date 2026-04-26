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
