import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  mintFileToken,
  verifyFileToken,
  FILE_URL_TTL_SECONDS,
} from "./signedFileUrl";

/**
 * These tokens are bearer credentials handed to a third-party AI host. The
 * whole reason the owner accepted returning a file link at all is that it
 * expires and cannot be retargeted — so those two properties get a test that
 * fails loudly if either stops holding.
 */

const ORIGINAL = process.env.FILE_URL_SECRET;

beforeEach(() => {
  process.env.FILE_URL_SECRET = "test-secret-not-a-real-key";
});

afterEach(() => {
  vi.useRealTimers();
  if (ORIGINAL === undefined) delete process.env.FILE_URL_SECRET;
  else process.env.FILE_URL_SECRET = ORIGINAL;
});

const MINT = { fileId: "file_abc", userId: "user_1" };

describe("signed file URL", () => {
  it("round-trips a freshly minted token", async () => {
    const { token } = await mintFileToken(MINT);
    const payload = await verifyFileToken(token);
    expect(payload).toMatchObject({ f: "file_abc", u: "user_1" });
  });

  it("defaults to a one-hour window", async () => {
    const before = Math.floor(Date.now() / 1000);
    const { expiresAt } = await mintFileToken(MINT);
    const ttl = Math.round(expiresAt / 1000) - before;
    expect(ttl).toBeGreaterThanOrEqual(FILE_URL_TTL_SECONDS - 2);
    expect(ttl).toBeLessThanOrEqual(FILE_URL_TTL_SECONDS + 2);
    expect(FILE_URL_TTL_SECONDS).toBe(3600);
  });

  it("rejects a token past its expiry", async () => {
    const { token } = await mintFileToken({ ...MINT, ttlSeconds: 60 });
    expect(await verifyFileToken(token)).not.toBeNull();
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 61_000);
    expect(await verifyFileToken(token)).toBeNull();
  });

  it("cannot be retargeted at another file", async () => {
    // The payload is base64url JSON in front of the dot — rewrite it to point
    // at someone else's file and keep the original signature.
    const { token } = await mintFileToken(MINT);
    const [, sig] = token.split(".");
    const forged =
      Buffer.from(JSON.stringify({ f: "file_victim", u: "user_1", exp: 9e9 }))
        .toString("base64url") + "." + sig;
    expect(await verifyFileToken(forged)).toBeNull();
  });

  it("cannot be retargeted at another owner", async () => {
    const { token } = await mintFileToken(MINT);
    const [body, sig] = token.split(".");
    const decoded = JSON.parse(Buffer.from(body, "base64url").toString());
    const forged =
      Buffer.from(JSON.stringify({ ...decoded, u: "user_2" })).toString("base64url") +
      "." +
      sig;
    expect(await verifyFileToken(forged)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const { token } = await mintFileToken(MINT);
    process.env.FILE_URL_SECRET = "a-different-secret";
    expect(await verifyFileToken(token)).toBeNull();
  });

  it("refuses everything when the secret is missing, rather than passing", async () => {
    const { token } = await mintFileToken(MINT);
    delete process.env.FILE_URL_SECRET;
    // The failure mode that matters: an unset secret must not become an
    // accept-anything path.
    expect(await verifyFileToken(token)).toBeNull();
  });

  it("rejects malformed input without throwing", async () => {
    for (const bad of ["", "no-dot", ".", "a.b", "....", "abc.def.ghi"]) {
      expect(await verifyFileToken(bad)).toBeNull();
    }
  });
});
