import { describe, it, expect, vi } from "vitest";
import { ConvexError } from "convex/values";
import { AI_RATE_LIMITS, enforceRateLimit } from "./rateLimit";
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
});

const uid = (s: string) => s as unknown as Id<"users">;

// Fake just enough of `ctx.db` for enforceRateLimit: a query chain that
// `.collect()`s `existing` events, plus an `insert` spy. `existing` drives
// whether the bucket is at/over its limit.
function makeCtx(existing: Array<{ timestamp: number }>): {
  ctx: MutationCtx;
  insert: ReturnType<typeof vi.fn>;
} {
  const insert = vi.fn(async () => undefined);
  const ctx = {
    db: {
      query: vi.fn(() => ({
        withIndex: () => ({ collect: async () => existing }),
      })),
      insert,
    },
  } as unknown as MutationCtx;
  return { ctx, insert };
}

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
