"use client";

import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id, Doc } from "../../../../convex/_generated/dataModel";
import { useAuth } from "@/shared/hooks/useAuth";
import { useDemoAgendaOverlay } from "@/shared/hooks/useDemoOverlay";

export type AgendaType =
  | "interview"
  | "deadline"
  | "followup"
  | "reminder"
  | "other";

const KNOWN_AGENDA_TYPES = new Set<AgendaType>([
  "interview",
  "deadline",
  "followup",
  "reminder",
  "other",
]);

function normaliseAgendaType(raw: unknown): AgendaType {
  if (typeof raw !== "string") return "other";
  const v = raw.toLowerCase().trim() as AgendaType;
  return KNOWN_AGENDA_TYPES.has(v) ? v : "other";
}

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
  /** Minutes before start to fire a reminder. Undefined = no reminder. */
  reminderMinutes?: number;
}

type ConvexEvent = Doc<"calendarEvents">;

function fromConvex(doc: ConvexEvent): AgendaItem {
  return {
    id: doc._id,
    title: doc.title,
    date: doc.date,
    time: doc.time,
    location: doc.location,
    type: normaliseAgendaType(doc.type),
    notes: doc.notes,
    reminderMinutes: doc.reminderMinutes,
  };
}

export interface CreateAgendaInput {
  title: string;
  date: string;
  time: string;
  location: string;
  type: AgendaType;
  notes?: string;
  reminderMinutes?: number;
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
