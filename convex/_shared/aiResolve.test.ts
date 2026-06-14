import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getFunctionName } from "convex/server";
import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { resolveAI } from "./aiResolve";
import { internal } from "../_generated/api";

// `aiResolve`'s only non-deterministic dependency is `getAuthUserId`; the
// internal AI-settings queries are reached through `ctx.runQuery`, which we
// fake below. Mocking auth lets us drive the authed / anonymous branches.
const { getAuthUserId } = vi.hoisted(() => ({ getAuthUserId: vi.fn() }));
vi.mock("@convex-dev/auth/server", () => ({ getAuthUserId }));

const uid = (s: string) => s as unknown as Id<"users">;

// Stable string keys for the three internal queries `resolveAI` dispatches.
// `internal` is `anyApi` (a Proxy that hands back a fresh object on every
// access path) so we CANNOT compare refs by identity — `getFunctionName`
// yields the stable "module:fn" name and is the only reliable dispatch key.
const Q = {
  user: getFunctionName(internal.ai.queries._getAISettingsForUser),
  global: getFunctionName(internal.ai.queries._getGlobalAISettings),
  override: getFunctionName(internal.ai.queries._getUserModelOverride),
};

type UserCfg = { provider: string; model: string; apiKey: string; baseUrl: string | null } | null;
type GlobalCfg = { provider: string; model: string; apiKey: string; baseUrl: string | null } | null;
type OverrideModel = string | null;

interface CtxOpts {
  user?: UserCfg;
  global?: GlobalCfg;
  override?: OverrideModel;
}

// Fake just enough of `ActionCtx`: a `runQuery` that routes each generated
// function reference to the matching canned result. Anything unexpected
// throws so a typo in the production query path surfaces loudly.
function makeCtx(opts: CtxOpts = {}): { ctx: ActionCtx; runQuery: ReturnType<typeof vi.fn> } {
  const runQuery = vi.fn(async (ref: unknown) => {
    const name = getFunctionName(ref as Parameters<typeof getFunctionName>[0]);
    if (name === Q.user) return opts.user ?? null;
    if (name === Q.global) return opts.global ?? null;
    if (name === Q.override) return opts.override ?? null;
    throw new Error(`unexpected runQuery: ${name}`);
  });
  const ctx = { runQuery } as unknown as ActionCtx;
  return { ctx, runQuery };
}

const ENV_KEYS = ["CONVEX_OPENAI_BASE_URL", "CONVEX_OPENAI_API_KEY"] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  getAuthUserId.mockReset();
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe("resolveAI — path 1: per-user settings win", () => {
  it("returns the user's own provider/key/model with source 'user' and skips global/override", async () => {
    getAuthUserId.mockResolvedValue(uid("u1"));
    const { ctx, runQuery } = makeCtx({
      user: { provider: "openai", model: "gpt-4o", apiKey: "sk-user", baseUrl: null },
      // present-but-ignored: proves user config short-circuits before global
      global: { provider: "groq", model: "llama-3.3-70b-versatile", apiKey: "sk-global", baseUrl: null },
      override: "gpt-4.1",
    });

    const res = await resolveAI(ctx, "fallback-model");

    expect(res).toEqual({
      baseUrl: "https://api.openai.com/v1",
      apiKey: "sk-user",
      model: "gpt-4o",
      source: "user",
    });
    // Only the per-user lookup ran; global + override were never consulted.
    expect(runQuery).toHaveBeenCalledTimes(1);
    const calledNames = runQuery.mock.calls.map((c) => getFunctionName(c[0]));
    expect(calledNames).toEqual([Q.user]);
  });

  it("honours an explicit baseUrl override on the user's settings", async () => {
    getAuthUserId.mockResolvedValue(uid("u1"));
    const { ctx } = makeCtx({
      user: {
        provider: "custom",
        model: "my-model",
        apiKey: "sk-user",
        baseUrl: "https://gw.example.com/v1/",
      },
    });

    const res = await resolveAI(ctx, "fallback-model");

    // trailing slash trimmed by resolveProviderBaseUrl
    expect(res).toMatchObject({ baseUrl: "https://gw.example.com/v1", source: "user" });
  });
});

