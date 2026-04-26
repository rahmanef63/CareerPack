import { describe, it, expect } from "vitest";
import { AI_RATE_LIMITS, LOGIN_RATE_LIMIT } from "./rateLimit";

describe("rate limit config", () => {
  it("ai:minute allows 10 req/60s", () => {
    expect(AI_RATE_LIMITS["ai:minute"].max).toBe(10);
    expect(AI_RATE_LIMITS["ai:minute"].windowMs).toBe(60 * 1000);
  });

  it("ai:day allows 100 req/24h", () => {
    expect(AI_RATE_LIMITS["ai:day"].max).toBe(100);
    expect(AI_RATE_LIMITS["ai:day"].windowMs).toBe(24 * 60 * 60 * 1000);
  });

  it("login limiter is 5 in 15m", () => {
    expect(LOGIN_RATE_LIMIT.max).toBe(5);
    expect(LOGIN_RATE_LIMIT.windowMs).toBe(15 * 60 * 1000);
  });
});
