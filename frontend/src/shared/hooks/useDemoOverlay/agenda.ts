"use client";

import { useCallback, useMemo } from "react";
import { notify } from "@/shared/lib/notify";
import { useLocalStorageState } from "../useLocalStorageState";
import {
  DEMO_AGENDA,
  type DemoAgendaSeed,
  type DemoAgendaType,
} from "@/shared/data/demoUser";
import { DAY } from "./_constants";

const AGENDA_KEY = "careerpack:demo:agenda";

export interface DemoAgendaItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: DemoAgendaType;
  notes?: string;
}

interface AgendaHook {
  items: DemoAgendaItem[];
  isLoading: boolean;
  create: (input: Omit<DemoAgendaItem, "id">) => Promise<void>;
  remove: (id: string) => Promise<void>;
  update: (id: string, patch: Partial<Omit<DemoAgendaItem, "id">>) => Promise<void>;
}

function agendaFromSeed(s: DemoAgendaSeed, now: number): DemoAgendaItem {
  const ts = now + s.dateOffsetDays * DAY;
  return {
    id: s.id,
    title: s.title,
    date: new Date(ts).toISOString().split("T")[0],
    time: s.time,
    location: s.location,
    type: s.type,
    notes: s.notes,
  };
}

export function useDemoAgendaOverlay(): AgendaHook {
  const [seeds, setSeeds] = useLocalStorageState<DemoAgendaSeed[]>(
    AGENDA_KEY,
    [...DEMO_AGENDA],
  );
  const now = Date.now();
  const items = useMemo(
    () => seeds.map((s) => agendaFromSeed(s, now)),
    [seeds, now],
  );

  const create: AgendaHook["create"] = useCallback(
    async (input) => {
      const offset = Math.round(
        (new Date(input.date).getTime() - Date.now()) / DAY,
      );
      setSeeds((prev) => [
        ...prev,
        {
          id: `ag-${Date.now().toString(36)}`,
          title: input.title,
          dateOffsetDays: offset,
          time: input.time,
          location: input.location,
          type: input.type,
          notes: input.notes,
        },
      ]);
      notify.success("Tersimpan di mode demo (lokal)");
    },
    [setSeeds],
  );

  const remove: AgendaHook["remove"] = useCallback(
    async (id) => {
      setSeeds((prev) => prev.filter((s) => s.id !== id));
    },
    [setSeeds],
  );

  const update: AgendaHook["update"] = useCallback(
    async (id, patch) => {
      setSeeds((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const next: DemoAgendaSeed = { ...s };
          if (patch.title !== undefined) next.title = patch.title;
          if (patch.time !== undefined) next.time = patch.time;
          if (patch.location !== undefined) next.location = patch.location;
          if (patch.type !== undefined) next.type = patch.type;
          if (patch.notes !== undefined) next.notes = patch.notes;
          if (patch.date !== undefined) {
            next.dateOffsetDays = Math.round(
              (new Date(patch.date).getTime() - Date.now()) / DAY,
            );
          }
          return next;
        }),
      );
    },
    [setSeeds],
  );

  return { items, isLoading: false, create, remove, update };
}
