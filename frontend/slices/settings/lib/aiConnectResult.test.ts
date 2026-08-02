import { describe, it, expect } from "vitest";
import { parseAIConnectResult } from "./aiConnectResult";

describe("parseAIConnectResult", () => {
  it("reads a provider id as success", () => {
    expect(parseAIConnectResult("?ai=openrouter")).toEqual({
      status: "ok",
      provider: "openrouter",
    });
  });

  // The sentinel shares the provider-id namespace, so this is the assertion
  // that stops a failed connect from rendering as a connected provider.
  it("reads the failure sentinel as failure, not as a provider", () => {
    expect(parseAIConnectResult("?ai=error")).toEqual({ status: "failed" });
  });

  it("returns null when the param is absent or empty", () => {
    expect(parseAIConnectResult("")).toBeNull();
    expect(parseAIConnectResult("?tab=profile")).toBeNull();
    expect(parseAIConnectResult("?ai=")).toBeNull();
  });
});
