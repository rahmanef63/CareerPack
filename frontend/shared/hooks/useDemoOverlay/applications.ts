"use client";

import { useCallback, useMemo } from "react";
import { notify } from "@/shared/lib/notify";
import { useLocalStorageState } from "../useLocalStorageState";
import {
  DEMO_APPLICATIONS,
  type DemoApplicationSeed,
} from "@/shared/data/demoUser";
import type { Application, ApplicationStatus } from "@/shared/types";
import { DAY } from "./_constants";

const APPLICATIONS_KEY = "careerpack:demo:applications";

interface ApplicationsHook {
  applications: Application[];
  isLoading: boolean;
  create: (input: {
    company: string;
    position: string;
    location?: string;
    salary?: string;
    source?: string;
    notes?: string;
  }) => Promise<void>;
  updateStatus: (
    id: string,
    status: ApplicationStatus,
    notes?: string,
  ) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

function applicationFromSeed(s: DemoApplicationSeed, now: number): Application {
  const ts = now - s.daysAgo * DAY;
  const iso = new Date(ts).toISOString().split("T")[0];
  return {
    id: s.id,
    company: s.company,
    position: s.position,
    status: s.status,
    appliedDate: iso,
    lastUpdate: iso,
    notes: s.notes,
    salary: s.salary,
  };
}

export function useDemoApplicationsOverlay(): ApplicationsHook {
  const [seeds, setSeeds] = useLocalStorageState<DemoApplicationSeed[]>(
    APPLICATIONS_KEY,
    [...DEMO_APPLICATIONS],
  );
  const now = Date.now();
  const applications = useMemo(
    () => seeds.map((s) => applicationFromSeed(s, now)),
    [seeds, now],
  );

  const create: ApplicationsHook["create"] = useCallback(
    async (input) => {
      setSeeds((prev) => [
        ...prev,
        {
          id: `app-${Date.now().toString(36)}`,
          company: input.company,
          position: input.position,
          status: "applied",
          daysAgo: 0,
          notes: input.notes,
          salary: input.salary,
        },
      ]);
      notify.success("Tersimpan di mode demo (lokal)");
    },
    [setSeeds],
  );

  const updateStatus: ApplicationsHook["updateStatus"] = useCallback(
    async (id, status, notes) => {
      setSeeds((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status, notes: notes ?? s.notes } : s,
        ),
      );
    },
    [setSeeds],
  );

  const remove: ApplicationsHook["remove"] = useCallback(
    async (id) => {
      setSeeds((prev) => prev.filter((s) => s.id !== id));
    },
    [setSeeds],
  );

  return { applications, isLoading: false, create, updateStatus, remove };
}
