"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

/**
 * Two parallel queries — "Saya" tab needs the current user's pastes
 * only; "Explore" needs the full catalog. Splitting at the hook layer
 * keeps cache keys stable and lets each tab show its own loading
 * skeleton independently. Filtering (search, category, skills, sort)
 * happens client-side inside `JobBrowser`.
 */
export function useMatcher() {
  const myJobs = useQuery(api.matcher.queries.listJobs, {
    mineOnly: true,
    limit: 100,
  });
  const exploreJobs = useQuery(api.matcher.queries.listJobs, { limit: 100 });
  const matches = useQuery(api.matcher.queries.getMatches, { limit: 6 });
  const seedDemo = useMutation(api.matcher.mutations.seedDemoJobs);

  return {
    myJobs: myJobs ?? [],
    exploreJobs: exploreJobs ?? [],
    matches: matches ?? [],
    isLoadingMy: myJobs === undefined,
    isLoadingExplore: exploreJobs === undefined,
    isLoadingMatches: matches === undefined,
    seedDemo,
  };
}
