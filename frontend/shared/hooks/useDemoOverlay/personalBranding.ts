"use client";

import { useCallback } from "react";
import { notify } from "@/shared/lib/notify";
import { useLocalStorageState } from "../useLocalStorageState";
import { DEMO_PB, type DemoPBSeed } from "@/shared/data/demoUser";

const PB_KEY = "careerpack:demo:pb";

interface PBHook {
  state: DemoPBSeed;
  set: <K extends keyof DemoPBSeed>(key: K, value: DemoPBSeed[K]) => void;
  save: (next: DemoPBSeed) => Promise<void>;
}

export function useDemoPBOverlay(): PBHook {
  const [state, setState] = useLocalStorageState<DemoPBSeed>(PB_KEY, DEMO_PB);

  const set: PBHook["set"] = useCallback(
    (key, value) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [setState],
  );

  const save: PBHook["save"] = useCallback(
    async (next) => {
      setState(next);
      notify.success("Tersimpan (mode demo lokal)");
    },
    [setState],
  );

  return { state, set, save };
}
