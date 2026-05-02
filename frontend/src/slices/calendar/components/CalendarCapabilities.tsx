"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { subscribe } from "@/shared/lib/aiActionBus";
import { notify } from "@/shared/lib/notify";

interface CreateEventPayload {
  title: string;
  date: string;
  time: string;
  type: string;
  location?: string;
  notes?: string;
}

interface UpdateEventPayload {
  eventId: string;
  title?: string;
  date?: string;
  time?: string;
  type?: string;
  location?: string;
  notes?: string;
}

interface DeleteEventPayload {
  eventId: string;
}

const VALID_TYPES = new Set([
  "reminder",
  "interview",
  "deadline",
  "followup",
  "other",
]);

/**
 * Calendar capability binder — subscribes to skill actions declared in
 * `calendar/manifest.ts` and routes them to Convex mutations.
 *
 * `calendar.create-event`: AI emits a tool_call with structured args;
 * the binder normalises (defaults missing optionals, clamps invalid
 * type to "other") and inserts via `api.calendar.mutations.createEvent`.
 *
 * Server validates date/time strings — bad input throws, surfaced via
 * `notify.fromError`.
 */
export function CalendarCapabilities() {
  const createEvent = useMutation(api.calendar.mutations.createEvent);
  const updateEvent = useMutation(api.calendar.mutations.updateEvent);
  const deleteEvent = useMutation(api.calendar.mutations.deleteEvent);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribe<CreateEventPayload>("calendar.create-event", async (a) => {
        const p = a.payload;
        const title = String(p.title ?? "").trim();
        const date = String(p.date ?? "").trim();
        const time = String(p.time ?? "").trim();
        if (!title || !date || !time) {
          notify.validation("Judul, tanggal, dan jam wajib diisi");
          return;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          notify.validation(
            `Format tanggal tidak valid: ${date} (harus YYYY-MM-DD)`,
          );
          return;
        }
        if (!/^\d{2}:\d{2}$/.test(time)) {
          notify.validation(`Format jam tidak valid: ${time} (harus HH:MM)`);
          return;
        }
        const rawType = String(p.type ?? "reminder").toLowerCase().trim();
        const type = VALID_TYPES.has(rawType) ? rawType : "other";
        try {
          await createEvent({
            title,
            date,
            time,
            type,
            location: String(p.location ?? "").trim(),
            notes: p.notes ? String(p.notes).trim() : undefined,
          });
          notify.success(`Event ditambahkan: ${title} · ${date} ${time}`);
        } catch (err) {
          notify.fromError(err, "Gagal tambah event ke kalender");
        }
      }),
    );

    unsubs.push(
      subscribe<UpdateEventPayload>("calendar.update-event", async (a) => {
        const p = a.payload;
        const eventId = String(p.eventId ?? "").trim();
        if (!eventId) {
          notify.validation("ID event wajib untuk update");
          return;
        }
        const patch: Record<string, unknown> = {
          eventId: eventId as Id<"calendarEvents">,
        };
        if (p.title !== undefined) patch.title = String(p.title).trim();
        if (p.date !== undefined) {
          const d = String(p.date).trim();
          if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
            notify.validation(`Format tanggal tidak valid: ${d}`);
            return;
          }
          patch.date = d;
        }
        if (p.time !== undefined) {
          const t = String(p.time).trim();
          if (!/^\d{2}:\d{2}$/.test(t)) {
            notify.validation(`Format jam tidak valid: ${t}`);
            return;
          }
          patch.time = t;
        }
        if (p.type !== undefined) {
          const rawType = String(p.type).toLowerCase().trim();
          patch.type = VALID_TYPES.has(rawType) ? rawType : "other";
        }
        if (p.location !== undefined)
          patch.location = String(p.location).trim();
        if (p.notes !== undefined)
          patch.notes = p.notes ? String(p.notes).trim() : undefined;
        try {
          await updateEvent(
            patch as Parameters<typeof updateEvent>[0],
          );
          notify.success("Event diperbarui");
        } catch (err) {
          notify.fromError(err, "Gagal update event");
        }
      }),
    );

    unsubs.push(
      subscribe<DeleteEventPayload>("calendar.delete-event", async (a) => {
        const eventId = String(a.payload.eventId ?? "").trim();
        if (!eventId) {
          notify.validation("ID event wajib untuk hapus");
          return;
        }
        try {
          await deleteEvent({ eventId: eventId as Id<"calendarEvents"> });
          notify.success("Event dihapus");
        } catch (err) {
          notify.fromError(err, "Gagal hapus event");
        }
      }),
    );

    return () => {
      for (const u of unsubs) u();
    };
  }, [createEvent, updateEvent, deleteEvent]);

  return null;
}
