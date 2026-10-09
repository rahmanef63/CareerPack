import { it, expect, vi } from "vitest";
import type { ActionCtx } from "../_generated/server";
import { activeUserId } from "./authSession";

it("checks action callers against reset revocations before exposing their user ID", async () => {
  const runQuery = vi.fn(async () => true);
  const ctx = { auth: { getUserIdentity: async () => ({ subject: "user|session" }) }, runQuery } as unknown as ActionCtx;
  expect(await activeUserId(ctx)).toBeNull();
  expect(runQuery).toHaveBeenCalledWith(expect.anything(), { sessionId: "session" });
  runQuery.mockResolvedValue(false);
  expect(await activeUserId(ctx)).toBe("user");
});
