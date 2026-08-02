import { describe, it, expect } from "vitest";
import { ConvexError } from "convex/values";
import { aiUnavailableError } from "../_shared/aiProviders";

/**
 * The only user-visible output of the whole `callAI` / `chat` gateway-failure
 * path. Everything else about an upstream 402 (status, provider body) is
 * deliberately withheld from the client, so if this copy regresses the user is
 * left with nothing.
 */
describe("aiUnavailableError", () => {
  it("is a ConvexError so prod Convex does not redact it to 'Server Error'", () => {
    const err = aiUnavailableError(402);
    expect(err).toBeInstanceOf(ConvexError);
    expect(typeof (err.data as { message: string }).message).toBe("string");
  });

  it("tells a 429 (retry helps) apart from a drained key (retry never helps)", () => {
    const busy = (aiUnavailableError(429).data as { message: string }).message;
    const drained = (aiUnavailableError(402).data as { message: string }).message;
    const generic = (aiUnavailableError(503).data as { message: string }).message;
    expect(new Set([busy, drained, generic]).size).toBe(3);
    // 401/402/403 all mean "our billing/key", so they must read identically.
    expect((aiUnavailableError(401).data as { message: string }).message).toBe(drained);
    expect((aiUnavailableError(403).data as { message: string }).message).toBe(drained);
  });

  it("blames the user's own key, not us, when the key came from their Setelan → AI", () => {
    // resolveAI source "user" = BYO key. Telling them "gangguan di sisi kami"
    // leaves them waiting for a fix only they can make.
    const own = (aiUnavailableError(402, "user").data as { message: string }).message;
    const ours = (aiUnavailableError(402, "global").data as { message: string }).message;
    expect(own).toContain("Setelan → AI");
    expect(own).not.toBe(ours);
    expect(ours).not.toContain("Setelan → AI");
  });

  it("never says 'quota' — notify.ts rewrites that word into the per-user-limit copy", () => {
    // A KNOWN_ERRORS hit would replace these messages with "Anda sudah mencapai
    // batas pemakaian", i.e. blame the user for our empty balance. "kuota" (the
    // Indonesian spelling, used in the 402 copy) does not match that pattern.
    for (const status of [401, 402, 403, 429, 500, 503]) {
      for (const source of [undefined, "user", "global"]) {
        const { message } = aiUnavailableError(status, source).data as { message: string };
        // Also guards the other KNOWN_ERRORS rows the copy could trip into
        // ("akses ditolak" would become "Anda tidak memiliki akses").
        expect(message).not.toMatch(
          /rate limit|quota|terlalu banyak|Server Error|unauthori[sz]ed|forbidden|akses ditolak|tidak ditemukan|not found/i,
        );
      }
    }
  });
});
