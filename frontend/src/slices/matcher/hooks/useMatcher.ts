"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { WorkModeFilter } from "../types";

export function useMatcher(workMode: WorkModeFilter) {
  const jobs = useQuery(api.matcher.queries.listJobs, {
    workMode: workMode === "all" ? undefined : workMode,
  });
  const matches = useQuery(api.matcher.queries.getMatches, { limit: 6 });
  const seedDemo = useMutation(api.matcher.mutations.seedDemoJobs);

  return {
    jobs: jobs ?? [],
    matches: matches ?? [],
    isLoading: jobs === undefined || matches === undefined,
    seedDemo,
  };
}
