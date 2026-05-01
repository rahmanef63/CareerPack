import { internalMutation } from "../_generated/server";

/**
 * Hourly reminder sweep.
 *
 * Walks today's + tomorrow's calendar events and inserts a notification
 * for any event whose `(start - reminderMinutes)` window already passed
 * but `reminderSentAt` is still unset. Idempotent: setting
 * `reminderSentAt` makes the next sweep skip the row.
 *
 * Runs hourly (see `convex/crons.ts`). At hourly granularity a 15-minute
 * reminder may fire up to ~60min early; that's the trade-off for
 * keeping cron load light. Tighten cadence in `crons.ts` if needed.
 */
export const sweepReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const todayStr = new Date(now).toISOString().slice(0, 10);
    const tomorrowStr = new Date(now + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    let inserted = 0;

    for (const dateStr of [todayStr, tomorrowStr]) {
      const events = await ctx.db
        .query("calendarEvents")
        .withIndex("by_date", (q) => q.eq("date", dateStr))
        .collect();

      for (const ev of events) {
        if (ev.reminderSentAt) continue;
        if (ev.reminderMinutes === undefined) continue;

        const startMs = parseEventStart(ev.date, ev.time);
        if (startMs === null) continue;

        const fireMs = startMs - ev.reminderMinutes * 60 * 1000;
        // Only fire if reminder window already opened, but event hasn't
        // ended (give 30min grace after start to catch late sweeps).
        if (now < fireMs) continue;
        if (now > startMs + 30 * 60 * 1000) {
          // Too late — event already passed. Mark sent to skip on retry.
          await ctx.db.patch(ev._id, { reminderSentAt: now });
          continue;
        }

        const minutesAway = Math.max(0, Math.round((startMs - now) / 60000));
        const message = minutesAway > 0
          ? `Mulai dalam ${formatMinutes(minutesAway)} di ${ev.location || "lokasi belum diset"}.`
          : `Sedang berlangsung di ${ev.location || "lokasi belum diset"}.`;

        await ctx.db.insert("notifications", {
          userId: ev.userId,
          type: "reminder",
          title: ev.title,
          message,
          read: false,
          actionUrl: "/dashboard/calendar",
          scheduledFor: startMs,
        });
        await ctx.db.patch(ev._id, { reminderSentAt: now });
        inserted += 1;
      }
    }

    return { inserted };
  },
});

function parseEventStart(date: string, time: string): number | null {
  // date "YYYY-MM-DD", time "HH:mm". Treat as local time of the server
  // (Dokploy default UTC). For multi-timezone support, store offset on
  // the event row — out of scope for this batch.
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) return null;
  const ms = Date.parse(`${date}T${time}:00.000Z`);
  return Number.isFinite(ms) ? ms : null;
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min} menit`;
  const h = Math.floor(min / 60);
  const rem = min % 60;
  return rem === 0 ? `${h} jam` : `${h} jam ${rem} menit`;
}
