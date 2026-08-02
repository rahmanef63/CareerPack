import { describe, it, expect, vi } from "vitest";
import { ConvexError } from "convex/values";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

import { humanMessage } from "./notify";

describe("humanMessage()", () => {
  it("strips Convex server-error envelope + stack frames", () => {
    const raw =
      "[CONVEX A(translateCV:translate)] [Request ID: abc123] Server ErrorUncaught Error: [env] CONVEX_OPENAI_BASE_URL wajib diisi di Convex dashboard\n    at requireEnv (../../convex/_lib/env.ts:5:9)\n    at resolveAI (../convex/translateCV.ts:53:23)";
    const err = new Error(raw);
    // Matches the "env unset" friendly mapping — not the raw string.
    expect(humanMessage(err, "fallback")).toBe(
      "Layanan AI belum dikonfigurasi. Hubungi admin untuk mengaktifkan.",
    );
  });

  it("maps 'Tidak terautentikasi' to session-expired UX string", () => {
    const err = new Error(
      "[CONVEX A(cv:updateCV)] Server ErrorUncaught Error: Tidak terautentikasi",
    );
    expect(humanMessage(err, "fallback")).toMatch(/login ulang/i);
  });

  it("passes through plain Indonesian messages when unknown", () => {
    const err = new Error("Judul wajib diisi");
    expect(humanMessage(err, "fallback")).toBe("Judul wajib diisi");
  });

  it("extracts ConvexError.data.message", () => {
    const err = new ConvexError({ message: "Kuota harian habis" });
    expect(humanMessage(err, "fallback")).toBe("Kuota harian habis");
  });

  it("returns fallback for non-Error values", () => {
    expect(humanMessage(null, "fallback")).toBe("fallback");
    expect(humanMessage(undefined, "fallback")).toBe("fallback");
    expect(humanMessage(42, "fallback")).toBe("fallback");
  });

  it("handles string inputs with stack frames", () => {
    const raw =
      "Uncaught Error: Koneksi timeout\n    at fetchCV (app.js:12)\n    at handler (app.js:20)";
    expect(humanMessage(raw, "fallback")).toBe("Koneksi timeout");
  });

  it("maps network errors to connection UX string", () => {
    const err = new TypeError("Failed to fetch");
    expect(humanMessage(err, "fallback")).toMatch(/koneksi/i);
  });
});
