import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConvexError } from "convex/values";
import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// auth.ts's only runtime dependency is `getAuthUserId`; the rest is plain
// `ctx.db` access we fake below. Mocking it lets us drive the
// authenticated / anonymous branches deterministically.
const { getAuthUserId } = vi.hoisted(() => ({ getAuthUserId: vi.fn() }));
vi.mock("@convex-dev/auth/server", () => ({ getAuthUserId }));

type AuthModule = typeof import("./auth");

// `SUPER_ADMIN_EMAIL` is captured at module-eval time, so any scenario that
// depends on it re-imports the module with the env pre-set.
async function loadAuth(superAdminEmail?: string): Promise<AuthModule> {
  vi.resetModules();
  if (superAdminEmail === undefined) delete process.env.SUPER_ADMIN_EMAIL;
  else process.env.SUPER_ADMIN_EMAIL = superAdminEmail;
  return import("./auth");
}

const uid = (s: string) => s as unknown as Id<"users">;
const cvId = (s: string) => s as unknown as Id<"cvs">;

// Guards must throw `ConvexError({ message })` (not a plain `Error`) so prod
// Convex doesn't redact the Indonesian copy to "Server Error". Assert both the
// error type AND the exact, unchanged message text the client reads via
// `err.data.message`.
async function expectConvexError(
  p: Promise<unknown>,
  message: string,
): Promise<void> {
  const err = await p.then(
    () => {
      throw new Error("expected the guard to reject, but it resolved");
    },
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(ConvexError);
  expect((err as ConvexError<{ message: string }>).data).toEqual({ message });
}

interface FakeCtxOpts {
  docs?: Record<string, Record<string, unknown> | null>;
  profile?: { role?: "admin" | "moderator" | "user" } | null;
}

function makeCtx(opts: FakeCtxOpts = {}): QueryCtx {
  const ctx = {
    db: {
      get: vi.fn(async (id: string) => opts.docs?.[id] ?? null),
      query: vi.fn(() => ({
        withIndex: () => ({ first: async () => opts.profile ?? null }),
      })),
    },
  };
  return ctx as unknown as QueryCtx;
}

beforeEach(() => {
  getAuthUserId.mockReset();
});

describe("requireUser", () => {
  it("returns the user id when authenticated", async () => {
    const { requireUser } = await loadAuth();
    getAuthUserId.mockResolvedValue(uid("u1"));
    await expect(requireUser(makeCtx())).resolves.toBe(uid("u1"));
  });

  it("throws a ConvexError with the Indonesian unauth message when anonymous", async () => {
    const { requireUser } = await loadAuth();
    getAuthUserId.mockResolvedValue(null);
    await expectConvexError(requireUser(makeCtx()), "Tidak terautentikasi");
  });
});

describe("optionalUser", () => {
  it("returns the user id when authenticated", async () => {
    const { optionalUser } = await loadAuth();
    getAuthUserId.mockResolvedValue(uid("u1"));
    await expect(optionalUser(makeCtx())).resolves.toBe(uid("u1"));
  });

  it("returns null when anonymous (SSR / logout safe)", async () => {
    const { optionalUser } = await loadAuth();
    getAuthUserId.mockResolvedValue(null);
    await expect(optionalUser(makeCtx())).resolves.toBeNull();
  });
});

describe("requireOwnedDoc", () => {
  it("returns the doc when the caller owns it", async () => {
    const { requireOwnedDoc } = await loadAuth();
    getAuthUserId.mockResolvedValue(uid("u1"));
    const ctx = makeCtx({ docs: { d1: { _id: "d1", userId: uid("u1") } } });
    await expect(requireOwnedDoc(ctx, cvId("d1"), "CV")).resolves.toMatchObject({
      _id: "d1",
    });
  });

  it("throws a ConvexError not-found when the doc is missing", async () => {
    const { requireOwnedDoc } = await loadAuth();
    getAuthUserId.mockResolvedValue(uid("u1"));
    const ctx = makeCtx({ docs: { d1: null } });
    await expectConvexError(
      requireOwnedDoc(ctx, cvId("d1"), "CV"),
      "CV tidak ditemukan",
    );
  });

  // R6: a doc owned by someone else must be indistinguishable from a missing
  // one — same message, no "forbidden" vs "not-found" enumeration leak.
  it("throws the SAME not-found ConvexError when owned by another user", async () => {
    const { requireOwnedDoc } = await loadAuth();
    getAuthUserId.mockResolvedValue(uid("u1"));
    const ctx = makeCtx({ docs: { d1: { _id: "d1", userId: uid("u2") } } });
    await expectConvexError(
      requireOwnedDoc(ctx, cvId("d1"), "CV"),
      "CV tidak ditemukan",
    );
  });

  it('defaults the label to "Data"', async () => {
    const { requireOwnedDoc } = await loadAuth();
    getAuthUserId.mockResolvedValue(uid("u1"));
    const ctx = makeCtx({ docs: { d1: null } });
    await expectConvexError(
      requireOwnedDoc(ctx, cvId("d1")),
      "Data tidak ditemukan",
    );
  });
});

describe("requireAdmin (no super-admin configured)", () => {
  it("passes when the profile role is admin", async () => {
    const { requireAdmin } = await loadAuth();
    getAuthUserId.mockResolvedValue(uid("u1"));
    await expect(requireAdmin(makeCtx({ profile: { role: "admin" } }))).resolves.toBe(
      uid("u1"),
    );
  });

  it("rejects a non-admin role", async () => {
    const { requireAdmin } = await loadAuth();
    getAuthUserId.mockResolvedValue(uid("u1"));
    await expectConvexError(
      requireAdmin(makeCtx({ profile: { role: "user" } })),
      "Bukan admin",
    );
  });

  it("rejects when no profile exists", async () => {
    const { requireAdmin } = await loadAuth();
    getAuthUserId.mockResolvedValue(uid("u1"));
    await expectConvexError(
      requireAdmin(makeCtx({ profile: null })),
      "Bukan admin",
    );
  });
});

describe("requireAdmin (super-admin configured)", () => {
  it("bypasses the role check for the super-admin email even at role=user", async () => {
    const { requireAdmin } = await loadAuth("boss@careerpack.org");
    getAuthUserId.mockResolvedValue(uid("u1"));
    const ctx = makeCtx({
      docs: { u1: { email: "boss@careerpack.org" } },
      profile: { role: "user" },
    });
    await expect(requireAdmin(ctx)).resolves.toBe(uid("u1"));
  });

  it("still rejects a non-super, non-admin caller", async () => {
    const { requireAdmin } = await loadAuth("boss@careerpack.org");
    getAuthUserId.mockResolvedValue(uid("u1"));
    const ctx = makeCtx({
      docs: { u1: { email: "someone@else.com" } },
      profile: { role: "user" },
    });
    await expectConvexError(requireAdmin(ctx), "Bukan admin");
  });
});

describe("requireSuperAdmin", () => {
  it("rejects with a generic ConvexError when no super-admin is configured", async () => {
    const { requireSuperAdmin } = await loadAuth();
    getAuthUserId.mockResolvedValue(uid("u1"));
    await expectConvexError(requireSuperAdmin(makeCtx()), "Tidak berwenang");
  });

  it("passes for the configured super-admin email", async () => {
    const { requireSuperAdmin } = await loadAuth("boss@careerpack.org");
    getAuthUserId.mockResolvedValue(uid("u1"));
    const ctx = makeCtx({ docs: { u1: { email: "boss@careerpack.org" } } });
    await expect(requireSuperAdmin(ctx)).resolves.toBe(uid("u1"));
  });

  it("rejects a different email with the same generic ConvexError", async () => {
    const { requireSuperAdmin } = await loadAuth("boss@careerpack.org");
    getAuthUserId.mockResolvedValue(uid("u1"));
    const ctx = makeCtx({ docs: { u1: { email: "someone@else.com" } } });
    await expectConvexError(requireSuperAdmin(ctx), "Tidak berwenang");
  });
});

describe("isSuperAdminCaller", () => {
  it("returns false when no super-admin is configured", async () => {
    const { isSuperAdminCaller } = await loadAuth();
    getAuthUserId.mockResolvedValue(uid("u1"));
    await expect(isSuperAdminCaller(makeCtx())).resolves.toBe(false);
  });

  it("returns false for an anonymous caller", async () => {
    const { isSuperAdminCaller } = await loadAuth("boss@careerpack.org");
    getAuthUserId.mockResolvedValue(null);
    await expect(isSuperAdminCaller(makeCtx())).resolves.toBe(false);
  });

  it("returns true only for the configured super-admin email", async () => {
    const { isSuperAdminCaller } = await loadAuth("boss@careerpack.org");
    getAuthUserId.mockResolvedValue(uid("u1"));
    const ctx = makeCtx({ docs: { u1: { email: "boss@careerpack.org" } } });
    await expect(isSuperAdminCaller(ctx)).resolves.toBe(true);
  });

  it("returns false for a non-super email", async () => {
    const { isSuperAdminCaller } = await loadAuth("boss@careerpack.org");
    getAuthUserId.mockResolvedValue(uid("u1"));
    const ctx = makeCtx({ docs: { u1: { email: "x@y.com" } } });
    await expect(isSuperAdminCaller(ctx)).resolves.toBe(false);
  });
});
