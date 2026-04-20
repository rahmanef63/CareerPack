"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { WorkModeFilter } from "../types";

export function useMatcher(workMode: WorkModeFilter) {
  const jobs = useQuery(api.matcher.listJobs, {
    workMode: workMode === "all" ? undefined : workMode,
  });
  const matches = useQuery(api.matcher.getMatches, { limit: 6 });
  const seedDemo = useMutation(api.matcher.seedDemoJobs);

  return {
    jobs: jobs ?? [],
    matches: matches ?? [],
    isLoading: jobs === undefined || matches === undefined,
    seedDemo,
  };
}
