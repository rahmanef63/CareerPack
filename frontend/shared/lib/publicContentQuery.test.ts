import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { publicContentQuery, publicContentList } from "./publicContentQuery";

const ORIGINAL_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

beforeEach(() => {
  process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
});

afterEach(() => {
  if (ORIGINAL_URL === undefined) delete process.env.NEXT_PUBLIC_CONVEX_URL;
  else process.env.NEXT_PUBLIC_CONVEX_URL = ORIGINAL_URL;
});

describe("publicContentQuery", () => {
  it("returns the value on success", async () => {
    expect(await publicContentQuery(async () => "ok", "fallback")).toBe("ok");
  });

  it("falls back when the query throws", async () => {
    const out = await publicContentQuery(async () => {
      throw new Error("convex down");
    }, "fallback");
    expect(out).toBe("fallback");
  });

  it("falls back when the env var is missing", async () => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    expect(await publicContentQuery(async () => "ok", null)).toBeNull();
  });

  it("bounds a query that never resolves", async () => {
    // The whole point: a hung backend must not park the prerender. Without the
    // deadline this awaits forever and the test times out.
    const started = Date.now();
    const out = await publicContentQuery(
      () => new Promise(() => {}),
      "fallback",
      60,
    );
    expect(out).toBe("fallback");
    expect(Date.now() - started).toBeLessThan(2_000);
  });

  it("treats undefined as a miss", async () => {
    expect(await publicContentQuery(async () => undefined, "fallback")).toBe("fallback");
  });
});

describe("publicContentList", () => {
  it("always yields an array, even when the query returns garbage", async () => {
    expect(await publicContentList(async () => ["a"])).toEqual(["a"]);
    expect(
      await publicContentList(async () => "not an array" as unknown as string[]),
    ).toEqual([]);
    expect(
      await publicContentList(async () => {
        throw new Error("boom");
      }),
    ).toEqual([]);
  });
});
