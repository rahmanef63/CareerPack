"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { notify } from "@/shared/lib/notify";

interface ScanInput {
  cvId: Id<"cvs">;
  jobListingId?: Id<"jobListings">;
  jdText?: string;
  jobTitle?: string;
  jobCompany?: string;
}

export function useATSScan() {
  const scanAction = useAction(api.matcher.actions.scanCV);
  const [pending, setPending] = useState(false);
  const [latestScanId, setLatestScanId] = useState<Id<"atsScans"> | null>(null);

  const run = async (input: ScanInput) => {
    setPending(true);
    try {
      const res = await scanAction(input);
      setLatestScanId(res.scanId);
      notify.success(`Skor ATS: ${res.score} (${res.grade})`);
      return res;
    } catch (err) {
      notify.fromError(err, "Gagal scan ATS");
      throw err;
    } finally {
      setPending(false);
    }
  };

  return { run, pending, latestScanId, setLatestScanId };
}

export function useATSHistory(limit = 50) {
  const scans = useQuery(api.matcher.queries.listMyScans, { limit });
  return {
    scans: scans ?? [],
    isLoading: scans === undefined,
  };
}

export function useATSScan_byId(scanId: Id<"atsScans"> | null) {
  const scan = useQuery(
    api.matcher.queries.getScan,
    scanId ? { scanId } : "skip",
  );
  return { scan: scan ?? null, isLoading: scanId !== null && scan === undefined };
}
