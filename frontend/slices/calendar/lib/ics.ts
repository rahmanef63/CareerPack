import type { AgendaItem } from "@/shared/hooks/useAgenda";

/**
 * Minimal RFC 5545 iCalendar (.ics) builder.
 *
 * Scope: enough for a single VCALENDAR with N VEVENTs that show up in
 * Google Calendar / Apple Calendar / Outlook. Each event is treated as
 * a 60-minute block (we don't store duration). Times are emitted as
 * floating local time — `DTSTART:YYYYMMDDTHHMMSS` without `Z`, so the
 * importing client uses the user's local timezone.
 */

const PRODID = "-//CareerPack//Calendar//ID";
const EVENT_DURATION_MINUTES = 60;

export function eventsToIcs(events: AgendaItem[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  const stamp = nowStamp();
  for (const ev of events) {
    const start = combine(ev.date, ev.time);
    if (!start) continue;
    const end = addMinutes(start, EVENT_DURATION_MINUTES);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.id}@careerpack`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escape(ev.title)}`,
    );
    if (ev.location) lines.push(`LOCATION:${escape(ev.location)}`);
    if (ev.notes) lines.push(`DESCRIPTION:${escape(ev.notes)}`);
    if (ev.reminderMinutes !== undefined && ev.reminderMinutes > 0) {
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escape(ev.title)}`,
        `TRIGGER:-PT${ev.reminderMinutes}M`,
        "END:VALARM",
      );
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- helpers ---

/** "YYYY-MM-DD" + "HH:mm" → "YYYYMMDDTHHMMSS" (floating local time) */
function combine(date: string, time: string): string | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const tm = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dm || !tm) return null;
  return `${dm[1]}${dm[2]}${dm[3]}T${tm[1]}${tm[2]}00`;
}

function addMinutes(stamp: string, mins: number): string {
  // Parse the floating timestamp back to a Date in local TZ, add, re-emit.
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/.exec(stamp);
  if (!m) return stamp;
  const [, y, mo, d, h, mi, s] = m;
  const dt = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s),
  );
  dt.setMinutes(dt.getMinutes() + mins);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T` +
    `${pad(dt.getHours())}${pad(dt.getMinutes())}${pad(dt.getSeconds())}`
  );
}

function nowStamp(): string {
  // DTSTAMP must be UTC per RFC 5545.
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escape(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}
