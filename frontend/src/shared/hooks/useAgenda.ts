"use client";

import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id, Doc } from "../../../../convex/_generated/dataModel";
import { useAuth } from "@/shared/hooks/useAuth";
import { useDemoAgendaOverlay } from "@/shared/hooks/useDemoOverlay";

export type AgendaType = "interview" | "deadline" | "followup";

export interface AgendaItem {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  time: string;
  location: string;
  type: AgendaType;
  notes?: string;
}

type ConvexEvent = Doc<"calendarEvents">;

function fromConvex(doc: ConvexEvent): AgendaItem {
  return {
    id: doc._id,
    title: doc.title,
    date: doc.date,
    time: doc.time,
    location: doc.location,
    type: (doc.type as AgendaType) ?? "interview",
    notes: doc.notes,
  };
}

export interface CreateAgendaInput {
  title: string;
  date: string;
  time: string;
  location: string;
  type: AgendaType;
  notes?: string;
}

export function useAgenda() {
  const { state } = useAuth();
  const isAuthenticated = state.isAuthenticated;
  const isDemo = state.isDemo;

  const raw = useQuery(
    api.calendar.queries.listEvents,
    isAuthenticated && !isDemo ? {} : "skip",
  );
  const createMutation = useMutation(api.calendar.mutations.createEvent);
  const deleteMutation = useMutation(api.calendar.mutations.deleteEvent);
  const updateMutation = useMutation(api.calendar.mutations.updateEvent);

  const demo = useDemoAgendaOverlay();

  const items: AgendaItem[] = raw ? raw.map(fromConvex) : [];

  const create = useCallback(
    async (input: CreateAgendaInput) => {
      await createMutation(input);
    },
    [createMutation],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteMutation({ eventId: id as Id<"calendarEvents"> });
    },
    [deleteMutation],
  );

  const update = useCallback(
    async (id: string, patch: Partial<CreateAgendaInput>) => {
      await updateMutation({
        eventId: id as Id<"calendarEvents">,
        ...patch,
      });
    },
    [updateMutation],
  );

  if (isDemo) return demo;

  return {
    items,
    isLoading: isAuthenticated && raw === undefined,
    create,
    remove,
    update,
  };
}
