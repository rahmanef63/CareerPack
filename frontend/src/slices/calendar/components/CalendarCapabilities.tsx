"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
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

const VALID_TYPES = new Set(["reminder", "interview", "deadline", "other"]);

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

  useEffect(() => {
    const unsub = subscribe<CreateEventPayload>(
      "calendar.create-event",
      async (a) => {
        const p = a.payload;
        const title = String(p.title ?? "").trim();
        const date = String(p.date ?? "").trim();
        const time = String(p.time ?? "").trim();
        if (!title || !date || !time) {
          notify.validation("Judul, tanggal, dan jam wajib diisi");
          return;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          notify.validation(`Format tanggal tidak valid: ${date} (harus YYYY-MM-DD)`);
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
      },
    );
    return unsub;
  }, [createEvent]);

  return null;
}
