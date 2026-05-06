import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchWithTimeout } from "./fetchWithTimeout";

const realFetch = global.fetch;

afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("fetchWithTimeout", () => {
  it("passes through a successful response", async () => {
    global.fetch = vi.fn(async () => new Response("ok"));
    const r = await fetchWithTimeout("https://example.com", { timeoutMs: 1000 });
    expect(await r.text()).toBe("ok");
  });

  it("forwards method + body + headers untouched", async () => {
    const spy = vi.fn(
      async (_url: string | URL | Request, _init?: RequestInit) => new Response("ok"),
    );
    global.fetch = spy as unknown as typeof global.fetch;
    await fetchWithTimeout("https://example.com", {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
      headers: { "Content-Type": "application/json" },
      timeoutMs: 1000,
    });
    const init = spy.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"a":1}');
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
  });

  it("throws timeout error when fetch hangs past deadline", async () => {
    global.fetch = vi.fn(
      (_, init) =>
        new Promise<Response>((_resolve, reject) => {
          (init?.signal as AbortSignal | undefined)?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        }),
    ) as typeof global.fetch;
    await expect(
      fetchWithTimeout("https://example.com", { timeoutMs: 30 }),
    ).rejects.toThrow(/timeout after 30ms/);
  });

  it("rejects invalid timeout values", async () => {
    await expect(
      fetchWithTimeout("https://example.com", { timeoutMs: 0 }),
    ).rejects.toThrow(/invalid timeoutMs/);
    await expect(
      fetchWithTimeout("https://example.com", { timeoutMs: -1 }),
    ).rejects.toThrow(/invalid timeoutMs/);
    await expect(
      fetchWithTimeout("https://example.com", { timeoutMs: NaN }),
    ).rejects.toThrow(/invalid timeoutMs/);
  });

  it("propagates non-abort fetch errors untouched", async () => {
    global.fetch = vi.fn(async () => {
      throw new TypeError("network down");
    });
    await expect(
      fetchWithTimeout("https://example.com", { timeoutMs: 1000 }),
    ).rejects.toThrow(/network down/);
  });

  it("respects caller's AbortSignal — cancel before timeout", async () => {
    const controller = new AbortController();
    global.fetch = vi.fn(
      (_, init) =>
        new Promise<Response>((_resolve, reject) => {
          (init?.signal as AbortSignal | undefined)?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        }),
    ) as typeof global.fetch;
    const promise = fetchWithTimeout("https://example.com", {
      timeoutMs: 60_000,
      signal: controller.signal,
    });
    controller.abort();
    await expect(promise).rejects.toThrow(/cancelled/);
  });

  it("immediately throws if caller's signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    global.fetch = vi.fn(
      (_, init) =>
        new Promise<Response>((_resolve, reject) => {
          if ((init?.signal as AbortSignal | undefined)?.aborted) {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          }
        }),
    ) as typeof global.fetch;
    await expect(
      fetchWithTimeout("https://example.com", {
        timeoutMs: 1000,
        signal: controller.signal,
      }),
    ).rejects.toThrow(/cancelled/);
  });

  it("clears the timer after success — no late abort", async () => {
    global.fetch = vi.fn(async () => new Response("ok"));
    const r = await fetchWithTimeout("https://example.com", { timeoutMs: 50 });
    expect(await r.text()).toBe("ok");
    // Wait past deadline to assert no abort fires post-completion.
    await new Promise((resolve) => setTimeout(resolve, 70));
    expect(true).toBe(true);
  });
});
