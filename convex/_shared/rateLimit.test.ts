import { describe, it, expect, vi } from "vitest";
import { ConvexError } from "convex/values";
import { AI_GLOBAL_CEILING, AI_RATE_LIMITS, enforceRateLimit } from "./rateLimit";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

describe("rate limit config", () => {
  it("ai:minute allows 10 req/60s", () => {
    expect(AI_RATE_LIMITS["ai:minute"].max).toBe(10);
    expect(AI_RATE_LIMITS["ai:minute"].windowMs).toBe(60 * 1000);
  });

  it("ai:day allows 100 req/24h", () => {
    expect(AI_RATE_LIMITS["ai:day"].max).toBe(100);
    expect(AI_RATE_LIMITS["ai:day"].windowMs).toBe(24 * 60 * 60 * 1000);
  });

  it("global ceiling is 300/h, demo sessions cut at half, keyed to ai:minute", () => {
    expect(AI_GLOBAL_CEILING.max).toBe(300);
    expect(AI_GLOBAL_CEILING.anonMax).toBe(150);
    expect(AI_GLOBAL_CEILING.windowMs).toBe(60 * 60 * 1000);
    // Counting the day rows instead would count the same calls twice over a
    // different window; the minute rows are the one-per-call ledger.
    expect(AI_GLOBAL_CEILING.key).toBe("ai:minute");
  });
});

const uid = (s: string) => s as unknown as Id<"users">;

// Fake just enough of `ctx.db` for enforceRateLimit: a query chain that
// `.collect()`s `existing` events, plus an `insert` spy. `existing` drives
// whether the bucket is at/over its limit. The global-ceiling check reads the
// same table through the other index, so the chain dispatches on index name:
// `global` events answer `by_key_time`. `user` is what `ctx.db.get` returns —
// an anonymous session is a row with no email.
function makeCtx(
  existing: Array<{ timestamp: number }>,
  opts: { global?: Array<{ timestamp: number }>; user?: { email?: string } } = {},
): {
  ctx: MutationCtx;
  insert: ReturnType<typeof vi.fn>;
} {
  const insert = vi.fn(async () => undefined);
  const ctx = {
    db: {
      query: vi.fn(() => ({
        withIndex: (name: string) => {
          const rows = name === "by_key_time" ? (opts.global ?? []) : existing;
          return {
            collect: async () => rows,
            take: async (n: number) => rows.slice(0, n),
          };
        },
      })),
      get: vi.fn(async () => opts.user ?? {}),
      insert,
    },
  } as unknown as MutationCtx;
  return { ctx, insert };
}

/** `n` global AI calls, all inside the ceiling's window. */
const globalEvents = (n: number) =>
  Array.from({ length: n }, () => ({ timestamp: Date.now() }));

