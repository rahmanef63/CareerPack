import type { RateLimitRule } from "../../_shared/rateLimit";

/**
 * Rate limits for MCP write tools.
 *
 * The app's own mutations are unlimited because a browser session dies with
 * the tab and a human is driving it. An MCP access token is the opposite:
 * it lives a year, sits in a third party's infrastructure, and drives writes
 * with no human watching — so a leaked one can churn a user's tables for a
 * long time before anyone notices. These two buckets are what bound that.
 *
 * The per-day cap is not redundant with the per-minute one: 25/min throttles
 * a burst, but a script pacing itself at 20/min stays under it forever. 400
 * writes/day is far more than a person editing their own career data.
 */
export const MCP_WRITE_LIMIT: RateLimitRule = {
  key: "mcp:write",
  windowMs: 60 * 1000,
  max: 25,
};

export const MCP_WRITE_DAILY_LIMIT: RateLimitRule = {
  key: "mcp:write:day",
  windowMs: 24 * 60 * 60 * 1000,
  max: 400,
};
