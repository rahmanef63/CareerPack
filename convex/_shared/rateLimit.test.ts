import { describe, it, expect } from "vitest";
import { AI_RATE_LIMITS } from "./rateLimit";

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
