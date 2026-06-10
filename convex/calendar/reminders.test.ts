import { describe, it, expect } from "vitest";
import { parseEventStart, APP_UTC_OFFSET } from "./reminders";

describe("parseEventStart — WIB anchoring", () => {
  it("interprets the stored wall-clock as WIB (UTC+7), not UTC", () => {
    // 09:00 WIB == 02:00 UTC. The old code parsed with `Z`, yielding
    // 09:00 UTC — 7h late for every Indonesian user.
    const ms = parseEventStart("2026-06-12", "09:00");
    expect(ms).not.toBeNull();
    expect(new Date(ms as number).toISOString()).toBe("2026-06-12T02:00:00.000Z");
  });

  it("uses the +07:00 offset constant", () => {
    expect(APP_UTC_OFFSET).toBe("+07:00");
  });

  it("a 60-minute reminder fires 60 min before the WIB start", () => {
    const start = parseEventStart("2026-06-12", "09:00") as number;
    const fire = start - 60 * 60 * 1000;
    // 08:00 WIB == 01:00 UTC
    expect(new Date(fire).toISOString()).toBe("2026-06-12T01:00:00.000Z");
  });

  it("rejects malformed date or time", () => {
    expect(parseEventStart("2026/06/12", "09:00")).toBeNull();
    expect(parseEventStart("2026-06-12", "9:00")).toBeNull();
    expect(parseEventStart("not-a-date", "09:00")).toBeNull();
  });
});
