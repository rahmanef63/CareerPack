"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorageState } from "../useLocalStorageState";
import { DEMO_CHECKLIST_PROGRESS } from "@/shared/data/demoUser";

const CHECKLIST_KEY = "careerpack:demo:checklist";

export interface DemoChecklistMap {
  [id: string]: {
    completed: boolean;
    notes?: string;
    expiryDate?: string;
  };
}

interface ChecklistHook {
  progress: DemoChecklistMap;
  isLoading: boolean;
  toggle: (id: string) => void;
  setEntry: (
    id: string,
    patch: Partial<{ completed: boolean; notes: string; expiryDate: string }>,
  ) => void;
}

export function useDemoChecklistOverlay(): ChecklistHook {
  const seedMap: DemoChecklistMap = useMemo(() => {
    const m: DemoChecklistMap = {};
    for (const e of DEMO_CHECKLIST_PROGRESS) {
      m[e.id] = {
        completed: e.completed,
        notes: e.notes,
        expiryDate: e.expiryDate,
      };
    }
    return m;
  }, []);

  const [progress, setProgress] = useLocalStorageState<DemoChecklistMap>(
    CHECKLIST_KEY,
    seedMap,
  );

  const toggle: ChecklistHook["toggle"] = useCallback(
    (id) => {
      setProgress((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          completed: !prev[id]?.completed,
        },
      }));
    },
    [setProgress],
  );

  const setEntry: ChecklistHook["setEntry"] = useCallback(
    (id, patch) => {
      setProgress((prev) => ({
        ...prev,
        [id]: {
          completed: patch.completed ?? prev[id]?.completed ?? false,
          notes: patch.notes ?? prev[id]?.notes,
          expiryDate: patch.expiryDate ?? prev[id]?.expiryDate,
        },
      }));
    },
    [setProgress],
  );

  return { progress, isLoading: false, toggle, setEntry };
}
