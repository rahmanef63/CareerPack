import { describe, it, expect } from "vitest";
import { parseSentryDsn, parseStack } from "./errorSink";

describe("parseSentryDsn", () => {
  it("parses canonical https DSN", () => {
    expect(parseSentryDsn("https://abc123@o123.ingest.sentry.io/4567890")).toEqual({
      scheme: "https:",
      publicKey: "abc123",
      host: "o123.ingest.sentry.io",
      projectId: "4567890",
    });
  });

  it("parses self-hosted Sentry on http", () => {
    expect(parseSentryDsn("http://key@sentry.local/42")).toEqual({
      scheme: "http:",
      publicKey: "key",
      host: "sentry.local",
      projectId: "42",
    });
  });

  it("parses DSN with hyphens / underscores in key", () => {
    expect(
      parseSentryDsn("https://x_y-z@sentry.io/9")?.publicKey,
    ).toBe("x_y-z");
  });

  it("rejects missing key", () => {
    expect(parseSentryDsn("https://sentry.io/123")).toBeNull();
  });

  it("rejects non-numeric project id", () => {
    expect(parseSentryDsn("https://k@sentry.io/abc")).toBeNull();
  });

  it("rejects URLs without scheme", () => {
    expect(parseSentryDsn("k@sentry.io/123")).toBeNull();
  });

  it("rejects empty string", () => {
    expect(parseSentryDsn("")).toBeNull();
  });

  it("rejects generic webhook URLs that don't match Sentry shape", () => {
    expect(parseSentryDsn("https://hooks.slack.com/T0/B0/X")).toBeNull();
  });
});

describe("parseStack", () => {
  it("parses V8 fn-with-paren format", () => {
    const stack = `Error: oops
    at parseJobFromText (file:///convex/matcher/external.ts:397:12)
    at handler (file:///convex/_generated/server.ts:42:5)`;
    const result = parseStack(stack);
    expect(result.frames).toHaveLength(2);
    expect(result.frames[0]).toMatchObject({
      function: "handler",
      filename: "file:///convex/_generated/server.ts",
      lineno: 42,
      colno: 5,
    });
    expect(result.frames[1].function).toBe("parseJobFromText");
  });

  it("parses V8 anon-frame format", () => {
    const stack = `Error: oops
    at /convex/foo.ts:10:5`;
    const result = parseStack(stack);
    expect(result.frames[0]).toMatchObject({
      filename: "/convex/foo.ts",
      lineno: 10,
      colno: 5,
    });
  });

  it("parses Firefox at-syntax", () => {
    const stack = `oops
    foo@/convex/foo.ts:10:5`;
    const result = parseStack(stack);
    expect(result.frames[0]).toMatchObject({
      function: "foo",
      filename: "/convex/foo.ts",
      lineno: 10,
      colno: 5,
    });
  });

  it("returns empty frames for unparseable stack", () => {
    expect(parseStack("just a message").frames).toEqual([]);
  });

  it("reverses frames so oldest-first per Sentry convention", () => {
    const stack = `
    at top (a.ts:1:1)
    at middle (b.ts:2:2)
    at bottom (c.ts:3:3)`;
    const result = parseStack(stack);
    expect(result.frames.map((f) => f.function)).toEqual(["bottom", "middle", "top"]);
  });

  it("handles mixed frame styles in one stack", () => {
    const stack = `
    at named (a.ts:1:1)
    at b.ts:2:2
    foo@c.ts:3:3`;
    expect(parseStack(stack).frames).toHaveLength(3);
  });
});
