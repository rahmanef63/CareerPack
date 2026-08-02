import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isAllowedOrigin, rejectIfBadOrigin } from "./origin";

const ORIGINAL_APP_URL = process.env.APP_URL;

beforeEach(() => {
  delete process.env.APP_URL;
});

afterEach(() => {
  if (ORIGINAL_APP_URL === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = ORIGINAL_APP_URL;
});

describe("isAllowedOrigin", () => {
  it("accepts dev origins", () => {
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
    expect(isAllowedOrigin("http://127.0.0.1:3000")).toBe(true);
  });

  it("accepts APP_URL exactly (with or without trailing slash)", () => {
    process.env.APP_URL = "https://careerpack.app";
    expect(isAllowedOrigin("https://careerpack.app")).toBe(true);

    process.env.APP_URL = "https://careerpack.app/";
    expect(isAllowedOrigin("https://careerpack.app")).toBe(true);
  });

  it("rejects unknown origin", () => {
    process.env.APP_URL = "https://careerpack.app";
    expect(isAllowedOrigin("https://evil.example.com")).toBe(false);
  });

  it("rejects null / empty", () => {
    expect(isAllowedOrigin(null)).toBe(false);
    expect(isAllowedOrigin("")).toBe(false);
  });

  it("rejects close-but-not-equal origin (no substring matching)", () => {
    process.env.APP_URL = "https://careerpack.app";
    expect(isAllowedOrigin("https://careerpack.app.evil.com")).toBe(false);
    expect(isAllowedOrigin("https://evil.com/careerpack.app")).toBe(false);
  });
});

describe("rejectIfBadOrigin", () => {
  const cors = { "Access-Control-Allow-Origin": "*" };

  it("returns null on OPTIONS preflight (always allowed)", () => {
    const req = new Request("https://x", { method: "OPTIONS" });
    expect(rejectIfBadOrigin(req, cors)).toBeNull();
  });

  it("returns null when origin is allowed", () => {
    const req = new Request("https://x", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });
    expect(rejectIfBadOrigin(req, cors)).toBeNull();
  });

  it("returns 403 when origin missing", async () => {
    const req = new Request("https://x", { method: "POST" });
    const res = rejectIfBadOrigin(req, cors);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    expect(await res!.text()).toBe("forbidden_origin");
  });

  it("returns 403 when origin not in allowlist", async () => {
    const req = new Request("https://x", {
      method: "POST",
      headers: { origin: "https://evil.example.com" },
    });
    const res = rejectIfBadOrigin(req, cors);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });
});