describe("resolveAI — path 2: admin-global fallback", () => {
  it("falls back to admin-global settings (source 'global') when the user has none", async () => {
    getAuthUserId.mockResolvedValue(uid("u1"));
    const { ctx, runQuery } = makeCtx({
      user: null,
      global: { provider: "openai", model: "gpt-4o-mini", apiKey: "sk-global", baseUrl: null },
      override: null,
    });

    const res = await resolveAI(ctx, "fallback-model");

    expect(res).toEqual({
      baseUrl: "https://api.openai.com/v1",
      apiKey: "sk-global",
      model: "gpt-4o-mini",
      source: "global",
    });
    // user → (null) → global → override(null): all three were consulted.
    const calledNames = runQuery.mock.calls.map((c) => getFunctionName(c[0]));
    expect(calledNames).toEqual([Q.user, Q.global, Q.override]);
  });

  it("uses admin-global directly for an anonymous caller and never looks up an override", async () => {
    // No userId → the per-user model override lookup must be skipped entirely.
    getAuthUserId.mockResolvedValue(null);
    const { ctx, runQuery } = makeCtx({
      global: { provider: "openai", model: "gpt-4o-mini", apiKey: "sk-global", baseUrl: null },
      override: "gpt-4.1", // would be applied IF an override lookup happened — it must not
    });

    const res = await resolveAI(ctx, "fallback-model");

    expect(res).toMatchObject({ model: "gpt-4o-mini", apiKey: "sk-global", source: "global" });
    const calledNames = runQuery.mock.calls.map((c) => getFunctionName(c[0]));
    expect(calledNames).toEqual([Q.global]); // no per-user lookup, no override
  });
});

describe("resolveAI — path 3: per-user model override on top of admin-global", () => {
  it("keeps the global provider/key but swaps in the override model", async () => {
    // This is the exact regression the file's header documents: 4 of 5 prior
    // copies dropped this override, so a premium user stayed on the base model.
    getAuthUserId.mockResolvedValue(uid("u1"));
    const { ctx } = makeCtx({
      user: null,
      global: { provider: "openrouter", model: "openai/gpt-4o-mini", apiKey: "sk-global", baseUrl: null },
      override: "anthropic/claude-sonnet-4.5",
    });

    const res = await resolveAI(ctx, "fallback-model");

    expect(res).toEqual({
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: "sk-global", // shared key unchanged
      model: "anthropic/claude-sonnet-4.5", // override applied on top
      source: "global", // still sourced from global
    });
  });
});

describe("resolveAI — path 4: env default", () => {
  it("uses the env credentials with the fallback model and source 'default'", async () => {
    getAuthUserId.mockResolvedValue(uid("u1"));
    process.env.CONVEX_OPENAI_BASE_URL = "https://proxy.internal/v1/";
    process.env.CONVEX_OPENAI_API_KEY = "sk-env";
    const { ctx } = makeCtx({ user: null, global: null });

    const res = await resolveAI(ctx, "fallback-model");

    expect(res).toEqual({
      baseUrl: "https://proxy.internal/v1", // trailing slashes stripped
      apiKey: "sk-env",
      model: "fallback-model", // env path carries no model → caller's fallback
      source: "default",
    });
  });

  it("works for an anonymous caller too (no settings configured anywhere)", async () => {
    getAuthUserId.mockResolvedValue(null);
    process.env.CONVEX_OPENAI_BASE_URL = "https://proxy.internal/v1";
    process.env.CONVEX_OPENAI_API_KEY = "sk-env";
    const { ctx } = makeCtx({ global: null });

    const res = await resolveAI(ctx, "fallback-model");

    expect(res).toMatchObject({ source: "default", apiKey: "sk-env", model: "fallback-model" });
  });
});

describe("resolveAI — nothing configured anywhere", () => {
  it("returns null when authed but no user/global settings and no env creds", async () => {
    getAuthUserId.mockResolvedValue(uid("u1"));
    delete process.env.CONVEX_OPENAI_BASE_URL;
    delete process.env.CONVEX_OPENAI_API_KEY;
    const { ctx } = makeCtx({ user: null, global: null, override: null });

    await expect(resolveAI(ctx, "fallback-model")).resolves.toBeNull();
  });

  it("returns null when anonymous and nothing is configured", async () => {
    getAuthUserId.mockResolvedValue(null);
    delete process.env.CONVEX_OPENAI_BASE_URL;
    delete process.env.CONVEX_OPENAI_API_KEY;
    const { ctx } = makeCtx({ global: null });

    await expect(resolveAI(ctx, "fallback-model")).resolves.toBeNull();
  });

  it("returns null when only the base URL is set but the API key is missing", async () => {
    // Env path requires BOTH creds — a half-configured env must not leak a
    // result with an empty key.
    getAuthUserId.mockResolvedValue(uid("u1"));
    process.env.CONVEX_OPENAI_BASE_URL = "https://proxy.internal/v1";
    delete process.env.CONVEX_OPENAI_API_KEY;
    const { ctx } = makeCtx({ user: null, global: null });

    await expect(resolveAI(ctx, "fallback-model")).resolves.toBeNull();
  });
});
