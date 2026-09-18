import { describe, expect, it } from "vitest";
import { isAuthReadinessKnown, isGoogleAuthReady } from "./authReadiness";

describe("auth readiness", () => {
  it("fails Google closed while readiness is unknown", () => {
    expect(isAuthReadinessKnown(null)).toBe(false);
    expect(isGoogleAuthReady(null)).toBe(false);
  });

  it("keeps Google disabled when backend reports it unavailable", () => {
    expect(isAuthReadinessKnown({ auth: true, google: false })).toBe(true);
    expect(isGoogleAuthReady({ auth: true, google: false })).toBe(false);
  });

  it("does not infer Google readiness from core auth readiness", () => {
    expect(isGoogleAuthReady({ auth: true, google: false })).toBe(false);
  });

  it("enables Google only after an explicit google=true", () => {
    expect(isGoogleAuthReady({ auth: true, google: true })).toBe(true);
  });
});
