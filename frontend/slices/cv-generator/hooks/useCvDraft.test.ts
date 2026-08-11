import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { readDraft } from "./useCvDraft";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  // Vitest runs in the node environment, so there is no window to borrow.
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  };
});

afterEach(() => {
  vi.useRealTimers();
  delete (globalThis as { window?: unknown }).window;
});

describe("readDraft", () => {
  it("returns nothing when no draft was stored", () => {
    expect(readDraft("k")).toBeNull();
  });

  it("round-trips a stored draft", () => {
    store.set("k", JSON.stringify({ at: Date.now(), data: { title: "CV" } }));
    expect(readDraft<{ title: string }>("k")?.data).toEqual({ title: "CV" });
  });

  it("drops a draft older than the max age, and clears it", () => {
    const old = Date.now() - 8 * 24 * 60 * 60 * 1000;
    store.set("k", JSON.stringify({ at: old, data: { title: "CV" } }));
    expect(readDraft("k")).toBeNull();
    expect(store.has("k")).toBe(false);
  });

  it("survives a half-written value from a killed tab", () => {
    store.set("k", '{"at":123,"data":');
    expect(readDraft("k")).toBeNull();
  });

  it("rejects a value that is not the expected shape", () => {
    store.set("k", JSON.stringify({ data: { title: "CV" } }));
    expect(readDraft("k")).toBeNull();
  });
});
