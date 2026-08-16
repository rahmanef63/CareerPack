import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { optionalEnv } from "./env";
import { resolveProviderBaseUrl } from "./aiProviders";
import { decryptCred } from "./aiCrypto";

export interface ResolvedAI {
  baseUrl: string;
  apiKey: string;
  model: string;
  source: "user" | "global" | "default";
}

/**
 * Single source of truth for AI gateway credential resolution.
 *
 * Resolution order: per-user settings → admin global settings (with the
 * admin's per-user model override applied) → env defaults. Returns `null`
 * when nothing is configured anywhere, so each caller decides whether to
 * throw a domain-specific error (cv/plan/chat) or silently fall back
 * (matcher → keyword extraction).
 *
 * Prior to 2026-06-11 this logic was copy-pasted into five action files,
 * and four of the copies skipped the admin-global + per-user-override
 * lookups — so an admin who set a single global key got working chat but
 * broken CV translate / matcher / planner. Keep this the only copy.
 *
 * Being the only copy is also what makes `decryptCred` a two-line change
 * instead of a five-file audit. It runs here, in the ACTION layer, rather
 * than inside the internal queries: an action is the one place where doing
 * crypto on the way out is unambiguously fine, and the queries stay usable
 * by anything that only needs to know whether a key exists.
 *
 * `userIdOverride` is for callers with no browser session — today that means
 * the MCP server, where the request carries an opaque bearer instead of a JWT.
 * Without it `getAuthUserId` does not return null, it THROWS ("Could not parse
 * JWT payload"), and `matcher_scan_ats` failed on every single call over MCP
 * before the credentials were even looked at. The catch below is the second
 * half of that fix: any future caller reached without a session degrades to
 * the global/env key instead of exploding.
 */
export async function resolveAI(
  ctx: ActionCtx,
  fallbackModel: string,
  userIdOverride?: Id<"users">,
): Promise<ResolvedAI | null> {
  const userId = userIdOverride ?? (await getAuthUserId(ctx).catch(() => null));
  if (userId) {
    const cfg = await ctx.runQuery(internal.ai.queries._getAISettingsForUser, { userId });
    if (cfg) {
      return {
        baseUrl: resolveProviderBaseUrl(cfg.provider, cfg.baseUrl ?? undefined),
        apiKey: await decryptCred(cfg.apiKey),
        model: cfg.model,
        source: "user",
      };
    }
  }
  const global = await ctx.runQuery(internal.ai.queries._getGlobalAISettings, {});
  if (global) {
    // Admin per-user model override: same provider/key, different model.
    // Lets admin route premium users to a beefier model on the shared key.
    let model = global.model;
    if (userId) {
      const override = await ctx.runQuery(internal.ai.queries._getUserModelOverride, { userId });
      if (override) model = override;
    }
    return {
      baseUrl: resolveProviderBaseUrl(global.provider, global.baseUrl ?? undefined),
      apiKey: await decryptCred(global.apiKey),
      model,
      source: "global",
    };
  }
  const baseUrl = optionalEnv("CONVEX_OPENAI_BASE_URL");
  const apiKey = optionalEnv("CONVEX_OPENAI_API_KEY");
  if (!baseUrl || !apiKey) return null;
  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
    model: fallbackModel,
    source: "default",
  };
}
