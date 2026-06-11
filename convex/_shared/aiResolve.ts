import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { optionalEnv } from "./env";
import { resolveProviderBaseUrl } from "./aiProviders";

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
 */
export async function resolveAI(
  ctx: ActionCtx,
  fallbackModel: string,
): Promise<ResolvedAI | null> {
  const userId = await getAuthUserId(ctx);
  if (userId) {
    const cfg = await ctx.runQuery(internal.ai.queries._getAISettingsForUser, { userId });
    if (cfg) {
      return {
        baseUrl: resolveProviderBaseUrl(cfg.provider, cfg.baseUrl ?? undefined),
        apiKey: cfg.apiKey,
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
      apiKey: global.apiKey,
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