describe("enforceRateLimit overflow", () => {
  it("records the event while under the limit (no throw)", async () => {
    const rule = AI_RATE_LIMITS["ai:minute"];
    const { ctx, insert } = makeCtx([{ timestamp: Date.now() }]);
    await expect(enforceRateLimit(ctx, uid("u1"), rule)).resolves.toBeUndefined();
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("throws a ConvexError carrying the Indonesian quota message on overflow", async () => {
    const rule = AI_RATE_LIMITS["ai:minute"]; // max 10, 60s window
    const now = Date.now();
    // Fill the bucket to `max`; oldest event drives the retry-seconds math.
    const existing = Array.from({ length: rule.max }, () => ({ timestamp: now }));
    const { ctx, insert } = makeCtx(existing);

    const err = await enforceRateLimit(ctx, uid("u1"), rule).then(
      () => {
        throw new Error("expected enforceRateLimit to reject, but it resolved");
      },
      (e: unknown) => e,
    );

    expect(err).toBeInstanceOf(ConvexError);
    // Message text is unchanged: "Rate limit tercapai (10/1m). Coba lagi dalam <n>s."
    const data = (err as ConvexError<{ message: string }>).data;
    expect(data.message).toMatch(
      /^Rate limit tercapai \(10\/1m\)\. Coba lagi dalam \d+s\.$/,
    );
    // Overflow must NOT record another event.
    expect(insert).not.toHaveBeenCalled();
  });
});

describe("global AI ceiling", () => {
  const rule = AI_RATE_LIMITS["ai:minute"];
  // Per-user bucket stays empty everywhere here: the point is that a user
  // well under their own 10/min still gets shed by the shared ceiling.
  const anon = (global: Array<{ timestamp: number }>) =>
    makeCtx([], { global, user: {} });
  const registered = (global: Array<{ timestamp: number }>) =>
    makeCtx([], { global, user: { email: "nia@example.com" } });

  it("sheds anonymous demo sessions at half the ceiling while registered users still pass", async () => {
    const global = globalEvents(AI_GLOBAL_CEILING.anonMax);

    const shed = await enforceRateLimit(anon(global).ctx, uid("u1"), rule).then(
      () => null,
      (e: unknown) => e,
    );
    expect(shed).toBeInstanceOf(ConvexError);
    expect((shed as ConvexError<{ message: string }>).data.message).toMatch(
      /^Pemakaian AI bersama sedang mencapai batas untuk jam ini\. Sesi demo dibatasi lebih dulu agar akun terdaftar tetap terlayani\. Coba lagi sekitar \d+ menit lagi\.$/,
    );

    const ok = registered(global);
    await expect(enforceRateLimit(ok.ctx, uid("u2"), rule)).resolves.toBeUndefined();
    expect(ok.insert).toHaveBeenCalledTimes(1);
  });

  it("stops registered users at the full ceiling, with a message distinct from the per-user one", async () => {
    const { ctx: c, insert } = registered(globalEvents(AI_GLOBAL_CEILING.max));

    const err = await enforceRateLimit(c, uid("u2"), rule).then(
      () => null,
      (e: unknown) => e,
    );
    const message = (err as ConvexError<{ message: string }>).data.message;
    expect(message).toMatch(
      /^Pemakaian AI bersama sedang mencapai batas untuk jam ini — bukan batas pribadi Anda\. Coba lagi sekitar \d+ menit lagi\.$/,
    );
    // notify.ts rewrites anything matching this into "Anda sudah mencapai
    // batas pemakaian", which is the one thing this must not be read as.
    expect(message).not.toMatch(/rate limit|quota|terlalu banyak/i);
    expect(insert).not.toHaveBeenCalled();
  });

  it("quotes the wait for the row that actually has to age out, not the oldest", async () => {
    // A full hour of 300 calls, oldest first: an anon session shed at 150
    // needs 151 of them gone, i.e. row 150 (~30min old) expiring — quoting
    // row 0 would promise ~1 menit for a ~30 menit shed.
    const now = Date.now();
    const hour = AI_GLOBAL_CEILING.windowMs;
    const spread = Array.from({ length: AI_GLOBAL_CEILING.max }, (_, i) => ({
      timestamp: now - hour + (i * hour) / AI_GLOBAL_CEILING.max,
    }));

    const err = await enforceRateLimit(anon(spread).ctx, uid("u1"), rule).then(
      () => null,
      (e: unknown) => e,
    );
    const minutes = Number(
      /sekitar (\d+) menit/.exec(
        (err as ConvexError<{ message: string }>).data.message,
      )?.[1],
    );
    expect(minutes).toBeGreaterThan(25);
    expect(minutes).toBeLessThanOrEqual(31);
  });

  it("ignores the ceiling for the ai:day rule so one call is only counted once", async () => {
    const { ctx: c, insert } = anon(globalEvents(AI_GLOBAL_CEILING.max));
    await expect(
      enforceRateLimit(c, uid("u1"), AI_RATE_LIMITS["ai:day"]),
    ).resolves.toBeUndefined();
    expect(insert).toHaveBeenCalledTimes(1);
  });
});
